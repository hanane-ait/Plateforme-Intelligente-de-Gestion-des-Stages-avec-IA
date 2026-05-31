import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';
import ProfileSettings from '../../components/ProfileSettings';
import AssistantChat from '../../components/AssistantChat';
import { CompanyDashboardCharts } from '../../components/DashboardCharts';

const C = { navy: '#052659', blue: '#7DA0CA', light: '#C1E8FF' };

const NAV = [
    { id: 'offers', label: 'Mes offres', icon: 'grid' },
    { id: 'applications', label: 'Candidatures', icon: 'briefcase' },
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

function getStatusStyle(status) {
    const map = {
        ACCEPTED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
        INTERVIEW: 'bg-[#C1E8FF] text-[#052659] border-[#7DA0CA]',
        ANALYZED: 'bg-[#7DA0CA]/20 text-[#052659] border-[#7DA0CA]',
        PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
    };
    return map[status] || 'bg-slate-50 text-slate-600 border-slate-200';
}

/** Lien Google Calendar (gratuit, sans API) — préremplit un événement + invités par e-mail. */
function buildGoogleCalendarUrl({ title, startIso, durationMinutes, description, location, guestEmails = [] }) {
    const start = new Date(startIso);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    const toGcal = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: title,
        dates: `${toGcal(start)}/${toGcal(end)}`,
        details: description,
        location: location || '',
    });
    const guests = guestEmails.filter(Boolean);
    if (guests.length) params.set('add', guests.join(','));
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function MiniCalendar({ meetingDates }) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const start = firstDay === 0 ? 6 : firstDay - 1;
    const highlightDays = new Set(meetingDates.map((d) => new Date(d).getDate()));
    const cells = [];
    for (let i = 0; i < start; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    const monthLabel = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    return (
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-[#C1E8FF]">
            <h3 className="text-sm font-bold text-[#052659] capitalize mb-3">{monthLabel}</h3>
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

export default function CompanyDashboard() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user, logout } = useContext(AuthContext);

    const [activeSection, setActiveSection] = useState(searchParams.get('section') || 'offers');
    const [myOffers, setMyOffers] = useState([]);
    const [receivedApplications, setReceivedApplications] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loadingAction, setLoadingAction] = useState(null);
    const [rankingByApplication, setRankingByApplication] = useState({});
    const [rankingLoadingOfferId, setRankingLoadingOfferId] = useState(null);
    const [appFilter, setAppFilter] = useState('all');
    const [selectedAppDetail, setSelectedAppDetail] = useState(null);
    const [schedulingApp, setSchedulingApp] = useState(null);
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleDuration, setScheduleDuration] = useState(60);
    const [scheduleNotes, setScheduleNotes] = useState('');
    const [openGoogleCalendar, setOpenGoogleCalendar] = useState(true);
    const [scheduleSubmitting, setScheduleSubmitting] = useState(false);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [duration, setDuration] = useState('');
    const [skillsRequired, setSkillsRequired] = useState('');
    const [technologies, setTechnologies] = useState('');
    const [editingOffer, setEditingOffer] = useState(null);
    const [offerSubmitting, setOfferSubmitting] = useState(false);
    const [dashboardStats, setDashboardStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);

    useEffect(() => {
        fetchOffersAndApplications();
    }, []);

    useEffect(() => {
        if (user?.role === 'STUDENT') {
            const section = searchParams.get('section') || activeSection;
            navigate(`/student-dashboard?section=${section}`, { replace: true });
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

    const applyRankingsFromApplications = (apps) => {
        const rankingMap = {};
        apps.forEach((app) => {
            if (app.ai_rank) {
                rankingMap[app.id] = {
                    rank: app.ai_rank.rank,
                    justification: app.ai_rank.justification,
                };
            }
        });
        setRankingByApplication(rankingMap);
    };

    const fetchOffersAndApplications = async () => {
        try {
            const [offersRes, appsRes, statsRes] = await Promise.all([
                API.get('offers/'),
                API.get('offers/received/'),
                API.get('offers/stats/company/'),
            ]);
            setMyOffers(offersRes.data);
            setReceivedApplications(appsRes.data);
            applyRankingsFromApplications(appsRes.data);
            setDashboardStats(statsRes.data);
        } catch (err) {
            console.error('Erreur chargement :', err);
        } finally {
            setStatsLoading(false);
        }
    };

    const resetOfferForm = () => {
        setTitle('');
        setDescription('');
        setLocation('');
        setDuration('');
        setSkillsRequired('');
        setTechnologies('');
    };

    const parseListField = (value) =>
        value ? value.split(',').map((s) => s.trim()).filter(Boolean) : [];

    const buildOfferPayload = () => ({
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        duration: duration.trim(),
        skills_required: parseListField(skillsRequired),
        technologies: parseListField(technologies),
    });

    const handleCreateOffer = async (e) => {
        e.preventDefault();
        setOfferSubmitting(true);
        try {
            await API.post('offers/', buildOfferPayload());
            alert('Offre publiée avec succès.');
            resetOfferForm();
            setShowForm(false);
            await fetchOffersAndApplications();
        } catch {
            alert('Erreur lors de la création.');
        } finally {
            setOfferSubmitting(false);
        }
    };

    const openEditOffer = (offer) => {
        setEditingOffer(offer);
        setTitle(offer.title || '');
        setDescription(offer.description || '');
        setLocation(offer.location || '');
        setDuration(offer.duration || '');
        setSkillsRequired(
            Array.isArray(offer.skills_required)
                ? offer.skills_required.join(', ')
                : offer.skills_required || ''
        );
        setTechnologies(
            Array.isArray(offer.technologies)
                ? offer.technologies.join(', ')
                : offer.technologies || ''
        );
        setShowForm(false);
    };

    const closeEditOffer = () => {
        setEditingOffer(null);
        resetOfferForm();
        setOfferSubmitting(false);
    };

    const handleUpdateOffer = async (e) => {
        e.preventDefault();
        if (!editingOffer) return;
        setOfferSubmitting(true);
        try {
            await API.patch(`offers/${editingOffer.id}/`, {
                ...buildOfferPayload(),
                is_active: true,
            });
            alert('Offre mise à jour. Les étudiants verront les modifications.');
            closeEditOffer();
            await fetchOffersAndApplications();
        } catch {
            alert('Erreur lors de la modification.');
            setOfferSubmitting(false);
        }
    };

    const handleDeleteOffer = async (id) => {
        if (!window.confirm('Retirer cette offre ? Elle ne sera plus visible par les étudiants.')) return;
        try {
            await API.delete(`offers/${id}/`);
            await fetchOffersAndApplications();
        } catch {
            alert('Erreur lors de la suppression.');
        }
    };

    const updateStatus = async (id, status) => {
        setLoadingAction(id);
        try {
            await API.post(`offers/applications/${id}/status/`, { status });
            await fetchOffersAndApplications();
        } catch {
            alert('Erreur lors du changement de statut.');
        } finally {
            setLoadingAction(null);
        }
    };

    const openScheduleModal = (app) => {
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 2);
        defaultDate.setHours(14, 0, 0, 0);
        setScheduleDate(defaultDate.toISOString().slice(0, 16));
        setScheduleDuration(60);
        setScheduleNotes('');
        setOpenGoogleCalendar(true);
        setSchedulingApp(app);
    };

    const closeScheduleModal = () => {
        setSchedulingApp(null);
        setScheduleSubmitting(false);
    };

    const submitScheduleMeeting = async (e) => {
        e.preventDefault();
        if (!schedulingApp || !scheduleDate) return;

        setScheduleSubmitting(true);
        const meetingLink = `${window.location.origin}/meeting/${schedulingApp.id}`;
        const isoDate = new Date(scheduleDate).toISOString();

        try {
            await API.post(`offers/applications/${schedulingApp.id}/plan-meeting/`, {
                meeting_date: isoDate,
                meeting_link: meetingLink,
                duration_minutes: Number(scheduleDuration) || 60,
                notes: scheduleNotes.trim(),
            });

            if (openGoogleCalendar) {
                const title = `Entretien — ${schedulingApp.offer_details?.title || 'Stage'}`;
                const description = [
                    `Candidat : ${schedulingApp.student_username}`,
                    schedulingApp.student_email ? `Email : ${schedulingApp.student_email}` : '',
                    '',
                    'Rejoindre la visio TalentAI (Jitsi intégré) :',
                    meetingLink,
                    '',
                    'Dans Google Calendar : cliquez sur "Ajouter une visioconférence Google Meet" pour générer un lien Meet et envoyer les invitations.',
                    scheduleNotes ? `\nNotes : ${scheduleNotes}` : '',
                ]
                    .filter(Boolean)
                    .join('\n');

                const gcalUrl = buildGoogleCalendarUrl({
                    title,
                    startIso: scheduleDate,
                    durationMinutes: Number(scheduleDuration) || 60,
                    description,
                    location: meetingLink,
                    guestEmails: schedulingApp.student_email ? [schedulingApp.student_email] : [],
                });
                window.open(gcalUrl, '_blank', 'noopener,noreferrer');
            }

            await fetchOffersAndApplications();
            closeScheduleModal();
            setActiveSection('meetings');
        } catch (err) {
            alert(err.response?.data?.detail || 'Erreur lors de la planification.');
        } finally {
            setScheduleSubmitting(false);
        }
    };

    const rankCandidates = async (offerId) => {
        setRankingLoadingOfferId(offerId);
        try {
            await API.post(`offers/${offerId}/rank-candidates/`);
            await fetchOffersAndApplications();
            setActiveSection('applications');
            alert('Classement IA enregistré en base.');
        } catch {
            alert('Erreur lors du classement.');
        } finally {
            setRankingLoadingOfferId(null);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const scheduledMeetings = useMemo(
        () => receivedApplications.filter((a) => a.meeting_date),
        [receivedApplications]
    );

    const meetingDates = scheduledMeetings.map((m) => m.meeting_date);

    const filteredApplications = useMemo(() => {
        if (appFilter === 'all') return receivedApplications;
        return receivedApplications.filter(
            (a) => String(a.offer_details?.id ?? a.offer) === appFilter
        );
    }, [receivedApplications, appFilter]);

    const userInitials = user?.username?.slice(0, 2).toUpperCase() || 'EN';

    const sectionTitle = {
        offers: 'Mes offres de stage',
        applications: 'Analyse IA des candidatures',
        meetings: 'Entretiens planifiés',
        analytics: 'Statistiques & insights',
        settings: 'Paramètres du compte',
    };

    const renderAnalytics = () => (
        <CompanyDashboardCharts stats={dashboardStats} loading={statsLoading} />
    );

    const formatMeetingDate = (dateStr) =>
        new Date(dateStr).toLocaleString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

    const renderOfferFields = () => (
        <>
            {[
                ['Titre', title, setTitle],
                ['Localisation', location, setLocation],
                ['Durée', duration, setDuration],
            ].map(([label, val, setVal]) => (
                <div key={label}>
                    <label className="block text-xs font-semibold text-[#052659] mb-1">{label}</label>
                    <input
                        type="text"
                        value={val}
                        onChange={(e) => setVal(e.target.value)}
                        className="w-full border border-[#C1E8FF] rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#7DA0CA] outline-none"
                        required
                    />
                </div>
            ))}
            <div>
                <label className="block text-xs font-semibold text-[#052659] mb-1">Description</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="4"
                    className="w-full border border-[#C1E8FF] rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#7DA0CA] outline-none"
                    required
                />
            </div>
            <div>
                <label className="block text-xs font-semibold text-[#052659] mb-1">Compétences (virgules)</label>
                <input
                    type="text"
                    value={skillsRequired}
                    onChange={(e) => setSkillsRequired(e.target.value)}
                    placeholder="React, Django, SQL"
                    className="w-full border border-[#C1E8FF] rounded-xl p-2.5 text-sm"
                />
            </div>
            <div>
                <label className="block text-xs font-semibold text-[#052659] mb-1">Technologies</label>
                <input
                    type="text"
                    value={technologies}
                    onChange={(e) => setTechnologies(e.target.value)}
                    placeholder="Vite, PostgreSQL"
                    className="w-full border border-[#C1E8FF] rounded-xl p-2.5 text-sm"
                />
            </div>
        </>
    );

    const renderOffers = () => (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-3">
                <p className="text-sm text-[#7DA0CA]">{myOffers.length} offre(s) publiée(s)</p>
                <button
                    type="button"
                    onClick={() => setShowForm(!showForm)}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#052659] hover:bg-[#7DA0CA] transition"
                >
                    {showForm ? 'Fermer le formulaire' : '+ Nouvelle offre'}
                </button>
            </div>

            {showForm && (
                <form
                    onSubmit={handleCreateOffer}
                    className="bg-white rounded-2xl border border-[#C1E8FF] p-6 shadow-sm space-y-4"
                >
                    <h3 className="font-bold text-[#052659]">Publier une offre</h3>
                    {renderOfferFields()}
                    <button
                        type="submit"
                        disabled={offerSubmitting}
                        className="w-full py-3 rounded-xl bg-[#052659] text-white font-semibold hover:bg-[#7DA0CA] disabled:opacity-60"
                    >
                        {offerSubmitting ? 'Publication…' : "Publier l'offre"}
                    </button>
                </form>
            )}

            <div className="bg-white rounded-2xl border border-[#C1E8FF] shadow-sm overflow-hidden">
                {myOffers.length === 0 ? (
                    <p className="p-12 text-center text-[#7DA0CA]">Aucune offre publiée.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[#f8fbff] text-left text-xs uppercase text-[#7DA0CA]">
                                <th className="px-6 py-4">Offre</th>
                                <th className="px-4 py-4">Lieu</th>
                                <th className="px-4 py-4">Durée</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#C1E8FF]/60">
                            {myOffers.map((offer) => (
                                <tr
                                    key={offer.id}
                                    className={`hover:bg-[#C1E8FF]/10 ${offer.is_active === false ? 'opacity-60' : ''}`}
                                >
                                    <td className="px-6 py-4">
                                        <span className="font-semibold text-[#052659]">{offer.title}</span>
                                        {offer.is_active === false && (
                                            <span className="ml-2 text-[10px] uppercase font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                                                Retirée
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 text-slate-600">{offer.location}</td>
                                    <td className="px-4 py-4 text-slate-600">{offer.duration}</td>
                                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                        <button
                                            type="button"
                                            onClick={() => openEditOffer(offer)}
                                            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-[#7DA0CA] text-[#052659] hover:bg-[#C1E8FF]/50"
                                        >
                                            Modifier
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => rankCandidates(offer.id)}
                                            disabled={rankingLoadingOfferId === offer.id || offer.is_active === false}
                                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#7DA0CA] text-white hover:opacity-90 disabled:opacity-50"
                                        >
                                            {rankingLoadingOfferId === offer.id
                                                ? 'Classement…'
                                                : 'Classer les CVs'}
                                        </button>
                                        {offer.is_active !== false && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteOffer(offer.id)}
                                                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-rose-200 text-rose-600 hover:bg-rose-50"
                                            >
                                                Supprimer
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );

    const renderApplications = () => (
        <div className="bg-white rounded-2xl border border-[#C1E8FF] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[#C1E8FF] flex flex-wrap items-center justify-between gap-4">
                <h3 className="font-bold text-[#052659]">Candidatures reçues</h3>
                <select
                    value={appFilter}
                    onChange={(e) => setAppFilter(e.target.value)}
                    className="text-sm border border-[#C1E8FF] rounded-xl px-3 py-2 text-[#052659] focus:ring-[#7DA0CA]"
                >
                    <option value="all">Toutes les offres</option>
                    {myOffers.map((o) => (
                        <option key={o.id} value={String(o.id)}>
                            {o.title}
                        </option>
                    ))}
                </select>
            </div>

            {filteredApplications.length === 0 ? (
                <p className="p-12 text-center text-[#7DA0CA]">Aucune candidature.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[#f8fbff] text-left text-xs uppercase text-[#7DA0CA]">
                                <th className="px-6 py-4">Candidat</th>
                                <th className="px-4 py-4">Offre</th>
                                <th className="px-4 py-4">Score IA</th>
                                <th className="px-4 py-4">Statut</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#C1E8FF]/60">
                            {filteredApplications.map((app) => {
                                const initials = (app.student_username || '??')
                                    .slice(0, 2)
                                    .toUpperCase();
                                return (
                                    <tr key={app.id} className="hover:bg-[#C1E8FF]/10 align-top">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[#052659] text-white flex items-center justify-center text-xs font-bold">
                                                    {initials}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-[#052659]">
                                                        {app.student_username}
                                                    </p>
                                                    {(rankingByApplication[app.id] || app.ai_rank) && (
                                                        <p className="text-xs text-[#7DA0CA] font-bold">
                                                            Rang #
                                                            {(rankingByApplication[app.id] || app.ai_rank).rank}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-[#052659]">
                                            {app.offer_details?.title}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="w-24">
                                                <div className="h-2 bg-[#C1E8FF] rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-[#052659] rounded-full"
                                                        style={{ width: `${app.ai_matching_score || 0}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-[#052659]">
                                                    {app.ai_matching_score || 0}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(app.status)}`}
                                            >
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedAppDetail(app)}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-bold border border-[#7DA0CA] text-[#052659]"
                                                >
                                                    Détails IA
                                                </button>
                                                <a
                                                    href={`http://127.0.0.1:8000${app.cv_file}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#C1E8FF] text-[#052659]"
                                                >
                                                    CV
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => updateStatus(app.id, 'ACCEPTED')}
                                                    disabled={loadingAction === app.id}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white disabled:opacity-50"
                                                >
                                                    Accepter
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => updateStatus(app.id, 'REJECTED')}
                                                    disabled={loadingAction === app.id}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500 text-white disabled:opacity-50"
                                                >
                                                    Refuser
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openScheduleModal(app)}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#052659] text-white"
                                                >
                                                    Planifier
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

    const renderMeetings = () => (
        <div className="bg-white rounded-2xl border border-[#C1E8FF] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[#C1E8FF]">
                <h3 className="font-bold text-[#052659]">Entretiens planifiés</h3>
                <p className="text-xs text-[#7DA0CA] mt-1">{scheduledMeetings.length} entretien(s)</p>
            </div>
            {scheduledMeetings.length === 0 ? (
                <p className="p-12 text-center text-[#7DA0CA]">Aucun entretien planifié.</p>
            ) : (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-[#f8fbff] text-left text-xs uppercase text-[#7DA0CA]">
                            <th className="px-6 py-4">Candidat</th>
                            <th className="px-4 py-4">Offre</th>
                            <th className="px-4 py-4">Date</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#C1E8FF]/60">
                        {scheduledMeetings.map((app) => {
                            const initials = (app.student_username || '??').slice(0, 2).toUpperCase();
                            return (
                                <tr key={app.id} className="hover:bg-[#C1E8FF]/10">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#052659] text-white flex items-center justify-center text-xs font-bold">
                                                {initials}
                                            </div>
                                            <span className="font-semibold text-[#052659]">
                                                {app.student_username}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">{app.offer_details?.title}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-[#052659]">
                                        {formatMeetingDate(app.meeting_date)}
                                        {app.interview?.duration_minutes && (
                                            <span className="block text-xs text-[#7DA0CA] mt-0.5">
                                                {app.interview.duration_minutes} min
                                                {app.interview.notes ? ' · notes enregistrées' : ''}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/meeting/${app.id}`)}
                                            className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#052659] hover:bg-[#7DA0CA]"
                                        >
                                            Rejoindre l&apos;entretien
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );

    const renderSettings = () => (
        <ProfileSettings
            accountLabel="Compte recruteur · TalentAI"
            stats={[
                { label: 'Offres actives', value: myOffers.length },
                { label: 'Candidatures', value: receivedApplications.length },
            ]}
            onLogout={handleLogout}
        />
    );

    return (
        <div className={`min-h-screen flex bg-[#f4f8fc] ${selectedAppDetail || schedulingApp ? 'overflow-hidden' : ''}`}>
            <aside
                className={`w-64 flex-shrink-0 flex flex-col text-white rounded-r-3xl shadow-xl transition-all ${
                    selectedAppDetail || schedulingApp ? 'blur-md pointer-events-none' : ''
                }`}
                style={{ backgroundColor: C.navy }}
            >
                <div className="p-6 pb-8">
                    <h1 className="text-2xl font-bold tracking-tight">
                        Talent<span style={{ color: C.light }}>AI</span>
                    </h1>
                    <p className="text-xs text-white/60 mt-1">Espace entreprise</p>
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
                            {item.id === 'applications' && receivedApplications.length > 0 && (
                                <span className="ml-auto text-xs bg-[#7DA0CA] text-white px-2 py-0.5 rounded-full">
                                    {receivedApplications.length}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
                <div className="p-3 border-t border-white/10">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/90 hover:bg-white/10"
                    >
                        <NavIcon type="logout" />
                        Déconnexion
                    </button>
                </div>
            </aside>

            <div
                className={`flex-1 flex min-w-0 transition-all ${
                    selectedAppDetail || schedulingApp ? 'blur-md pointer-events-none select-none' : ''
                }`}
            >
                <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
                    <header className="mb-8">
                        <h2 className="text-2xl lg:text-3xl font-bold text-[#052659]">
                            {sectionTitle[activeSection]}
                        </h2>
                    </header>
                    {activeSection === 'offers' && renderOffers()}
                    {activeSection === 'applications' && renderApplications()}
                    {activeSection === 'meetings' && renderMeetings()}
                    {activeSection === 'analytics' && renderAnalytics()}
                    {activeSection === 'settings' && renderSettings()}
                </main>

                <aside className="hidden xl:block w-80 p-6 border-l border-[#C1E8FF]/50 bg-white/50">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-full bg-[#052659] text-white flex items-center justify-center font-bold">
                            {userInitials}
                        </div>
                        <div>
                            <p className="font-bold text-[#052659]">{user?.username}</p>
                            <p className="text-xs text-[#7DA0CA]">Recruteur</p>
                        </div>
                    </div>
                    <MiniCalendar meetingDates={meetingDates} />
                    <div className="mt-6 grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-2xl bg-[#C1E8FF]/40 border border-[#C1E8FF] text-center">
                            <p className="text-2xl font-black text-[#052659]">{myOffers.length}</p>
                            <p className="text-xs text-[#7DA0CA]">Offres</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-[#C1E8FF]/40 border border-[#C1E8FF] text-center">
                            <p className="text-2xl font-black text-[#052659]">{receivedApplications.length}</p>
                            <p className="text-xs text-[#7DA0CA]">Candidatures</p>
                        </div>
                    </div>
                    <div className="mt-6">
                        <p className="text-sm font-bold text-[#052659] mb-3">Prochains entretiens</p>
                        {scheduledMeetings.slice(0, 4).map((m) => (
                            <div key={m.id} className="flex items-center gap-2 py-2 text-sm">
                                <div className="w-2 h-2 rounded-full bg-[#052659]" />
                                <span className="text-[#052659] truncate">{m.student_username}</span>
                            </div>
                        ))}
                        {scheduledMeetings.length === 0 && (
                            <p className="text-xs text-slate-400">Aucun entretien</p>
                        )}
                    </div>
                </aside>
            </div>

            {editingOffer && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-[#052659]/30 backdrop-blur-md"
                        onClick={closeEditOffer}
                        aria-hidden
                    />
                    <form
                        onSubmit={handleUpdateOffer}
                        className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#C1E8FF] z-10 max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-[#052659]">Modifier l&apos;offre</h3>
                                <p className="text-xs text-[#7DA0CA] mt-0.5">
                                    Les changements sont visibles immédiatement pour les étudiants.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeEditOffer}
                                className="text-xl text-slate-400 hover:text-[#052659]"
                            >
                                ×
                            </button>
                        </div>
                        <div className="space-y-4">{renderOfferFields()}</div>
                        <div className="flex gap-3 mt-6">
                            <button
                                type="button"
                                onClick={closeEditOffer}
                                className="flex-1 py-3 rounded-xl border border-[#C1E8FF] text-[#052659] font-semibold text-sm hover:bg-[#C1E8FF]/30"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={offerSubmitting}
                                className="flex-1 py-3 rounded-xl bg-[#052659] text-white font-semibold text-sm hover:bg-[#7DA0CA] disabled:opacity-60"
                            >
                                {offerSubmitting ? 'Enregistrement…' : 'Enregistrer'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {schedulingApp && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-[#052659]/30 backdrop-blur-md"
                        onClick={closeScheduleModal}
                        aria-hidden
                    />
                    <form
                        onSubmit={submitScheduleMeeting}
                        className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#C1E8FF] z-10"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-[#052659]">Planifier un entretien</h3>
                                <p className="text-xs text-[#7DA0CA] mt-0.5">
                                    {schedulingApp.student_username} — {schedulingApp.offer_details?.title}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeScheduleModal}
                                className="text-xl text-slate-400 hover:text-[#052659]"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-[#052659] mb-1">
                                    Date et heure
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={scheduleDate}
                                    onChange={(e) => setScheduleDate(e.target.value)}
                                    className="w-full border border-[#C1E8FF] rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#7DA0CA] outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[#052659] mb-1">
                                    Durée (minutes)
                                </label>
                                <select
                                    value={scheduleDuration}
                                    onChange={(e) => setScheduleDuration(Number(e.target.value))}
                                    className="w-full border border-[#C1E8FF] rounded-xl px-3 py-2.5 text-sm text-[#052659]"
                                >
                                    <option value={30}>30 min</option>
                                    <option value={45}>45 min</option>
                                    <option value={60}>1 h</option>
                                    <option value={90}>1 h 30</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[#052659] mb-1">
                                    Notes (optionnel)
                                </label>
                                <textarea
                                    rows="2"
                                    value={scheduleNotes}
                                    onChange={(e) => setScheduleNotes(e.target.value)}
                                    placeholder="Sujets à aborder, lien complémentaire…"
                                    className="w-full border border-[#C1E8FF] rounded-xl px-3 py-2.5 text-sm resize-none"
                                />
                            </div>

                            <div className="p-3 rounded-xl bg-[#C1E8FF]/40 border border-[#C1E8FF] text-xs text-[#052659] space-y-2">
                                <p>
                                    <strong>Visio intégrée :</strong> salle Jitsi TalentAI (
                                    <span className="text-[#7DA0CA]">/meeting/{schedulingApp.id}</span>
                                    ) — visible par l&apos;étudiant dans son dashboard.
                                </p>
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={openGoogleCalendar}
                                        onChange={(e) => setOpenGoogleCalendar(e.target.checked)}
                                        className="mt-0.5 rounded border-[#7DA0CA]"
                                    />
                                    <span>
                                        Ouvrir <strong>Google Calendar</strong> après validation
                                        {schedulingApp.student_email && (
                                            <> — inviter <strong>{schedulingApp.student_email}</strong></>
                                        )}
                                        . Ajoutez « Google Meet » dans l&apos;événement pour envoyer les
                                        invitations par e-mail.
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                type="button"
                                onClick={closeScheduleModal}
                                className="flex-1 py-2.5 rounded-xl border border-[#7DA0CA] text-[#052659] text-sm font-semibold"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={scheduleSubmitting}
                                className="flex-1 py-2.5 rounded-xl bg-[#052659] text-white text-sm font-semibold hover:bg-[#7DA0CA] disabled:opacity-50"
                            >
                                {scheduleSubmitting ? 'Enregistrement…' : 'Confirmer'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {selectedAppDetail && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-[#052659]/30 backdrop-blur-md"
                        onClick={() => setSelectedAppDetail(null)}
                        aria-hidden
                    />
                    <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#C1E8FF] z-10 max-h-[85vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-[#052659]">
                                    {selectedAppDetail.student_username}
                                </h3>
                                <p className="text-xs text-[#7DA0CA]">{selectedAppDetail.offer_details?.title}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedAppDetail(null)}
                                className="text-xl text-slate-400 hover:text-[#052659]"
                            >
                                ✕
                            </button>
                        </div>
                        {(rankingByApplication[selectedAppDetail.id] || selectedAppDetail.ai_rank) && (
                            <div className="mb-4 p-3 rounded-xl bg-[#C1E8FF]/50 border border-[#C1E8FF]">
                                <p className="text-xs font-bold text-[#052659]">
                                    Rang IA : #
                                    {(rankingByApplication[selectedAppDetail.id] || selectedAppDetail.ai_rank).rank}
                                </p>
                                <p className="text-sm text-slate-600 mt-1 italic">
                                    {(rankingByApplication[selectedAppDetail.id] || selectedAppDetail.ai_rank).justification}
                                </p>
                            </div>
                        )}
                        <p className="text-sm font-semibold text-[#052659] mb-2">
                            Score : {selectedAppDetail.ai_matching_score || 0}%
                        </p>
                        <p className="text-sm text-slate-700 bg-[#f8fbff] p-4 rounded-xl border border-[#C1E8FF] italic leading-relaxed">
                            &ldquo;{selectedAppDetail.ai_analysis_summary || 'Aucune analyse disponible'}&rdquo;
                        </p>
                    </div>
                </div>
            )}

            <AssistantChat />
        </div>
    );
}
