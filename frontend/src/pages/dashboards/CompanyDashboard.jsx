import { useEffect, useState } from 'react';
import API from '../../services/api';

export default function CompanyDashboard() {
    const [myOffers, setMyOffers] = useState([]);
    const [receivedApplications, setReceivedApplications] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loadingAction, setLoadingAction] = useState(null); // Gère le chargement par candidature

    // FORM STATES
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [duration, setDuration] = useState('');

    // IA FIELDS
    const [skillsRequired, setSkillsRequired] = useState('');
    const [technologies, setTechnologies] = useState('');

    useEffect(() => {
        fetchOffersAndApplications();
    }, []);

    // LOAD DATA
    const fetchOffersAndApplications = async () => {
        try {
            const offersRes = await API.get('offers/');
            setMyOffers(offersRes.data);

            const appsRes = await API.get('offers/received/');
            setReceivedApplications(appsRes.data);
        } catch (err) {
            console.error("Erreur chargement :", err);
        }
    };

    // CREATE OFFER
    const handleCreateOffer = async (e) => {
        e.preventDefault();
        try {
            await API.post('offers/', {
                title,
                description,
                location,
                duration,
                skills_required: skillsRequired ? skillsRequired.split(',').map(s => s.trim()) : [],
                technologies: technologies ? technologies.split(',').map(t => t.trim()) : [],
            });

            alert("Offre publiée avec succès !");

            // RESET
            setTitle('');
            setDescription('');
            setLocation('');
            setDuration('');
            setSkillsRequired('');
            setTechnologies('');
            setShowForm(false);

            fetchOffersAndApplications();
        } catch (err) {
            console.error(
                "Erreur création :",
                err.response?.data || err.message
            );
            alert("Erreur lors de la création");
        }
    };

    // DELETE OFFER
    const handleDeleteOffer = async (id) => {
        if (window.confirm("Supprimer cette offre ?")) {
            try {
                await API.delete(`offers/${id}/`);
                alert("Offre supprimée avec succès.");
                fetchOffersAndApplications();
            } catch (err) {
                console.error(err);
                alert("Erreur lors de la suppression.");
            }
        }
    };

    // UPDATE STATUS (Accepter / Refuser)
    const updateStatus = async (id, status) => {
        setLoadingAction(id);
        try {
            // URL corrigée avec le préfixe 'offers/' correspondant au urls.py de Django
            await API.post(`offers/applications/${id}/status/`, { status });

            alert(`Candidature mise à jour avec succès : ${status}`);
            await fetchOffersAndApplications();
        } catch (err) {
            console.error("Erreur mise à jour statut :", err.response?.data || err.message);
            alert("Erreur lors du changement de statut.");
        } finally {
            setLoadingAction(null);
        }
    };

    // PLAN MEETING
    const planMeeting = async (id) => {
        const meeting_date = prompt(
            "Entrer date réunion (Format: AAAA-MM-JJ HH:MM) :",
            "2026-05-30 14:00"
        );
        if (!meeting_date) return;

        const meeting_link = prompt(
            "Entrer lien Google Meet :"
        );
        if (!meeting_link) return;

        setLoadingAction(id);
        try {
            // 1. Planification de la réunion (URL corrigée avec 'offers/')
            await API.post(`offers/applications/${id}/plan-meeting/`, {
                meeting_date,
                meeting_link
            });

            // 2. Changement automatique du statut en 'INTERVIEW' pour l'affichage visuel
            await API.post(`offers/applications/${id}/status/`, { status: 'INTERVIEW' });

            alert("Entretien planifié avec succès !");
            await fetchOffersAndApplications();
        } catch (err) {
            console.error("Erreur planification réunion :", err.response?.data || err.message);
            alert("Erreur lors de la planification de la réunion.");
        } finally {
            setLoadingAction(null);
        }
    };

    // Fonction utilitaire pour attribuer des couleurs dynamiques aux badges de statut
    const getStatusStyle = (status) => {
        switch (status) {
            case 'ACCEPTED':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'REJECTED':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'INTERVIEW':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            default:
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-6">
            <div className="max-w-6xl mx-auto">

                {/* HEADER */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Dashboard Entreprise
                        </h1>
                        <p className="text-gray-500">
                            Gestion intelligente des candidatures
                        </p>
                    </div>

                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium shadow"
                    >
                        {showForm ? 'Fermer' : '➕ Nouvelle offre'}
                    </button>
                </div>

                {/* STATS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
                        <p className="text-gray-500 font-medium">Offres publiées</p>
                        <h2 className="text-3xl font-bold text-gray-800">{myOffers.length}</h2>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
                        <p className="text-gray-500 font-medium">Candidatures reçues</p>
                        <h2 className="text-3xl font-bold text-indigo-600">{receivedApplications.length}</h2>
                    </div>
                </div>

                {/* CREATE OFFER FORM */}
                {showForm && (
                    <form
                        onSubmit={handleCreateOffer}
                        className="bg-white p-6 rounded-xl shadow-md mb-8 space-y-4 border border-gray-200 transition-all"
                    >
                        <h2 className="text-xl font-bold text-gray-800">Publier une offre</h2>

                        <div>
                            <label className="block mb-1 font-medium text-gray-700">Titre</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block mb-1 font-medium text-gray-700">Localisation</label>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block mb-1 font-medium text-gray-700">Durée</label>
                            <input
                                type="text"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Ex: 6 mois"
                                required
                            />
                        </div>

                        <div>
                            <label className="block mb-1 font-medium text-gray-700">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                rows="4"
                                required
                            />
                        </div>

                        <div>
                            <label className="block mb-1 font-medium text-gray-700">Compétences requises</label>
                            <input
                                type="text"
                                placeholder="React, Django, SQL"
                                value={skillsRequired}
                                onChange={(e) => setSkillsRequired(e.target.value)}
                                className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block mb-1 font-medium text-gray-700">Technologies</label>
                            <input
                                type="text"
                                placeholder="Vite, Tailwind, PostgreSQL"
                                value={technologies}
                                onChange={(e) => setTechnologies(e.target.value)}
                                className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition shadow"
                        >
                            Publier l'offre
                        </button>
                    </form>
                )}

                {/* MY OFFERS */}
                <div className="bg-white p-6 rounded-xl shadow mb-8 border border-gray-200">
                    <h2 className="text-xl font-bold mb-4 text-gray-800">Mes offres</h2>
                    {myOffers.length === 0 ? (
                        <p className="text-gray-500 italic">Aucune offre publiée</p>
                    ) : (
                        myOffers.map((offer) => (
                            <div
                                key={offer.id}
                                className="border-b py-4 flex justify-between items-center last:border-0"
                            >
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800">{offer.title}</h3>
                                    <p className="text-gray-600">{offer.location}</p>
                                    <p className="text-sm text-gray-500">{offer.duration}</p>
                                </div>

                                <button
                                    onClick={() => handleDeleteOffer(offer.id)}
                                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition shadow text-sm"
                                >
                                    Supprimer
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* APPLICATIONS */}
                <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
                    <h2 className="text-xl font-bold mb-4 text-gray-800">Analyse IA des CV</h2>
                    {receivedApplications.length === 0 ? (
                        <p className="text-gray-500 italic">Aucune candidature reçue</p>
                    ) : (
                        receivedApplications.map((app) => (
                            <div
                                key={app.id}
                                className="border rounded-lg p-5 mb-4 last:mb-0 bg-gray-50 shadow-sm border-gray-200"
                            >
                                {/* HEADER CARD */}
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900">
                                            {app.student_username}
                                        </h3>
                                        <p className="text-gray-600 text-sm">
                                            Offre postulée : <span className="font-semibold">{app.offer_details?.title}</span>
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(app.status)}`}>
                                        {app.status}
                                    </span>
                                </div>

                                {/* SCORE MATCHING */}
                                <div className="mb-4">
                                    <p className="font-medium mb-1 text-sm text-gray-700">Score de correspondance IA</p>
                                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="bg-green-500 h-3 rounded-full transition-all duration-500"
                                            style={{ width: `${app.ai_matching_score || 0}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs font-bold text-gray-600 mt-1">
                                        {app.ai_matching_score || 0}% de compatibilité
                                    </p>
                                </div>

                                {/* IA ANALYSIS DESCRIPTION */}
                                <div className="mb-4">
                                    <p className="font-medium mb-1 text-sm text-gray-700">Analyse de l'évaluation</p>
                                    <p className="text-gray-700 bg-white p-3 rounded border border-gray-200 text-sm italic">
                                        "{app.ai_analysis_summary || "Aucune analyse IA disponible"}"
                                    </p>
                                </div>

                                {/* CV DOCUMENT LINK */}
                                <div className="mb-4">
                                    <a
                                        href={`http://127.0.0.1:8000${app.cv_file}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                                    >
                                        📄 Ouvrir et Consulter le CV
                                    </a>
                                </div>

                                {/* MEETING BLOC INFO */}
                                {app.status === 'INTERVIEW' && app.meeting_date && (
                                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4 animate-fade-in">
                                        <p className="font-bold text-blue-900 text-sm mb-1">📅 Entretien Programmé</p>
                                        <p className="text-xs text-gray-700 mb-2">Planifié pour le : <strong className="text-gray-900">{app.meeting_date}</strong></p>
                                        {app.meeting_link && (
                                            <a
                                                href={app.meeting_link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-block bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-blue-700 transition"
                                            >
                                                Rejoindre l'appel Google Meet
                                            </a>
                                        )}
                                    </div>
                                )}

                                {/* ACTION ACTION BUTTONS */}
                                <div className="flex flex-wrap gap-3 border-t border-gray-200 pt-4">
                                    <button
                                        onClick={() => updateStatus(app.id, 'ACCEPTED')}
                                        disabled={loadingAction === app.id}
                                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
                                    >
                                        Accepter
                                    </button>
                                    <button
                                        onClick={() => updateStatus(app.id, 'REJECTED')}
                                        disabled={loadingAction === app.id}
                                        className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
                                    >
                                        Refuser
                                    </button>
                                    <button
                                        onClick={() => planMeeting(app.id)}
                                        disabled={loadingAction === app.id}
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                                    >
                                        Planifier réunion
                                    </button>
                                </div>

                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
}