import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';
import ProfileSettings from '../../components/ProfileSettings';
import AssistantChat from '../../components/AssistantChat';
import { StudentDashboardCharts } from '../../components/DashboardCharts';

const C = {
    navy: '#052659',
    blue: '#7DA0CA',
    light: '#C1E8FF',
};

const NAV = [
    { id: 'offers', label: 'Dashboard', icon: 'grid' },
    { id: 'applications', label: 'Suivre mes offres', icon: 'briefcase' },
    { id: 'meetings', label: 'Entretiens', icon: 'video' },
    { id: 'analytics', label: 'Statistiques', icon: 'chart' },
    { id: 'settings', label: 'Paramètres', icon: 'settings' },
];

function NavIcon({ type }) {
    const stroke = 'currentColor';
    const icons = {
        grid: (
            <svg className="w-5 h-5" fill="none" stroke={stroke} viewBox="0 0 24 24">
                <path strokeWidth="2" d="M4 6h7V4H4v2zm9 0h7V4h-7v2zM4 13h7v-2H4v2zm9 0h7v-2h-7v2zM4 20h7v-2H4v2zm9 0h7v-2h-7v2z" />
            </svg>
        ),
        briefcase: (
            <svg className="w-5 h-5" fill="none" stroke={stroke} viewBox="0 0 24 24">
                <path strokeWidth="2" d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2m-9 4h10m-10 0a2 2 0 00-2 2v7a2 2 0 002 2h10a2 2 0 002-2v-7a2 2 0 00-2-2" />
            </svg>
        ),
        video: (
            <svg className="w-5 h-5" fill="none" stroke={stroke} viewBox="0 0 24 24">
                <path strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
        ),
        chart: (
            <svg className="w-5 h-5" fill="none" stroke={stroke} viewBox="0 0 24 24">
                <path strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
        settings: (
            <svg className="w-5 h-5" fill="none" stroke={stroke} viewBox="0 0 24 24">
                <path strokeWidth="2" d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                <path strokeWidth="2" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
        ),
        logout: (
            <svg className="w-5 h-5" fill="none" stroke={stroke} viewBox="0 0 24 24">
                <path strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
            </svg>
        ),
    };
    return icons[type] || null;
}

const STATUS_LABELS = {
    PENDING: 'En attente',
    ANALYZED: 'Analysée',
    INTERVIEW: 'Entretien',
    ACCEPTED: 'Acceptée',
    REJECTED: 'Refusée',
};

function getStatusStyle(status) {
    const map = {
        PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
        ANALYZED: 'bg-[#C1E8FF] text-[#052659] border-[#7DA0CA]',
        INTERVIEW: 'bg-[#7DA0CA]/25 text-[#052659] border-[#7DA0CA]',
        ACCEPTED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
    };
    return map[status] || 'bg-slate-50 text-slate-600 border-slate-200';
}

function StatusBadge({ status }) {
    return (
        <span
            className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[11px] font-semibold leading-tight border whitespace-nowrap ${getStatusStyle(status)}`}
        >
            {STATUS_LABELS[status] || status}
        </span>
    );
}

const MEETING_EARLY_MS = 15 * 60 * 1000;
const MEETING_LATE_MS = 2 * 60 * 60 * 1000;

function getMeetingTimeStatus(meetingDate) {
    const now = Date.now();
    const start = new Date(meetingDate).getTime();
    if (now < start - MEETING_EARLY_MS) {
        return { key: 'upcoming', label: 'Pas encore', pill: 'bg-[#C1E8FF] text-[#052659] border-[#7DA0CA]' };
    }
    if (now <= start + MEETING_LATE_MS) {
        return { key: 'arrived', label: 'En cours', pill: 'bg-[#7DA0CA]/30 text-[#052659] border-[#7DA0CA]' };
    }
    return { key: 'passed', label: 'Passé', pill: 'bg-slate-100 text-slate-600 border-slate-200' };
}

function getMeetingCompletionStatus(meetingDate, reviewDone) {
    const time = getMeetingTimeStatus(meetingDate);
    if (time.key !== 'passed') {
        return { key: 'pending', label: '—', pill: 'bg-slate-50 text-slate-400 border-slate-200' };
    }
    if (reviewDone) {
        return { key: 'done', label: 'Done', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    return { key: 'missed', label: 'Missed', pill: 'bg-rose-50 text-rose-700 border-rose-200' };
}

function canJoinMeeting(meetingDate) {
    const t = getMeetingTimeStatus(meetingDate);
    return t.key === 'upcoming' || t.key === 'arrived';
}

function MiniCalendar({ meetingDates }) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const start = firstDay === 0 ? 6 : firstDay - 1;
    const highlightDays = new Set(
        meetingDates.map((d) => new Date(d).getDate())
    );

    const cells = [];
    for (let i = 0; i < start; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const monthLabel = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    return (
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-[#C1E8FF]">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#052659] capitalize">{monthLabel}</h3>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-[#7DA0CA] font-semibold mb-1">
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d) => (
                    <span key={d}>{d}</span>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {cells.map((day, i) => (
                    <span
                        key={i}
                        className={`py-1 rounded-full ${
                            day && highlightDays.has(day)
                                ? 'bg-[#052659] text-white font-bold'
                                : day === now.getDate()
                                  ? 'bg-[#C1E8FF] text-[#052659] font-semibold'
                                  : day
                                    ? 'text-slate-600'
                                    : ''
                        }`}
                    >
                        {day || ''}
                    </span>
                ))}
            </div>
        </div>
    );
}

export default function StudentDashboard() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user, logout } = useContext(AuthContext);

    const initialSection = searchParams.get('section') || 'offers';
    const [activeSection, setActiveSection] = useState(initialSection);

    const [allOffers, setAllOffers] = useState([]);
    const [recommendedOffers, setRecommendedOffers] = useState([]);
    const [showRecommendedOnly, setShowRecommendedOnly] = useState(false);
    const [myApplications, setMyApplications] = useState([]);

    const [selectedCV, setSelectedCV] = useState(null);
    const [coverLetter, setCoverLetter] = useState('');
    const [cvFile, setCvFile] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [generatingLetterFor, setGeneratingLetterFor] = useState(null);

    // Meetings state
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [audioFile, setAudioFile] = useState(null);
    const [pdfFile, setPdfFile] = useState(null);
    const [aiResult, setAiResult] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [feedbackTab, setFeedbackTab] = useState('audio');
    const [meetingFilter, setMeetingFilter] = useState('all');
    const [dashboardStats, setDashboardStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (user?.role === 'COMPANY') {
            const section = searchParams.get('section') || activeSection;
            navigate(`/company-dashboard?section=${section}`, { replace: true });
        }
    }, [user?.role, navigate, searchParams, activeSection]);

    useEffect(() => {
        const sectionFromUrl = searchParams.get('section');
        if (sectionFromUrl && sectionFromUrl !== activeSection) {
            setActiveSection(sectionFromUrl);
        }
    }, [searchParams]);

    useEffect(() => {
        setSearchParams({ section: activeSection });
    }, [activeSection, setSearchParams]);

    const fetchData = async () => {
        try {
            const [allRes, recommendedRes, applicationsRes, statsRes] = await Promise.all([
                API.get('offers/'),
                API.get('offers/recommended/'),
                API.get('offers/my-applications/'),
                API.get('offers/stats/student/'),
            ]);
            setAllOffers(allRes.data);
            setRecommendedOffers(recommendedRes.data);
            setMyApplications(applicationsRes.data);
            setDashboardStats(statsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setStatsLoading(false);
        }
    };

    const meetings = useMemo(
        () => myApplications.filter((app) => app.meeting_date),
        [myApplications]
    );

    const meetingDates = meetings.map((m) => m.meeting_date);

    const handleApply = async (offerId) => {
        if (!cvFile) {
            alert('Veuillez sélectionner un CV PDF');
            return;
        }
        try {
            const formData = new FormData();
            formData.append('cv_file', cvFile);
            formData.append('cover_letter', coverLetter);
            formData.append('offer', offerId);
            await API.post(`offers/${offerId}/apply/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            alert('Candidature envoyée avec succès !');
            setCoverLetter('');
            setCvFile(null);
            fetchData();
            setActiveSection('applications');
        } catch (err) {
            alert(err.response?.data?.detail || 'Erreur lors de la candidature');
        }
    };

    const handleCancelApplication = async (applicationId) => {
        const confirmCancel = window.confirm(
            'Êtes-vous sûr de vouloir annuler cette candidature ? Cette action est irréversible.'
        );
        if (!confirmCancel) {
            return;
        }

        try {
            await API.delete(`offers/applications/${applicationId}/cancel/`);
            await fetchData();
            alert('Candidature annulée.');
        } catch (err) {
            alert(err.response?.data?.detail || 'Impossible d’annuler la candidature.');
        }
    };

    const handleGenerateLetter = async (offerId) => {
        setGeneratingLetterFor(offerId);
        try {
            const formData = new FormData();
            if (cvFile) formData.append('cv_file', cvFile);
            const res = await API.post(`offers/${offerId}/generate-cover-letter/`, formData);
            setCoverLetter(res.data.cover_letter || '');
        } catch (err) {
            alert(err.response?.data?.detail || 'Erreur lors de la génération de la lettre.');
        } finally {
            setGeneratingLetterFor(null);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const displayedOffers = showRecommendedOnly ? recommendedOffers : allOffers;
    const filteredOffers = displayedOffers.filter((offer) => {
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

    const formatDate = (dateStr) =>
        new Date(dateStr).toLocaleString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

    const filteredMeetings = useMemo(() => {
        if (meetingFilter === 'upcoming') {
            return meetings.filter((m) => getMeetingTimeStatus(m.meeting_date).key !== 'passed');
        }
        if (meetingFilter === 'past') {
            return meetings.filter((m) => getMeetingTimeStatus(m.meeting_date).key === 'passed');
        }
        return meetings;
    }, [meetings, meetingFilter]);

    const meetingStats = useMemo(() => {
        const upcoming = meetings.filter((m) => getMeetingTimeStatus(m.meeting_date).key !== 'passed').length;
        const done = meetings.filter((m) => m.meeting_review_done).length;
        return { total: meetings.length, upcoming, done };
    }, [meetings]);

    const handleAnalyzeAudio = async () => {
        if (!audioFile || !selectedMeeting) return;
        setIsAnalyzing(true);
        setAiResult('');
        const formData = new FormData();
        formData.append('audio_file', audioFile);
        try {
            const res = await API.post(
                `offers/applications/${selectedMeeting.id}/analyze-meeting-audio/`,
                formData
            );
            setAiResult(res.data.ai_feedback);
            fetchData();
        } catch (error) {
            const message = error.response?.data?.detail || error.message || "Erreur lors de l'analyse audio.";
            setAiResult(message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleAnalyzePdf = async () => {
        if (!pdfFile || !selectedMeeting) return;
        setIsAnalyzing(true);
        setAiResult('');
        const formData = new FormData();
        formData.append('pdf_file', pdfFile);
        try {
            const res = await API.post(
                `offers/applications/${selectedMeeting.id}/analyze-meeting-pdf/`,
                formData
            );
            setAiResult(res.data.ai_feedback);
            fetchData();
        } catch (err) {
            setAiResult(err.response?.data?.detail || "Erreur lors de l'analyse du PDF.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const closeMeetingModal = () => {
        setSelectedMeeting(null);
        setAudioFile(null);
        setPdfFile(null);
        setAiResult('');
        setFeedbackTab('audio');
    };

    const userInitials = user?.username?.slice(0, 2).toUpperCase() || 'ET';

    const sectionTitle = {
        offers: showRecommendedOnly ? 'Stages recommandés pour vous' : 'Offres de stage',
        applications: 'Suivi de mes candidatures',
        meetings: 'Mes entretiens',
        analytics: 'Statistiques & insights',
        settings: 'Paramètres du profil',
    };

    const renderAnalytics = () => (
        <StudentDashboardCharts stats={dashboardStats} loading={statsLoading} />
    );

    const renderOffers = () => (
        <div>
            <div className="flex flex-wrap gap-3 mb-6 items-center">
                <span className="text-sm font-medium text-[#052659]">Filtrer :</span>
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <input
                        type="text"
                        placeholder="Rechercher un poste, entreprise..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-4 pr-4 py-2 bg-white border border-[#C1E8FF] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7DA0CA]"
                    />
                </div>
            </div>

            {filteredOffers.length === 0 ? (
                <div className="bg-[#C1E8FF]/30 rounded-2xl p-12 text-center border border-[#C1E8FF]">
                    <p className="text-[#052659]/70">Aucune offre à afficher.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOffers.map((offer, idx) => (
                        <div
                            key={offer.id}
                            className="rounded-2xl p-5 flex flex-col lg:flex-row gap-5 border border-[#C1E8FF] shadow-sm hover:shadow-md transition-all"
                            style={{
                                background:
                                    idx % 3 === 0
                                        ? 'linear-gradient(135deg, #C1E8FF40 0%, #ffffff 100%)'
                                        : idx % 3 === 1
                                          ? 'linear-gradient(135deg, #7DA0CA25 0%, #ffffff 100%)'
                                          : 'linear-gradient(135deg, #C1E8FF60 0%, #ffffff 100%)',
                            }}
                        >
                            <div className="hidden sm:flex items-center justify-center w-24 h-24 rounded-xl bg-white/80 border border-[#C1E8FF] flex-shrink-0">
                                <span className="text-3xl">💼</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap justify-between gap-2 mb-2">
                                    <div>
                                        <h3 className="text-lg font-bold text-[#052659]">{offer.title}</h3>
                                        <p className="text-sm text-[#7DA0CA] font-semibold">{offer.company_name}</p>
                                    </div>
                                    {showRecommendedOnly && (
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#052659] text-white">
                                            Match {offer.matching_score || 0}%
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-600 line-clamp-2 mb-3">{offer.description}</p>
                                <p className="text-xs text-slate-500">
                                    📍 {offer.location} · ⏳ {offer.duration}
                                </p>
                                <div className="mt-4 space-y-3 border-t border-[#C1E8FF] pt-4">
                                    <textarea
                                        placeholder="Lettre de motivation..."
                                        value={coverLetter}
                                        onChange={(e) => setCoverLetter(e.target.value)}
                                        className="w-full border border-[#C1E8FF] rounded-xl p-3 text-sm bg-white resize-none"
                                        rows="2"
                                    />
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleGenerateLetter(offer.id)}
                                            disabled={generatingLetterFor === offer.id}
                                            className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#7DA0CA] text-[#052659] bg-white hover:bg-[#C1E8FF]/50 disabled:opacity-50"
                                        >
                                            {generatingLetterFor === offer.id ? 'Génération...' : '✨ Lettre IA'}
                                        </button>
                                        <label className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#052659] text-white cursor-pointer hover:opacity-90">
                                            CV PDF
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                className="hidden"
                                                onChange={(e) => setCvFile(e.target.files[0])}
                                            />
                                        </label>
                                        {cvFile && (
                                            <span className="text-xs text-emerald-600 self-center">{cvFile.name}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleApply(offer.id)}
                                className="self-center lg:self-auto w-12 h-12 rounded-full bg-[#052659] text-white flex items-center justify-center hover:bg-[#7DA0CA] transition shadow-lg flex-shrink-0"
                                title="Postuler"
                            >
                                →
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-8 flex justify-center">
                <button
                    type="button"
                    onClick={() => setShowRecommendedOnly((p) => !p)}
                    className={`px-6 py-3 rounded-xl font-semibold text-sm transition ${
                        showRecommendedOnly
                            ? 'bg-white text-[#052659] border-2 border-[#7DA0CA]'
                            : 'bg-[#052659] text-white hover:bg-[#7DA0CA]'
                    }`}
                >
                    {showRecommendedOnly
                        ? '↩ Afficher toutes les offres'
                        : '🤖 Voir les stages recommandés pour mon CV'}
                </button>
            </div>
        </div>
    );

    const renderApplications = () => (
        <div className="bg-white rounded-2xl border border-[#C1E8FF] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[#C1E8FF]">
                <h3 className="text-lg font-bold text-[#052659]">Suivi de mes candidatures</h3>
                <p className="text-xs text-[#7DA0CA] mt-1">{myApplications.length} candidature(s)</p>
            </div>

            {myApplications.length === 0 ? (
                <p className="p-12 text-center text-[#7DA0CA]">Vous n&apos;avez pas encore postulé.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[#f8fbff] text-left text-xs uppercase tracking-wide text-[#7DA0CA]">
                                <th className="px-6 py-4 font-semibold">Offre</th>
                                <th className="px-4 py-4 font-semibold">Entreprise</th>
                                <th className="px-4 py-4 font-semibold">Envoyée le</th>
                                <th className="px-4 py-4 font-semibold">Statut</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#C1E8FF]/60">
                            {myApplications.map((app) => {
                                const companyInitials = (app.offer_details?.company_name || 'EN')
                                    .slice(0, 2)
                                    .toUpperCase();
                                return (
                                    <tr key={app.id} className="hover:bg-[#C1E8FF]/10 align-middle">
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-[#052659]">
                                                {app.offer_details?.title || '—'}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5 max-w-[220px]">
                                                {app.status === 'ACCEPTED' && 'Félicitations — offre acceptée.'}
                                                {app.status === 'REJECTED' && 'Non retenue par l\'entreprise.'}
                                                {app.status === 'INTERVIEW' && 'Entretien planifié.'}
                                                {(app.status === 'PENDING' || app.status === 'ANALYZED') &&
                                                    'Dossier en cours d\'examen.'}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-[#052659] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                                    {companyInitials}
                                                </div>
                                                <span className="text-[#052659] font-medium">
                                                    {app.offer_details?.company_name || '—'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-slate-600 whitespace-nowrap">
                                            {app.applied_at
                                                ? new Date(app.applied_at).toLocaleDateString('fr-FR', {
                                                      day: '2-digit',
                                                      month: 'short',
                                                      year: 'numeric',
                                                  })
                                                : '—'}
                                        </td>
                                        <td className="px-4 py-4">
                                            <StatusBadge status={app.status} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap justify-end gap-2">
                                                {app.status === 'INTERVIEW' && app.meeting_date && (
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/meeting/${app.id}`)}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#052659] hover:bg-[#7DA0CA]"
                                                    >
                                                        Rejoindre
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedCV(`http://127.0.0.1:8000${app.cv_file}`)
                                                    }
                                                    className="px-3 py-1.5 rounded-lg text-xs font-bold border border-[#7DA0CA] text-[#052659] hover:bg-[#C1E8FF]/40"
                                                >
                                                    Mon CV
                                                </button>
                                                {app.status !== 'ACCEPTED' && app.status !== 'REJECTED' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCancelApplication(app.id)}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#BF0A30] border border-[#BF0A30] hover:bg-[#FFE4E8]"
                                                    >
                                                        Annuler
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    const renderMeetings = () => (
        <div className="bg-white rounded-2xl border border-[#C1E8FF] shadow-sm overflow-hidden">
            {/* En-tête type tableau admin */}
            <div className="px-6 py-5 border-b border-[#C1E8FF] flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className="flex gap-6 border-b border-transparent mb-3">
                        {[
                            { id: 'all', label: 'Tous' },
                            { id: 'upcoming', label: 'À venir' },
                            { id: 'past', label: 'Passés' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setMeetingFilter(tab.id)}
                                className={`pb-2 text-sm font-semibold border-b-2 transition ${
                                    meetingFilter === tab.id
                                        ? 'border-[#052659] text-[#052659]'
                                        : 'border-transparent text-[#7DA0CA] hover:text-[#052659]'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <h3 className="text-xl font-bold text-[#052659]">Mes entretiens</h3>
                </div>
                <div className="text-right text-sm">
                    <p className="text-[#7DA0CA]">
                        Total : <span className="font-bold text-[#052659]">{meetingStats.total}</span>
                    </p>
                    <p className="text-[#7DA0CA]">
                        À venir : <span className="font-bold text-[#052659]">{meetingStats.upcoming}</span>
                        {' · '}
                        Feedback : <span className="font-bold text-emerald-600">{meetingStats.done}</span>
                    </p>
                </div>
            </div>

            {filteredMeetings.length === 0 ? (
                <div className="p-16 text-center text-[#7DA0CA]">Aucun entretien dans cette catégorie.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[#f8fbff] text-left text-xs uppercase tracking-wide text-[#7DA0CA]">
                                <th className="px-6 py-4 font-semibold">Entreprise</th>
                                <th className="px-4 py-4 font-semibold">Offre / Contact</th>
                                <th className="px-4 py-4 font-semibold">Date</th>
                                <th className="px-4 py-4 font-semibold">Horaire</th>
                                <th className="px-4 py-4 font-semibold">Suivi</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#C1E8FF]/60">
                            {filteredMeetings.map((meeting) => {
                                const timeStatus = getMeetingTimeStatus(meeting.meeting_date);
                                const completion = getMeetingCompletionStatus(
                                    meeting.meeting_date,
                                    meeting.meeting_review_done
                                );
                                const companyInitials = (meeting.offer_details?.company_name || 'EN')
                                    .slice(0, 2)
                                    .toUpperCase();
                                const joinEnabled = canJoinMeeting(meeting.meeting_date);

                                return (
                                    <tr key={meeting.id} className="hover:bg-[#C1E8FF]/10 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[#052659] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                    {companyInitials}
                                                </div>
                                                <span className="font-semibold text-[#052659]">
                                                    {meeting.offer_details?.company_name || '—'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="font-medium text-[#052659]">
                                                {meeting.offer_details?.title}
                                            </p>
                                            <p className="text-xs text-[#7DA0CA] mt-0.5">Recruteur entreprise</p>
                                        </td>
                                        <td className="px-4 py-4 text-[#052659] whitespace-nowrap">
                                            {new Date(meeting.meeting_date).toLocaleDateString('fr-FR', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span
                                                className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${timeStatus.pill}`}
                                            >
                                                {timeStatus.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span
                                                className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${completion.pill}`}
                                            >
                                                {completion.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2 flex-wrap">
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/meeting/${meeting.id}`)}
                                                    disabled={!joinEnabled}
                                                    className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#052659] hover:bg-[#7DA0CA] disabled:opacity-40 disabled:cursor-not-allowed transition"
                                                >
                                                    Rejoindre
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedMeeting(meeting);
                                                        setAiResult('');
                                                        setFeedbackTab('audio');
                                                    }}
                                                    className="px-4 py-2 rounded-lg text-xs font-bold border border-[#7DA0CA] text-[#052659] hover:bg-[#C1E8FF]/50 transition"
                                                >
                                                    Résumé & conseils
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    const renderSettings = () => (
        <ProfileSettings
            accountLabel="Compte étudiant · TalentAI"
            stats={[
                { label: 'Candidatures', value: myApplications.length },
                { label: 'Entretiens', value: meetings.length },
            ]}
            onLogout={handleLogout}
        />
    );

    return (
        <div className={`min-h-screen flex bg-[#f4f8fc] ${selectedMeeting ? 'overflow-hidden' : ''}`}>
            {/* Sidebar */}
            <aside
                className={`w-64 flex-shrink-0 flex flex-col text-white rounded-r-3xl shadow-xl transition-all duration-300 ${
                    selectedMeeting ? 'blur-md pointer-events-none' : ''
                }`}
                style={{ backgroundColor: C.navy }}
            >
                <div className="p-6 pb-8">
                    <h1 className="text-2xl font-bold tracking-tight">
                        Talent<span style={{ color: C.light }}>AI</span>
                    </h1>
                    <p className="text-xs text-white/60 mt-1">Espace étudiant</p>
                </div>

                <nav className="flex-1 px-3 space-y-1">
                    {NAV.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setActiveSection(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                                activeSection === item.id
                                    ? 'bg-white text-[#052659] shadow-md'
                                    : 'text-white/90 hover:bg-white/10'
                            }`}
                        >
                            <NavIcon type={item.icon} />
                            {item.label}
                            {item.id === 'applications' && myApplications.length > 0 && (
                                <span className="ml-auto text-xs bg-[#7DA0CA] text-white px-2 py-0.5 rounded-full">
                                    {myApplications.length}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="p-3 border-t border-white/10">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/90 hover:bg-white/10 transition"
                    >
                        <NavIcon type="logout" />
                        Déconnexion
                    </button>
                </div>
            </aside>

            {/* Main + Right panel */}
            <div
                className={`flex-1 flex min-w-0 transition-all duration-300 ${
                    selectedMeeting ? 'blur-md pointer-events-none select-none' : ''
                }`}
            >
                <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
                    <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
                        <h2 className="text-2xl lg:text-3xl font-bold text-[#052659]">
                            {sectionTitle[activeSection]}
                        </h2>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                className="w-10 h-10 rounded-full border border-[#C1E8FF] bg-white flex items-center justify-center text-[#052659] hover:bg-[#C1E8FF]/30"
                                aria-label="Rechercher"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeWidth="2" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
                                </svg>
                            </button>
                        </div>
                    </header>

                    {activeSection === 'offers' && renderOffers()}
                    {activeSection === 'applications' && renderApplications()}
                    {activeSection === 'meetings' && renderMeetings()}
                    {activeSection === 'analytics' && renderAnalytics()}
                    {activeSection === 'settings' && renderSettings()}
                </main>

                {/* Right panel — desktop only */}
                <aside className="hidden xl:block w-80 p-6 border-l border-[#C1E8FF]/50 bg-white/50">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-full bg-[#052659] text-white flex items-center justify-center font-bold">
                            {userInitials}
                        </div>
                        <div>
                            <p className="font-bold text-[#052659]">{user?.username}</p>
                            <p className="text-xs text-[#7DA0CA]">Étudiant</p>
                        </div>
                    </div>

                    <MiniCalendar meetingDates={meetingDates} />

                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-bold text-[#052659]">Prochains entretiens</h3>
                            {meetings.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setActiveSection('meetings')}
                                    className="text-xs text-[#7DA0CA] hover:underline"
                                >
                                    Tout voir
                                </button>
                            )}
                        </div>
                        <div className="space-y-3">
                            {meetings.slice(0, 4).map((m) => (
                                <div
                                    key={m.id}
                                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#C1E8FF]/30 transition"
                                >
                                    <div className="w-2 h-2 rounded-full bg-[#052659] flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-[#052659] truncate">
                                            {m.offer_details?.title}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate">
                                            {m.offer_details?.company_name}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {meetings.length === 0 && (
                                <p className="text-xs text-slate-400">Aucun entretien à venir</p>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 p-4 rounded-2xl bg-[#C1E8FF]/40 border border-[#C1E8FF]">
                        <p className="text-xs font-bold text-[#052659] mb-1">Résumé</p>
                        <p className="text-2xl font-black text-[#052659]">{myApplications.length}</p>
                        <p className="text-xs text-[#7DA0CA]">candidatures envoyées</p>
                    </div>
                </aside>
            </div>

            {/* CV modal */}
            {selectedCV && (
                <div className="fixed inset-0 bg-[#052659]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                        <div className="px-6 py-3 border-b border-[#C1E8FF] flex justify-between items-center">
                            <span className="text-sm font-bold text-[#052659]">Aperçu CV</span>
                            <button
                                onClick={() => setSelectedCV(null)}
                                className="px-4 py-1.5 rounded-xl bg-[#052659] text-white text-xs font-semibold"
                            >
                                Fermer
                            </button>
                        </div>
                        <iframe src={selectedCV} title="CV" className="w-full flex-1" />
                    </div>
                </div>
            )}

            {/* Modale feedback entretien — fond flouté */}
            {selectedMeeting && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-[#052659]/30 backdrop-blur-md"
                        onClick={closeMeetingModal}
                        aria-hidden
                    />
                    <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#C1E8FF] z-10">
                        <div className="flex justify-between items-start mb-1">
                            <div>
                                <h3 className="text-lg font-bold text-[#052659]">Résumé & conseils IA</h3>
                                <p className="text-xs text-[#7DA0CA] mt-0.5">
                                    {selectedMeeting.offer_details?.title} —{' '}
                                    {selectedMeeting.offer_details?.company_name}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeMeetingModal}
                                className="w-8 h-8 rounded-full hover:bg-[#C1E8FF]/50 text-[#052659] font-bold"
                            >
                                ✕
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mb-4 mt-2">
                            Envoyez un enregistrement audio ou un PDF de vos notes pour obtenir un feedback et des
                            conseils pour vos prochains entretiens.
                        </p>

                        <div className="flex gap-2 mb-4 bg-[#C1E8FF]/40 p-1 rounded-xl">
                            {[
                                { id: 'audio', label: '🎙️ Audio' },
                                { id: 'pdf', label: '📄 PDF notes' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => { setFeedbackTab(tab.id); setAiResult(''); }}
                                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                                        feedbackTab === tab.id
                                            ? 'bg-white text-[#052659] shadow-sm'
                                            : 'text-[#7DA0CA]'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {feedbackTab === 'audio' ? (
                            <div className="border-2 border-dashed border-[#C1E8FF] rounded-xl p-6 text-center space-y-3">
                                <p className="text-xs text-[#7DA0CA]">mp3, wav, m4a…</p>
                                <input
                                    type="file"
                                    accept="audio/*"
                                    onChange={(e) => setAudioFile(e.target.files[0])}
                                    className="text-xs w-full file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#052659] file:text-white file:font-semibold"
                                />
                                {audioFile && (
                                    <p className="text-xs text-emerald-600 font-medium">✓ {audioFile.name}</p>
                                )}
                                <button
                                    type="button"
                                    onClick={handleAnalyzeAudio}
                                    disabled={isAnalyzing || !audioFile}
                                    className="w-full py-2.5 bg-[#052659] text-white text-sm font-semibold rounded-xl hover:bg-[#7DA0CA] disabled:opacity-50"
                                >
                                    {isAnalyzing ? 'Transcription + analyse…' : 'Transcrire et analyser'}
                                </button>
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-[#C1E8FF] rounded-xl p-6 text-center space-y-3">
                                <p className="text-xs text-[#7DA0CA]">
                                    PDF contenant vos notes sur l&apos;entretien
                                </p>
                                <input
                                    type="file"
                                    accept=".pdf,application/pdf"
                                    onChange={(e) => setPdfFile(e.target.files[0])}
                                    className="text-xs w-full file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#052659] file:text-white file:font-semibold"
                                />
                                {pdfFile && (
                                    <p className="text-xs text-emerald-600 font-medium">✓ {pdfFile.name}</p>
                                )}
                                <button
                                    type="button"
                                    onClick={handleAnalyzePdf}
                                    disabled={isAnalyzing || !pdfFile}
                                    className="w-full py-2.5 bg-[#052659] text-white text-sm font-semibold rounded-xl hover:bg-[#7DA0CA] disabled:opacity-50"
                                >
                                    {isAnalyzing ? 'Analyse en cours…' : 'Analyser le PDF'}
                                </button>
                            </div>
                        )}

                        {aiResult && (
                            <div className="mt-4 p-4 bg-[#C1E8FF]/40 rounded-xl border border-[#C1E8FF] max-h-48 overflow-y-auto">
                                <p className="text-xs font-bold text-[#052659] mb-2">Feedback IA</p>
                                <p className="text-sm text-[#052659] whitespace-pre-wrap leading-relaxed">{aiResult}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <AssistantChat />
        </div>
    );
}
