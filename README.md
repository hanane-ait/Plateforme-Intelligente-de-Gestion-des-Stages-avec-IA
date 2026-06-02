# TalentAI — Plateforme Intelligente de Gestion des Stages

> Plateforme web full-stack connectant étudiants et entreprises grâce à l'intelligence artificielle, développée dans le cadre du Master Systèmes Distribués et Intelligence Artificielle — ENSET Mohammedia, Université Hassan II de Casablanca.

---

## Introduction

La recherche de stage constitue une étape cruciale dans le parcours académique des étudiants. Pourtant, ce processus reste aujourd'hui fragmenté, chronophage et peu adapté aux besoins réels des deux parties : les étudiants peinent à identifier les offres correspondant à leur profil, tandis que les entreprises consacrent un temps considérable à l'analyse manuelle des candidatures reçues.

**TalentAI** est une réponse concrète à ces problématiques. C'est une plateforme intelligente de gestion des stages qui centralise l'ensemble du cycle de recrutement — de la publication d'une offre jusqu'au feedback post-entretien — en exploitant les capacités de l'intelligence artificielle pour automatiser, recommander et assister.

---

## Problématique

Plusieurs difficultés ont été identifiées dans le processus actuel de recherche et de gestion des stages :

**Du côté étudiant :**
- Difficulté à identifier les offres adaptées à ses compétences parmi de nombreuses annonces
- Absence de recommandations personnalisées basées sur le profil réel
- Aucun outil d'aide à la rédaction de candidatures
- Manque de suivi centralisé et transparent des candidatures envoyées
- Aucun retour structuré après les entretiens

**Du côté entreprise :**
- Analyse manuelle des CV longue et fastidieuse
- Difficulté à identifier rapidement les profils les plus pertinents
- Absence d'un système de scoring et de classement automatique
- Planification des entretiens déconnectée du workflow de recrutement
- Pas de vue centralisée sur l'ensemble du processus

**Question centrale :**
> *Comment concevoir une plateforme intelligente permettant de faciliter la gestion des stages tout en automatisant l'analyse des candidatures grâce à l'intelligence artificielle ?*

---

## Solution

TalentAI est une plateforme web à deux profils — **Étudiant** et **Recruteur** — qui couvre l'intégralité du cycle de recrutement de stage avec une intégration profonde de l'IA à chaque étape clé.

L'IA intervient à cinq moments distincts du workflow :
1. À la soumission d'une candidature — analyse du CV et calcul du score de matching
2. À la demande — génération automatique de lettre de motivation
3. À la demande — classement IA des candidats pour une offre
4. Après un entretien — feedback et conseils personnalisés à partir d'un audio ou PDF
5. En temps réel — assistant conversationnel intégré

---

## Architecture technique

La plateforme repose sur une architecture client-serveur en trois couches :

| Couche | Technologies |
|---|---|
| Frontend | React.js, Vite, Tailwind CSS, Axios |
| Backend | Django, Django REST Framework, SimpleJWT, SQLite |
| Intelligence Artificielle | Python, API Groq, Whisper (transcription audio) |

- Communication via **API REST** entre frontend et backend
- Authentification sécurisée par **tokens JWT** avec rafraîchissement automatique
- Tous les appels IA sont traités **côté serveur** via un module dédié `ai_services.py`
- Gestion des fichiers uploadés (CV PDF, audio, PDF de notes) via Django

---

## Fonctionnalités

### Espace Étudiant

#### Authentification & Profil
- Création de compte avec rôle Étudiant
- Connexion sécurisée par JWT
- Modification du profil personnel

#### Recherche & Candidature
- Consultation de toutes les offres de stage actives
- Filtrage des offres par correspondance avec son CV grâce à l'IA
- Postulation à une offre avec dépôt du CV en PDF
- Génération automatique d'une lettre de motivation personnalisée par IA en un clic
- Soumission de la candidature complète depuis l'interface

#### Suivi des Candidatures
- Consultation en temps réel du statut de chaque candidature
- Statuts disponibles : En attente · Analysée · Entretien planifié · Acceptée · Refusée · Annulée
- Annulation d'une candidature non finalisée

#### Entretiens
- Consultation des entretiens planifiés avec date, heure et lien de réunion
- Rejoindre l'entretien en un clic via **Jitsi Meet** intégré directement dans la plateforme
- Upload d'un enregistrement audio ou d'un PDF de notes post-entretien
- Génération automatique d'un résumé et de conseils personnalisés par l'IA

#### Statistiques
- Nombre de candidatures envoyées
- Nombre d'offres disponibles sur la plateforme
- Entretiens à venir et entretiens passés
- Répartition graphique des candidatures par statut

#### Assistant IA
- Chatbot conversationnel intégré alimenté par Groq
- Répond aux questions sur la préparation aux entretiens
- Guide l'étudiant dans ses démarches de candidature
- Aide à la navigation dans la plateforme

---

### Espace Recruteur (Entreprise)

#### Authentification & Profil
- Création de compte avec rôle Entreprise
- Connexion sécurisée par JWT
- Modification du profil entreprise (nom, site web, description)

#### Gestion des Offres
- Publication de nouvelles offres de stage (titre, description, lieu, durée, compétences, technologies)
- Modification et désactivation des offres publiées
- Vue centralisée de toutes les offres de l'entreprise

#### Gestion des Candidatures
- Consultation de toutes les candidatures reçues, filtrables par offre
- Visualisation du score de matching IA pour chaque candidature
- Accès au résumé et à l'opinion générés par l'IA sur chaque candidat par rapport à l'offre
- Consultation du CV original du candidat
- Classement automatique de tous les candidats d'une offre par l'IA en un clic
- Acceptation ou refus d'une candidature directement depuis l'interface
- Modification du statut des candidatures

#### Planification des Entretiens
- Planification d'un entretien avec un candidat sélectionné
- Génération automatique d'un lien de réunion Jitsi
- Export de l'entretien vers **Google Calendar** après confirmation
- Vue centralisée de tous les entretiens planifiés

#### Statistiques
- Nombre d'offres publiées
- Nombre de candidatures reçues
- Entretiens planifiés et entretiens passés
- Indicateurs de performance du processus de recrutement

#### Assistant IA
- Chatbot conversationnel dédié au recruteur
- Aide à l'analyse des profils et à la prise de décision
- Répond aux questions sur le processus de recrutement et la plateforme

---

## Installation & Lancement

### Prérequis
- Python 3.10+
- Node.js 18+
- Une clé API Groq (sur [console.groq.com](https://console.groq.com))

### Backend

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Variables d'environnement

Créez un fichier `.env` dans le dossier backend et ajoutez :

GROQ_API_KEY=your_groq_api_key_here
SECRET_KEY=your_django_secret_key
DEBUG=True

---

## Réalisé par

- **HAFSSA MIFTAH IDRISSI**
- **HANANE AIT LHAJ**

Supervisé par **Oumayma AGHERAI**

Master Systèmes Distribués et Intelligence Artificielle
ENSET Mohammedia — Université Hassan II de Casablanca
Année Universitaire 2025-2026
