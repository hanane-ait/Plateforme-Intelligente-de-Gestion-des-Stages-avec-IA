import requests
import json

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL = "llama3"


def call_ollama(prompt):
    headers = {
        "Content-Type": "application/json"
    }

    data = {
        "model": MODEL,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "stream": False
    }

    response = requests.post(OLLAMA_URL, headers=headers, json=data)
    result = response.json()

    return result["message"]["content"]


def extract_skills_from_cv_with_ollama(cv_text):
    prompt = f"""
Tu es un expert en recrutement IT. Analyse ce CV et extrais :

1. Les compétences techniques (React, Django, Python, SQL, Docker...)
2. Un résumé court du profil

Retourne UNIQUEMENT un JSON valide :

{{
    "summary": "Résumé du profil...",
    "skills": ["Python", "Django", "SQL"]
}}

CV :
{cv_text}
"""

    content = call_ollama(prompt)

    if content.startswith("```"):
        content = content.strip("```json").strip("```").strip()

    return json.loads(content)


def analyze_cv_with_ollama(cv_text, offer_description):
    prompt = f"""
Tu es un recruteur automatisé.

Compare le CV avec l'offre et retourne UNIQUEMENT un JSON :

{{
    "ai_matching_score": 85,
    "ai_analysis_summary": "Analyse du candidat..."
}}

OFFRE :
{offer_description}

CV :
{cv_text}
"""

    content = call_ollama(prompt)

    if content.startswith("```"):
        content = content.strip("```json").strip("```").strip()

    return json.loads(content)


# =========================================================
# 🔥 COMPATIBILITÉ AVEC TON ANCIEN CODE (IMPORTANT)
# =========================================================

extract_skills_from_cv_with_grok = extract_skills_from_cv_with_ollama
analyze_cv_with_grok = analyze_cv_with_ollama