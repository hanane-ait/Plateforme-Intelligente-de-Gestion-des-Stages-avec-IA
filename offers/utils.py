import pdfplumber
import re



def extract_text_from_pdf(pdf_path):

    text = ""

    try:
        with pdfplumber.open(pdf_path) as pdf:

            for page in pdf.pages:

                page_text = page.extract_text()

                if page_text:
                    text += page_text + " "

    except Exception as e:
        print(e)

    return text

def analyze_cv_and_match(cv_file_path, skills_required, technologies):
    """
    Analyse le texte du CV et calcule un score de correspondance (0-100%)
    en fonction des listes skills_required et technologies de l'offre.
    """
    # 1. Extraction du texte
    cv_text = extract_text_from_pdf(cv_file_path)
    
    if not cv_text:
        return 0, "Impossible d'extraire le contenu du CV ou fichier illisible."

    # Unification de tous les mots-clés recherchés
    all_keywords = list(set([str(k).lower().strip() for k in (skills_required + technologies)]))
    
    if not all_keywords:
        return 100, "L'offre ne spécifie aucun mot-clé requis. Profil accepté par défaut."

    # 2. Comptage des correspondances exactes (NLP Keyword Matching)
    matched_keywords = []
    for keyword in all_keywords:
        # Utilisation de Regex pour éviter les faux positifs (ex: repérer 'Java' mais pas 'JavaScript')
        pattern = r'\b' + re.escape(keyword) + r'\b'
        if re.search(pattern, cv_text):
            matched_keywords.append(keyword)

    # 3. Calcul du score de matching (%)
    total_keywords = len(all_keywords)
    matched_count = len(matched_keywords)
    
    score = int((matched_count / total_keywords) * 100) if total_keywords > 0 else 0

    # 4. Génération d'un résumé automatique textuel
    if score >= 70:
        summary = f"Excellent profil. Correspondance forte ({score}%). Compétences clés détectées : {', '.join(matched_keywords)}."
    elif score >= 40:
        summary = f"Profil intermédiaire ({score}%). Possède certaines bases : {', '.join(matched_keywords)}. Manque certains prérequis."
    else:
        summary = f"Faible correspondance ({score}%). Mots-clés trouvés : {', '.join(matched_keywords) if matched_keywords else 'Aucun'}."

    return score, summary, matched_keywords