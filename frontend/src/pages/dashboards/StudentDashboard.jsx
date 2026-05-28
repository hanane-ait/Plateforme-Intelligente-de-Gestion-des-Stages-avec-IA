import { useEffect, useState } from 'react';
import API from '../../services/api';

export default function StudentDashboard() {
    const [recommendedOffers, setRecommendedOffers] = useState([]);
    const [myApplications, setMyApplications] = useState([]);

    const [selectedCV, setSelectedCV] = useState(null);
    const [coverLetter, setCoverLetter] = useState('');
    const [cvFile, setCvFile] = useState(null);

    // Recherche / Filtrage des offres
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Recommandations IA
            const recommendedRes = await API.get('offers/recommended/');
            // Mes candidatures
            const applicationsRes = await API.get('offers/my-applications/');

            setRecommendedOffers(recommendedRes.data);
            setMyApplications(applicationsRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    // POSTULER
    const handleApply = async (offerId) => {
        if (!cvFile) {
            alert("Veuillez sélectionner un CV PDF");
            return;
        }

        try {
            const formData = new FormData();
            formData.append('cv_file', cvFile);
            formData.append('cover_letter', coverLetter);
            formData.append('offer', offerId);

            await API.post(
                `offers/${offerId}/apply/`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            alert("Candidature envoyée avec succès et transmise à l'analyse IA !");
            setCoverLetter('');
            setCvFile(null);
            fetchData();
        } catch (err) {
            console.error(err.response?.data || err.message);
            alert(
                err.response?.data?.detail ||
                "Erreur lors de la candidature"
            );
        }
    };

    // BADGE STATUS
    const getStatusColor = (status) => {
        switch (status) {
            case 'ANALYZED':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'INTERVIEW':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'ACCEPTED':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'REJECTED':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    // Défilement fluide vers la section candidatures
    const scrollToApplications = () => {
        document.getElementById('my-applications-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    // Filtrer les offres recommandées en fonction de la barre de recherche
    const filteredOffers = recommendedOffers.filter((offer) => {
        const query = searchQuery.toLowerCase();
        const skillsString = Array.isArray(offer.skills_required) 
            ? offer.skills_required.join(' ') 
            : offer.skills_required || '';

        return (
            offer.title?.toLowerCase().includes(query) ||
            offer.company_name?.toLowerCase().includes(query) ||
            offer.location?.toLowerCase().includes(query) ||
            skillsString.toLowerCase().includes(query)
        );
    });

    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">

                {/* HEADER & TOP NAVIGATION BAR */}
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
                            Dashboard Étudiant
                        </h1>
                        <p className="text-slate-500 mt-2 text-sm sm:text-base">
                            Recommandations intelligentes et suivi en temps réel de vos opportunités.
                        </p>
                    </div>
                    
                    {/* Bouton de redirection vers le bas */}
                    <button
                        onClick={scrollToApplications}
                        className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl font-semibold hover:bg-slate-800 transition shadow-sm group text-sm"
                    >
                        📋 Voir mes candidatures
                        <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full font-bold transition-transform group-hover:scale-105">
                            {myApplications.length}
                        </span>
                    </button>
                </div>

                {/* SECTION IA RECOMMENDATIONS & SEARCH BAR */}
                <div className="mb-14">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-indigo-900 flex items-center gap-2">
                                <span>🤖</span> Stages recommandés par IA
                            </h2>
                            <p className="text-slate-500 text-xs mt-1">Généré sur la base des compétences de votre profil</p>
                        </div>

                        {/* BARRE DE RECHERCHE DYNAMIQUE */}
                        <div className="relative w-full md:w-80">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                                🔍
                            </span>
                            <input
                                type="text"
                                placeholder="Rechercher un poste, entreprise..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm placeholder:text-slate-400 transition-all"
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 text-xs"
                                >
                                    Effacer
                                </button>
                            )}
                        </div>
                    </div>

                    {/* OFFERS GRID */}
                    {filteredOffers.length === 0 ? (
                        <div className="bg-white rounded-2xl p-10 text-center border border-slate-100 shadow-sm">
                            <p className="text-slate-400 italic">
                                {searchQuery ? "Aucun résultat ne correspond à votre recherche." : "Aucune recommandation disponible pour le moment."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {filteredOffers.map((offer) => (
                                <div
                                    key={offer.id}
                                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-xl hover:border-slate-200 transition-all duration-300"
                                >
                                    <div>
                                        {/* OFFER TOP DETAILS */}
                                        <div className="flex justify-between items-start gap-3">
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                                                    {offer.title}
                                                </h3>
                                                <p className="text-indigo-600 font-medium text-sm mt-0.5">
                                                    {offer.company_name}
                                                </p>
                                            </div>
                                            
                                            {/* AI MATCH BADGE */}
                                            <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm">
                                                🎯 Match : {offer.matching_score || 0}%
                                            </div>
                                        </div>

                                        {/* VISUAL METRICS BAR */}
                                        <div className="w-full bg-slate-100 rounded-full h-2 mt-4 overflow-hidden">
                                            <div 
                                                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500" 
                                                style={{ width: `${offer.matching_score || 0}%` }}
                                            />
                                        </div>

                                        {/* TEXT DESCRIPTION */}
                                        <div className="mt-4">
                                            <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
                                                {offer.description}
                                            </p>
                                        </div>

                                        {/* SKILLS BADGES */}
                                        <div className="mt-4 flex flex-wrap gap-1.5">
                                            {Array.isArray(offer.skills_required) 
                                                ? offer.skills_required.map((skill, index) => (
                                                    <span key={index} className="bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-lg text-xs font-medium">
                                                        {skill}
                                                    </span>
                                                  ))
                                                : offer.skills_required?.split(',').map((skill, index) => (
                                                    <span key={index} className="bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-lg text-xs font-medium">
                                                        {skill.trim()}
                                                    </span>
                                                  ))
                                            }
                                        </div>

                                        {/* SPECIFICATIONS */}
                                        <div className="mt-5 pt-3 border-t border-slate-100 flex gap-4 text-xs font-medium text-slate-500">
                                            <span className="flex items-center gap-1">📍 {offer.location || 'Non spécifié'}</span>
                                            <span className="flex items-center gap-1">⏳ {offer.duration || 'Non spécifié'}</span>
                                        </div>
                                    </div>

                                    {/* POSTULATION FORM INSIDE CARD */}
                                    <div className="mt-6 pt-4 border-t border-slate-100 space-y-4">
                                        <textarea
                                            placeholder="Rédigez une courte lettre de motivation ou accroche..."
                                            value={coverLetter}
                                            onChange={(e) => setCoverLetter(e.target.value)}
                                            className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400 bg-slate-50/50 resize-none transition-all"
                                            rows="3"
                                        />

                                        <div className="bg-slate-50 border border-dashed border-slate-200 p-3 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                            <label className="text-xs font-semibold text-slate-700">Votre CV (Format PDF) :</label>
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={(e) => setCvFile(e.target.files[0])}
                                                className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 file:cursor-pointer file:transition-colors"
                                            />
                                        </div>

                                        <button
                                            onClick={() => handleApply(offer.id)}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm shadow-indigo-100 hover:shadow-indigo-200"
                                        >
                                            Postuler instantanément
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* MY APPLICATIONS ANCHOR SECTION */}
                <div id="my-applications-section" className="scroll-mt-10">
                    <h2 className="text-2xl font-bold mb-6 text-slate-900 flex items-center gap-2">
                        <span>📋</span> Suivi de mes candidatures
                    </h2>

                    {myApplications.length === 0 ? (
                        <div className="bg-white rounded-2xl p-10 text-center border border-slate-100 shadow-sm">
                            <p className="text-slate-400 italic">Vous n'avez pas encore envoyé de candidature.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {myApplications.map((app) => (
                                <div
                                    key={app.id}
                                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all"
                                >
                                    {/* ROW HEADER */}
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800">
                                                {app.offer_details?.title}
                                            </h3>
                                            <p className="text-slate-500 font-medium text-sm mt-0.5">
                                                🏢 {app.offer_details?.company_name}
                                            </p>
                                        </div>
                                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold border tracking-wider ${getStatusColor(app.status)}`}>
                                            {app.status}
                                        </span>
                                    </div>

                                    {/* SUITE CARD DETAIL */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                        
                                        {/* COL 1: MATCH SCORE */}
                                        <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Score d'Adéquation</span>
                                                <span className="text-sm font-black text-indigo-600">{app.ai_matching_score || 0}%</span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                                                <div
                                                    className="bg-indigo-600 h-2.5 rounded-full transition-all"
                                                    style={{ width: `${app.ai_matching_score || 0}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* COL 2 & 3: FEEDBACK ANALYSIS */}
                                        <div className="md:col-span-2 bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Retour Automatique de l'IA</span>
                                            <p className="text-slate-700 text-sm leading-relaxed italic">
                                                "{app.ai_analysis_summary || "Analyse en cours par notre algorithme..."}"
                                            </p>
                                        </div>

                                    </div>

                                    {/* MEETING SUB-CARD IF INTERVIEW STATUS AVAILABLE */}
                                    {app.status === 'INTERVIEW' && (
                                        <div className="mt-5 bg-amber-50/60 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <div>
                                                <h4 className="font-bold text-amber-850 text-sm flex items-center gap-1.5">
                                                    📅 Planification d'entretien confirmée !
                                                </h4>
                                                <p className="text-xs text-slate-600 mt-1">
                                                    Date programmée : <span className="font-semibold text-slate-900">{app.meeting_date ? new Date(app.meeting_date).toLocaleString() : "À définir"}</span>
                                                </p>
                                            </div>
                                            {app.meeting_link && (
                                                <a
                                                    href={app.meeting_link}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center justify-center bg-amber-600 hover:bg-amber-700 text-white text-xs px-4 py-2.5 rounded-xl font-semibold shadow-sm transition-colors w-full sm:w-auto"
                                                >
                                                    🎥 Rejoindre Google Meet
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {/* ATTACHMENT ACTION BAR */}
                                    <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
                                        <button
                                            onClick={() => setSelectedCV(`http://127.0.0.1:8000${app.cv_file}`)}
                                            className="inline-flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
                                        >
                                            📄 Aperçu du CV envoyé
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* FULL-SCREEN IFRAME MODAL PREVIEW */}
            {selectedCV && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
                    <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl overflow-hidden relative shadow-2xl border border-slate-100 flex flex-col">
                        <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">📄 Visionneuse de document</span>
                            <button
                                onClick={() => setSelectedCV(null)}
                                className="bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs px-4 py-1.5 rounded-xl shadow-sm transition-colors"
                            >
                                Fermer ✕
                            </button>
                        </div>
                        <iframe
                            src={selectedCV}
                            title="Visualisation CV"
                            className="w-full flex-1"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}