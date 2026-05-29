from rest_framework import serializers
from .models import InternshipOffer, Application, Interview

class InternshipOfferSerializer(serializers.ModelSerializer):
    company_name = serializers.ReadOnlyField(source='company.username') # Récupère le nom de l'entreprise
    
    # 💡 Champ dynamique calculé par la vue RecommendedOffersView pour l'étudiant
    matching_score = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = InternshipOffer
        fields = '__all__'
        read_only_fields = ['company']


class InterviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interview
        fields = [
            'id',
            'scheduled_at',
            'duration_minutes',
            'meeting_link',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields


class ApplicationSerializer(serializers.ModelSerializer):
    # Ce champ personnalisé renvoie les détails textuels pour le dashboard React
    offer_details = serializers.SerializerMethodField(read_only=True)
    
    # Récupère directement le username de l'étudiant pour l'affichage côté entreprise
    student_username = serializers.ReadOnlyField(source='student.username')
    student_email = serializers.EmailField(source='student.email', read_only=True)
    interview = InterviewSerializer(read_only=True)
    ai_rank = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            'id', 'offer', 'student', 'student_username', 'student_email', 'cv_file', 
            'cover_letter', 'status', 'applied_at', 'offer_details',
            
            # 🤖 Nouveaux champs pour l'analyse automatique du CV par l'IA
            'ai_matching_score', 'ai_analysis_summary',
            
            # Entretien (snapshot + détail structuré)
            'meeting_date', 'meeting_link', 'interview', 'ai_rank',
        ]
        read_only_fields = [
            'student', 'status', 'ai_matching_score', 
            'ai_analysis_summary', 'meeting_date', 'meeting_link', 'interview', 'ai_rank',
        ]

    def get_ai_rank(self, obj):
        ranking = obj.rankings.filter(offer_id=obj.offer_id).first()
        if not ranking:
            return None
        return {
            'rank': ranking.rank,
            'justification': ranking.justification,
            'updated_at': ranking.updated_at,
        }

    def get_offer_details(self, obj):
        return {
            "title": obj.offer.title,
            "company_name": obj.offer.company.username,
            "id": obj.offer.id,
        }


class StudentApplicationSerializer(ApplicationSerializer):
    """Candidatures étudiant — sans analyse IA interne (réservée à l'entreprise)."""

    meeting_review_done = serializers.SerializerMethodField()

    class Meta(ApplicationSerializer.Meta):
        fields = [
            'id', 'offer', 'cv_file', 'cover_letter', 'status', 'applied_at',
            'offer_details', 'meeting_date', 'meeting_link', 'interview', 'meeting_review_done',
        ]

    def get_meeting_review_done(self, obj):
        review = getattr(obj, 'meeting_review', None)
        return bool(review and review.ai_feedback)


from .models import MeetingReview

class MeetingReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = MeetingReview
        fields = ['id', 'application', 'text_note', 'audio_file', 'ai_feedback', 'created_at']
        read_only_fields = ['ai_feedback', 'created_at']