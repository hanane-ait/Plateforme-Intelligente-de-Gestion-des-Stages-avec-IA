import json
from pathlib import Path
from groq import Groq
from django.conf import settings

from .assistant_context import build_assistant_system_prompt

MODEL = settings.GROQ_MODEL


def _get_groq_client():
    api_key = settings.GROQ_API_KEY
    if not api_key:
        raise ValueError(
            "GROQ_API_KEY manquante. Ajoutez-la dans le fichier .env à la racine du projet."
        )
    return Groq(api_key=api_key)


def _call_groq(prompt: str, system: str = "Tu es un expert en recrutement IT.") -> str:
    """Appel de base à l'API Groq — retourne le texte brut de la réponse."""
    response = _get_groq_client().chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        max_tokens=1000,
    )
    return response.choices[0].message.content.strip()


def _parse_json_response(content: str) -> dict:
    """Nettoie et parse la réponse JSON du LLM de manière sécurisée."""
    # Supprime les balises markdown si le LLM en ajoute
    if "```" in content:
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
    return json.loads(content.strip())


# =========================================================
# FONCTION 1 — Extraction des compétences du CV
# =========================================================

def extract_skills_from_cv_with_grok(cv_text: str) -> dict:
    """
    Analyse un CV et extrait les compétences, technologies et un résumé.
    Retourne un dict avec 'summary' et 'skills'.
    """
    prompt = f"""
Analyse ce CV et extrais les informations suivantes.

Retourne UNIQUEMENT un JSON valide, sans texte avant ou après :

{{
    "summary": "Résumé court du profil en 2-3 phrases",
    "skills": ["Python", "Django", "React", "SQL"]
}}

CV :
{cv_text[:3000]}
"""
    content = _call_groq(prompt)
    return _parse_json_response(content)


# =========================================================
# FONCTION 2 — Analyse CV + Score matching avec une offre
# =========================================================

def analyze_cv_with_grok(cv_text: str, offer) -> dict:
    """
    Compare un CV avec une offre de stage.
    Retourne un dict avec score, résumé, compétences et recommandation.
    """
    offer_info = f"""
Titre : {offer.title}
Description : {offer.description}
Compétences requises : {', '.join(offer.skills_required) if isinstance(offer.skills_required, list) else offer.skills_required}
Technologies : {', '.join(offer.technologies) if isinstance(offer.technologies, list) else offer.technologies}
"""

    prompt = f"""
Tu es un recruteur automatisé. Compare ce CV avec cette offre de stage.

Retourne UNIQUEMENT un JSON valide, sans texte avant ou après :

{{
    "ai_matching_score": 85,
    "ai_analysis_summary": "Analyse détaillée du candidat par rapport au poste...",
    "skills": ["Python", "React"],
    "recommendation": "Ce candidat est recommandé car..."
}}

OFFRE :
{offer_info}

CV :
{cv_text[:3000]}
"""
    content = _call_groq(prompt)
    return _parse_json_response(content)


# =========================================================
# FONCTION 3 — Génération automatique de lettre de motivation
# =========================================================

def generate_cover_letter(cv_text: str, offer) -> str:
    """
    Génère une lettre de motivation personnalisée basée sur le CV et l'offre.
    Retourne une chaîne de texte (la lettre).
    """
    offer_info = f"""
Titre du poste : {offer.title}
Description : {offer.description}
Compétences requises : {', '.join(offer.skills_required) if isinstance(offer.skills_required, list) else offer.skills_required}
Technologies : {', '.join(offer.technologies) if isinstance(offer.technologies, list) else offer.technologies}
Localisation : {offer.location}
"""

    prompt = f"""
Tu es un expert en rédaction de lettres de motivation professionnelles.

À partir du CV et de l'offre de stage ci-dessous, génère une lettre de motivation 
personnalisée, professionnelle et convaincante en français.

La lettre doit :
- Être adressée à l'entreprise qui publie l'offre
- Mettre en avant les compétences du candidat qui correspondent à l'offre
- Avoir une introduction, un développement et une conclusion
- Faire environ 250-300 mots
- Être directement utilisable (pas de placeholders comme [Nom])

Retourne UNIQUEMENT le texte de la lettre, sans titre ni commentaire.

OFFRE :
{offer_info}

CV :
{cv_text[:2000]}
"""
    return _call_groq(
        prompt,
        system="Tu es un expert en rédaction de lettres de motivation professionnelles en français."
    )


# =========================================================
# FONCTION 4 — Classement des candidats pour une offre
# =========================================================

def rank_candidates(applications: list, offer) -> list:
    """
    Prend une liste d'objets Application et les classe par pertinence pour l'offre.
    Retourne une liste de dicts : [{ "application_id": 1, "rank": 1, "justification": "..." }]
    """
    offer_info = f"""
Titre : {offer.title}
Description : {offer.description}
Compétences requises : {', '.join(offer.skills_required) if isinstance(offer.skills_required, list) else offer.skills_required}
Technologies : {', '.join(offer.technologies) if isinstance(offer.technologies, list) else offer.technologies}
"""

    # Construction du résumé de chaque candidat
    candidates_info = ""
    for app in applications:
        candidates_info += f"""
Candidat ID {app.id} ({app.student.username}) :
- Score IA existant : {app.ai_matching_score or 'Non analysé'}
- Résumé IA : {app.ai_analysis_summary or 'Aucun résumé disponible'}
---
"""

    prompt = f"""
Tu es un recruteur senior. Classe ces candidats du plus au moins adapté pour ce poste.

Retourne UNIQUEMENT un JSON valide, sans texte avant ou après :

{{
    "ranking": [
        {{
            "application_id": 1,
            "rank": 1,
            "justification": "Ce candidat est le meilleur car..."
        }}
    ]
}}

OFFRE :
{offer_info}

CANDIDATS :
{candidates_info}
"""
    content = _call_groq(prompt)
    result = _parse_json_response(content)
    return result.get("ranking", [])

# =========================================================
# FONCTION 5 — Analyse texte post-entretien
# =========================================================

def analyze_meeting_text(text: str) -> str:
    """
    Prend les notes textuelles d'un étudiant après un entretien
    et retourne un feedback + conseils personnalisés via Groq.
    """
    prompt = f"""
Tu es un coach carrière expérimenté, bienveillant et structuré.

À partir des notes ci-dessous, génère un retour clair et complet en texte brut uniquement.

Le format doit être exactement :

Résumé de ce qui s'est bien passé:
- point 1
- point 2
- point 3

Points à améliorer:
- point 1
- point 2
- point 3

Conseils concrets pour les prochains entretiens:
- point 1
- point 2
- point 3

Évaluation générale:
- conclusion simple et positive

Ne fais PAS apparaître de mise en forme Markdown, pas de `**`, `*`, de titres en gras, pas de backticks, et pas de code.
Réponds en français uniquement.

NOTES DE L'ÉTUDIANT :
{text[:2000]}
"""
    return _call_groq(
        prompt,
        system="Tu es un coach carrière expert, bienveillant et constructif."
    )


# =========================================================
# FONCTION 6 — Transcription audio + analyse post-entretien
# =========================================================

SUPPORTED_AUDIO_EXTENSIONS = {
    'flac', 'mp3', 'mp4', 'mpeg', 'mpga', 'm4a',
    'ogg', 'opus', 'wav', 'webm'
}


def _normalize_upload_file(uploaded_file):
    """Convertit un Django UploadedFile en un objet fichier accepté par Groq."""
    if hasattr(uploaded_file, 'file'):
        file_obj = uploaded_file.file
        filename = getattr(uploaded_file, 'name', None)
    else:
        file_obj = uploaded_file
        filename = getattr(uploaded_file, 'name', None)

    if hasattr(file_obj, 'seek'):
        try:
            file_obj.seek(0)
        except Exception:
            pass

    if filename:
        return (filename, file_obj)
    return file_obj


def _validate_audio_file(audio_file):
    filename = getattr(audio_file, 'name', None)
    if filename:
        ext = Path(filename).suffix.lower().lstrip('.')
        if ext and ext not in SUPPORTED_AUDIO_EXTENSIONS:
            raise ValueError(
                f"Format audio non supporté : '{ext}'. Formats supportés : {', '.join(sorted(SUPPORTED_AUDIO_EXTENSIONS))}."
            )


def transcribe_and_analyze_audio(audio_file) -> dict:
    """
    Transcrit un fichier audio via Groq Whisper,
    puis analyse la transcription avec analyze_meeting_text.
    Retourne un dict avec 'transcript' et 'ai_feedback'.
    """
    _validate_audio_file(audio_file)
    normalized_file = _normalize_upload_file(audio_file)
    transcription = _get_groq_client().audio.transcriptions.create(
        model="whisper-large-v3",
        file=normalized_file,
        response_format="text",
        language="fr"
    )

    transcript_text = transcription if isinstance(transcription, str) else transcription.text

    feedback = analyze_meeting_text(transcript_text)

    return {
        "transcript": transcript_text,
        "ai_feedback": feedback
    }


def assistant_chat(user, message: str, history=None) -> str:
    """Conversation guidée avec contexte app + stats utilisateur."""
    history = history or []
    system = build_assistant_system_prompt(user)

    messages = [{"role": "system", "content": system}]
    for item in history[-10:]:
        role = item.get("role")
        content = (item.get("content") or "").strip()
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content[:4000]})
    messages.append({"role": "user", "content": message[:4000]})

    response = _get_groq_client().chat.completions.create(
        model=MODEL,
        messages=messages,
        temperature=0.5,
        max_tokens=1200,
    )
    return response.choices[0].message.content.strip()