from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from django.db.models import Count
from django.utils.dateparse import parse_datetime
from django.utils import timezone

from .models import Application, InternshipOffer, Interview, CandidateRanking
from .serializers import (
    InternshipOfferSerializer,
    ApplicationSerializer,
    StudentApplicationSerializer,
    InterviewSerializer,
)

from .utils import extract_text_from_pdf

from .models import MeetingReview
from .serializers import MeetingReviewSerializer
from .ai_services import (
    extract_skills_from_cv_with_grok,
    analyze_cv_with_grok,
    generate_cover_letter,
    rank_candidates,
    analyze_meeting_text,
    transcribe_and_analyze_audio,
    assistant_chat,
)

# =========================================================
# PERMISSION ENTREPRISE
# =========================================================

class IsCompanyUser(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        return (
            request.user.is_authenticated
            and getattr(request.user, 'role', None) == 'COMPANY'
        )


class IsOfferOwnerOrReadOnly(permissions.BasePermission):
    """Lecture pour tous les utilisateurs connectés ; écriture réservée au recruteur propriétaire."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return getattr(request.user, 'role', None) == 'COMPANY'

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            getattr(request.user, 'role', None) == 'COMPANY'
            and obj.company_id == request.user.id
        )


# =========================================================
# OFFRES
# =========================================================

class OfferListCreateView(generics.ListCreateAPIView):
    serializer_class = InternshipOfferSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Si l'utilisateur connecté est une entreprise, on filtre uniquement SES offres
        if getattr(user, 'role', None) == 'COMPANY':
            return InternshipOffer.objects.filter(company=user).order_by('-created_at')
            
        # Si c'est un étudiant (ou admin), on affiche toutes les offres actives
        return InternshipOffer.objects.filter(is_active=True).order_by('-created_at')

    def perform_create(self, serializer):
        # Sécurité : On s'assure qu'un étudiant ne peut pas tricher et poster une offre via Postman/Insomnia
        if getattr(self.request.user, 'role', None) != 'COMPANY':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Seules les entreprises peuvent publier des offres.")
            
        serializer.save(company=self.request.user)


class OfferDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = InternshipOffer.objects.all()
    serializer_class = InternshipOfferSerializer
    permission_classes = [IsOfferOwnerOrReadOnly]

    def perform_destroy(self, instance):
        # Désactivation : l'offre disparaît pour les étudiants, les candidatures restent en base
        instance.is_active = False
        instance.save(update_fields=['is_active'])


# =========================================================
# CANDIDATURES ENTREPRISE
# =========================================================

class CompanyApplicationsListView(generics.ListAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Application.objects.filter(
            offer__company=self.request.user
        ).select_related('interview', 'student', 'offer').prefetch_related('rankings').order_by('-applied_at')


# =========================================================
# CANDIDATURES ETUDIANT
# =========================================================

class StudentApplicationsListView(generics.ListAPIView):
    serializer_class = StudentApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Application.objects.filter(
            student=self.request.user
        ).select_related('meeting_review', 'interview').order_by('-applied_at')


# =========================================================
# POSTULER A UNE OFFRE + ANALYSE IA GROK
# =========================================================

class ApplyToOfferView(generics.CreateAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        offer_id = self.kwargs.get('pk')
        offer = InternshipOffer.objects.get(id=offer_id)

        # Sauvegarde de la candidature initiale
        application = serializer.save(
            student=self.request.user,
            offer=offer,
            status='PENDING'
        )

        print("===== ANALYSE IA GROK =====")
        try:
            # =================================================
            # EXTRACTION TEXTE CV
            # =================================================
            cv_path = application.cv_file.path
            print("CV PATH :", cv_path)

            cv_text = extract_text_from_pdf(cv_path)
            print("CV TEXT OK")

            # =================================================
            # ANALYSE GROK
            # =================================================
            ai_result = analyze_cv_with_grok(
                cv_text,
                offer
            )
            print("AI RESULT :", ai_result)

           # =================================================
            # RESULTATS IA (Corrigé avec les bonnes clés de ai_services)
            # =================================================
            score = ai_result.get("ai_matching_score", 0)
            summary = ai_result.get("ai_analysis_summary", "")
            skills = ai_result.get("skills", [])  # Optionnel selon ton prompt Grok
            recommendation = ai_result.get("recommendation", "")
            # =================================================
            # SAUVEGARDE PROFIL ETUDIANT
            # =================================================
            student = application.student
            
            # Sauvegarde sous forme de liste ou chaîne selon votre configuration de modèle
            student.detected_skills = skills
            student.detected_technologies = skills
            student.save()

            # =================================================
            # SAUVEGARDE CANDIDATURE
            # =================================================
            application.ai_matching_score = score
            application.ai_analysis_summary = (
                f"{summary}\n\n"
                f"Recommandation IA : {recommendation}"
            )
            application.status = 'ANALYZED'
            application.save()

            print("===== ANALYSE TERMINÉE =====")

        except Exception as e:
            print("ERREUR GROK :", str(e))
            application.ai_matching_score = 0
            application.ai_analysis_summary = str(e)
            application.status = 'PENDING'
            application.save()


# =========================================================
# PLANIFICATION ENTRETIEN
# =========================================================

def _parse_scheduled_at(value):
    if value is None:
        return None
    if hasattr(value, 'utcoffset'):
        dt = value
    else:
        dt = parse_datetime(str(value))
    if dt is None:
        return None
    if timezone.is_naive(dt):
        dt = timezone.make_aware(dt, timezone.get_current_timezone())
    return dt


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def plan_meeting_view(request, pk):
    try:
        application = Application.objects.select_related('offer', 'interview').get(
            id=pk,
            offer__company=request.user,
        )
    except Application.DoesNotExist:
        return Response(
            {"detail": "Candidature introuvable"},
            status=status.HTTP_404_NOT_FOUND,
        )

    scheduled_at = _parse_scheduled_at(request.data.get('meeting_date'))
    if not scheduled_at:
        return Response(
            {"detail": "Date obligatoire (format ISO valide)."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    meeting_link = (request.data.get('meeting_link') or '').strip()
    if not meeting_link:
        meeting_link = f'{request.build_absolute_uri("/").rstrip("/")}/meeting/{application.id}'

    try:
        duration_minutes = int(request.data.get('duration_minutes', 60))
    except (TypeError, ValueError):
        duration_minutes = 60
    duration_minutes = max(15, min(duration_minutes, 240))

    notes = (request.data.get('notes') or '').strip()

    interview, _created = Interview.objects.update_or_create(
        application=application,
        defaults={
            'scheduled_by': request.user,
            'scheduled_at': scheduled_at,
            'duration_minutes': duration_minutes,
            'meeting_link': meeting_link,
            'notes': notes,
        },
    )

    application.sync_interview_snapshot(interview)

    return Response(
        {
            "detail": "Entretien planifié et enregistré.",
            "status": application.status,
            "meeting_date": application.meeting_date,
            "meeting_link": application.meeting_link,
            "interview": InterviewSerializer(interview).data,
        },
        status=status.HTTP_200_OK,
    )


# =========================================================
# ACCEPTER / REFUSER
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_application_status(request, pk):
    try:
        application = Application.objects.get(
            id=pk,
            offer__company=request.user
        )
    except Application.DoesNotExist:
        return Response(
            {"detail": "Non autorisé"},
            status=status.HTTP_404_NOT_FOUND
        )

    new_status = request.data.get('status')
    allowed_status = ['ACCEPTED', 'REJECTED']

    if new_status not in allowed_status:
        return Response(
            {"detail": "Statut invalide"},
            status=status.HTTP_400_BAD_REQUEST
        )

    application.status = new_status
    application.save()

    return Response(
        {
            "detail": "Statut mis à jour",
            "status": application.status
        }
    )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def cancel_application(request, pk):
    try:
        application = Application.objects.get(
            id=pk,
            student=request.user
        )
    except Application.DoesNotExist:
        return Response(
            {"detail": "Candidature introuvable ou accès refusé."},
            status=status.HTTP_404_NOT_FOUND
        )

    if application.status in ['ACCEPTED', 'REJECTED']:
        return Response(
            {"detail": "Impossible d'annuler une candidature déjà finalisée."},
            status=status.HTTP_400_BAD_REQUEST
        )

    application.delete()

    return Response(
        {"detail": "Candidature annulée avec succès."},
        status=status.HTTP_200_OK
    )


# =========================================================
# RECOMMANDATION IA DES OFFRES (CORRIGÉE ET OPTIMISÉE)
# =========================================================

class RecommendedOffersView(generics.ListAPIView):
    serializer_class = InternshipOfferSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # 1. Extraction et normalisation des compétences de l'étudiant
        skills = getattr(user, 'detected_skills', []) or []
        technologies = getattr(user, 'detected_technologies', []) or []

        # Si les compétences sont stockées sous forme de chaînes de caractères textuelles, on split
        if isinstance(skills, str):
            skills = [s.strip() for s in skills.split(',') if s.strip()]
        if isinstance(technologies, str):
            technologies = [t.strip() for t in technologies.split(',') if t.strip()]

        student_keywords = [
            str(k).lower().strip()
            for k in (skills + technologies)
        ]

        # 2. Récupération de toutes les offres de stage actives
        try:
            offers = InternshipOffer.objects.filter(is_active=True)
        except Exception:
            offers = InternshipOffer.objects.all()

        scored_offers = []

        # 3. Évaluation dynamique de la compatibilité de chaque offre
        for offer in offers:
            offer_skills_raw = offer.skills_required or ""
            offer_tech_raw = offer.technologies or ""

            # Transformation des chaînes de caractères textuelles en listes propres
            if isinstance(offer_skills_raw, str):
                offer_skills = [s.strip() for s in offer_skills_raw.split(',') if s.strip()]
            else:
                offer_skills = list(offer_skills_raw)

            if isinstance(offer_tech_raw, str):
                offer_techs = [t.strip() for t in offer_tech_raw.split(',') if t.strip()]
            else:
                offer_techs = list(offer_tech_raw)

            offer_keywords = [str(k).lower().strip() for k in (offer_skills + offer_techs)]

            # Calcul de l'intersection de mots-clés
            common = set(student_keywords).intersection(set(offer_keywords))
            
            score = 0
            if len(offer_keywords) > 0:
                score = int((len(common) / len(offer_keywords)) * 100)

            # 4. Fallback si l'étudiant débute et n'a pas encore de mots-clés extraits
            if score == 0 and len(student_keywords) == 0:
                score = 30  # Donne un score de base d'intérêt pour ne pas afficher une page vide

            # Bonus de pertinence basé sur le titre du poste (ex: s'il cherche du 'React')
            title_lower = offer.title.lower() if offer.title else ""
            if any(keyword in title_lower for keyword in student_keywords if len(keyword) > 2):
                score += 15

            # Limitation stricte à 100% maximum
            offer.matching_score = min(score, 100)

            # Ajout à la liste (seuil réduit à 10 pour garantir un contenu à afficher)
            if offer.matching_score >= 10:
                scored_offers.append((offer.matching_score, offer))

        # 5. Tri des offres du meilleur matching au moins bon
        scored_offers.sort(
            reverse=True,
            key=lambda x: x[0]
        )

        # 6. Extraction du Top 10 des offres triées
        return [offer for score, offer in scored_offers[:10]]
    

# =========================================================
# GÉNÉRATION LETTRE DE MOTIVATION IA
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_cover_letter_view(request, pk):
    """
    Génère une lettre de motivation personnalisée pour une offre donnée.
    L'étudiant envoie son CV (déjà uploadé) et reçoit une lettre générée par l'IA.
    """
    try:
        offer = InternshipOffer.objects.get(id=pk, is_active=True)
    except InternshipOffer.DoesNotExist:
        return Response(
            {"detail": "Offre introuvable."},
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        # Priorité au CV envoyé dans cette requête (prévisualisation avant candidature).
        uploaded_cv = request.FILES.get('cv_file')
        if uploaded_cv:
            cv_text = extract_text_from_pdf(uploaded_cv)
        else:
            # Fallback: dernier CV déjà envoyé dans une candidature.
            last_application = Application.objects.filter(
                student=request.user
            ).exclude(cv_file='').order_by('-applied_at').first()

            if not last_application:
                return Response(
                    {"detail": "Ajoutez un CV (champ cv_file) ou postulez d'abord à une offre avec votre CV."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            cv_text = extract_text_from_pdf(last_application.cv_file.path)

        if not cv_text.strip():
            return Response(
                {"detail": "Impossible d'extraire du texte depuis le CV fourni."},
                status=status.HTTP_400_BAD_REQUEST
            )

        letter = generate_cover_letter(cv_text, offer)
        return Response({"cover_letter": letter}, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {"detail": f"Erreur lors de la génération : {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# =========================================================
# CLASSEMENT DES CANDIDATS PAR IA (ENTREPRISE)
# =========================================================

def _enrich_ranking_rows(offer, applications, ranking_items, request):
    app_map = {app.id: app for app in applications}
    enriched = []
    for item in ranking_items:
        app_id = item.get("application_id")
        app = app_map.get(app_id)
        if not app:
            continue
        enriched.append({
            "application_id": app.id,
            "rank": item.get("rank"),
            "justification": item.get("justification", ""),
            "student_username": app.student.username,
            "ai_matching_score": app.ai_matching_score,
            "ai_analysis_summary": app.ai_analysis_summary,
            "status": app.status,
            "applied_at": app.applied_at,
            "cv_file": request.build_absolute_uri(app.cv_file.url) if app.cv_file else None,
        })
    enriched.sort(key=lambda x: x.get("rank") or 999)
    return enriched


def _persist_rankings(offer, ranking_items):
    for item in ranking_items:
        app_id = item.get("application_id")
        rank = item.get("rank")
        if not app_id or rank is None:
            continue
        CandidateRanking.objects.update_or_create(
            offer=offer,
            application_id=app_id,
            defaults={
                "rank": rank,
                "justification": item.get("justification") or "",
            },
        )


def _rankings_from_db(offer, applications, request):
    rankings = CandidateRanking.objects.filter(offer=offer).select_related("application__student")
    if not rankings.exists():
        return []
    app_map = {app.id: app for app in applications}
    enriched = []
    for row in rankings:
        app = app_map.get(row.application_id)
        if not app:
            continue
        enriched.append({
            "application_id": app.id,
            "rank": row.rank,
            "justification": row.justification,
            "student_username": app.student.username,
            "ai_matching_score": app.ai_matching_score,
            "ai_analysis_summary": app.ai_analysis_summary,
            "status": app.status,
            "applied_at": app.applied_at,
            "cv_file": request.build_absolute_uri(app.cv_file.url) if app.cv_file else None,
        })
    enriched.sort(key=lambda x: x["rank"])
    return enriched


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def rank_candidates_view(request, pk):
    """
    GET : classement enregistré en base.
    POST : recalcule via Groq et enregistre (CandidateRanking).
    """
    if getattr(request.user, 'role', None) != 'COMPANY':
        return Response(
            {"detail": "Accès réservé aux entreprises."},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        offer = InternshipOffer.objects.get(id=pk, company=request.user)
    except InternshipOffer.DoesNotExist:
        return Response(
            {"detail": "Offre introuvable ou non autorisée."},
            status=status.HTTP_404_NOT_FOUND,
        )

    applications = list(Application.objects.filter(offer=offer).select_related('student'))

    if not applications:
        return Response({"ranking": [], "detail": "Aucune candidature pour cette offre."})

    if request.method == 'GET':
        enriched = _rankings_from_db(offer, applications, request)
        latest = CandidateRanking.objects.filter(offer=offer).order_by('-updated_at').first()
        return Response({
            "ranking": enriched,
            "from_cache": True,
            "computed_at": latest.updated_at if latest else None,
        })

    try:
        ranking = rank_candidates(applications, offer)
        _persist_rankings(offer, ranking)
        enriched = _enrich_ranking_rows(offer, applications, ranking, request)
        return Response({"ranking": enriched, "from_cache": False}, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {"detail": f"Erreur lors du classement : {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    

# =========================================================
# ANALYSE TEXTE POST-ENTRETIEN
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_meeting_text_view(request, pk):
    """
    Reçoit les notes textuelles d'un étudiant après son entretien.
    Génère un feedback IA et le sauvegarde dans MeetingReview.
    """
    try:
        application = Application.objects.get(id=pk, student=request.user)
    except Application.DoesNotExist:
        return Response(
            {"detail": "Candidature introuvable."},
            status=status.HTTP_404_NOT_FOUND
        )

    text_note = request.data.get('text_note', '').strip()
    if not text_note:
        return Response(
            {"detail": "Le champ text_note est obligatoire."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        feedback = analyze_meeting_text(text_note)

        review, _ = MeetingReview.objects.update_or_create(
            application=application,
            defaults={
                'text_note': text_note,
                'ai_feedback': feedback,
            }
        )

        return Response(
            {
                "ai_feedback": feedback,
                "review_id": review.id
            },
            status=status.HTTP_200_OK
        )

    except Exception as e:
        return Response(
            {"detail": f"Erreur lors de l'analyse : {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# =========================================================
# ANALYSE AUDIO POST-ENTRETIEN
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_meeting_audio_view(request, pk):
    """
    Reçoit un fichier audio de l'étudiant après son entretien.
    Transcrit via Groq Whisper, génère un feedback IA, sauvegarde dans MeetingReview.
    """
    try:
        application = Application.objects.get(id=pk, student=request.user)
    except Application.DoesNotExist:
        return Response(
            {"detail": "Candidature introuvable."},
            status=status.HTTP_404_NOT_FOUND
        )

    audio_file = request.FILES.get('audio_file')
    if not audio_file:
        return Response(
            {"detail": "Le fichier audio est obligatoire."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        result = transcribe_and_analyze_audio(audio_file)

        review, _ = MeetingReview.objects.update_or_create(
            application=application,
            defaults={
                'audio_file': audio_file,
                'text_note': result['transcript'],
                'ai_feedback': result['ai_feedback'],
            }
        )

        return Response(
            {
                "transcript": result['transcript'],
                "ai_feedback": result['ai_feedback'],
                "review_id": review.id
            },
            status=status.HTTP_200_OK
        )

    except Exception as e:
        return Response(
            {"detail": f"Erreur lors de la transcription/analyse : {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# =========================================================
# ANALYSE PDF POST-ENTRETIEN (notes écrites)
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_meeting_pdf_view(request, pk):
    """
    Reçoit un PDF de notes après entretien, extrait le texte et génère un feedback IA.
    """
    try:
        application = Application.objects.get(id=pk, student=request.user)
    except Application.DoesNotExist:
        return Response(
            {"detail": "Candidature introuvable."},
            status=status.HTTP_404_NOT_FOUND
        )

    pdf_file = request.FILES.get('pdf_file')
    if not pdf_file:
        return Response(
            {"detail": "Le fichier PDF est obligatoire."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        import tempfile
        import os

        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            for chunk in pdf_file.chunks():
                tmp.write(chunk)
            tmp_path = tmp.name

        try:
            text_note = extract_text_from_pdf(tmp_path).strip()
        finally:
            os.unlink(tmp_path)

        if not text_note:
            return Response(
                {"detail": "Impossible d'extraire du texte depuis le PDF."},
                status=status.HTTP_400_BAD_REQUEST
            )

        feedback = analyze_meeting_text(text_note)

        review, _ = MeetingReview.objects.update_or_create(
            application=application,
            defaults={
                'text_note': text_note,
                'ai_feedback': feedback,
            }
        )

        return Response(
            {
                "ai_feedback": feedback,
                "review_id": review.id,
            },
            status=status.HTTP_200_OK
        )

    except Exception as e:
        return Response(
            {"detail": f"Erreur lors de l'analyse du PDF : {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# =========================================================
# STATISTIQUES DASHBOARD (graphiques)
# =========================================================

STATUS_LABELS = {
    'PENDING': 'En attente',
    'ANALYZED': 'Analysée',
    'INTERVIEW': 'Entretien',
    'ACCEPTED': 'Acceptée',
    'REJECTED': 'Refusée',
}


def _status_distribution(queryset):
    rows = queryset.values('status').annotate(count=Count('id')).order_by('-count')
    return [
        {
            'key': row['status'],
            'label': STATUS_LABELS.get(row['status'], row['status']),
            'count': row['count'],
        }
        for row in rows
    ]


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_dashboard_stats_view(request):
    if getattr(request.user, 'role', None) != 'STUDENT':
        return Response({'detail': 'Réservé aux étudiants.'}, status=status.HTTP_403_FORBIDDEN)

    apps = Application.objects.filter(student=request.user)
    now = timezone.now()
    upcoming_meetings = apps.filter(meeting_date__gte=now).count()
    past_meetings = apps.filter(meeting_date__lt=now).exclude(meeting_date__isnull=True).count()

    return Response({
        'applications_total': apps.count(),
        'applications_by_status': _status_distribution(apps),
        'meetings_upcoming': upcoming_meetings,
        'meetings_past': past_meetings,
        'offers_available': InternshipOffer.objects.filter(is_active=True).count(),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def company_dashboard_stats_view(request):
    if getattr(request.user, 'role', None) != 'COMPANY':
        return Response({'detail': 'Réservé aux entreprises.'}, status=status.HTTP_403_FORBIDDEN)

    user = request.user
    offers = InternshipOffer.objects.filter(company=user)
    apps = Application.objects.filter(offer__company=user)
    now = timezone.now()

    by_offer = []
    for row in apps.values('offer_id', 'offer__title').annotate(count=Count('id')).order_by('-count')[:6]:
        by_offer.append({
            'offer_id': row['offer_id'],
            'label': row['offer__title'] or 'Sans titre',
            'count': row['count'],
        })

    upcoming_interviews = Interview.objects.filter(
        application__offer__company=user,
        scheduled_at__gte=now,
    ).count()

    return Response({
        'offers_total': offers.count(),
        'offers_active': offers.filter(is_active=True).count(),
        'offers_inactive': offers.filter(is_active=False).count(),
        'applications_total': apps.count(),
        'applications_by_status': _status_distribution(apps),
        'applications_by_offer': by_offer,
        'interviews_upcoming': upcoming_interviews,
    })


# =========================================================
# ASSISTANT IA CHAT
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def assistant_chat_view(request):
    message = (request.data.get('message') or '').strip()
    if not message:
        return Response({'detail': 'Message requis.'}, status=status.HTTP_400_BAD_REQUEST)

    history = request.data.get('history') or []
    if not isinstance(history, list):
        history = []

    try:
        reply = assistant_chat(request.user, message, history)
        return Response({'reply': reply})
    except ValueError as e:
        return Response({'detail': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except Exception as e:
        return Response(
            {'detail': f"Erreur assistant : {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )