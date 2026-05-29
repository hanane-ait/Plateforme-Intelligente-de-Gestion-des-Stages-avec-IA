import { useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

const ROLE_OPTIONS = [
    { value: 'STUDENT', label: 'Étudiant' },
    { value: 'COMPANY', label: 'Entreprise (recruteur)' },
];

const ROLE_LABELS = {
    STUDENT: 'Étudiant',
    COMPANY: 'Entreprise',
    ADMIN: 'Administrateur',
};

function getInitials(username) {
    if (!username) return '?';
    const parts = username.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return username.slice(0, 2).toUpperCase();
}

function dashboardPathForRole(role) {
    return role === 'COMPANY' ? '/company-dashboard' : '/student-dashboard';
}

export default function ProfileSettings({ accountLabel, stats = [], onLogout }) {
    const { user, updateUser, fetchCurrentUser } = useContext(AuthContext);

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('STUDENT');
    const [companyName, setCompanyName] = useState('');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loadingProfile, setLoadingProfile] = useState(true);

    useEffect(() => {
        let active = true;

        const applyProfile = (profile) => {
            if (!profile || !active) return false;
            setUsername(profile.username || '');
            setEmail(profile.email || '');
            setRole(profile.role === 'COMPANY' ? 'COMPANY' : 'STUDENT');
            return true;
        };

        (async () => {
            const token = localStorage.getItem('access_token');
            if (!token) {
                setLoadingProfile(false);
                return;
            }

            if (applyProfile(user)) {
                setLoadingProfile(false);
            }

            const fresh = await fetchCurrentUser();
            if (!active) return;

            if (applyProfile(fresh) || applyProfile(user)) {
                setLoadingProfile(false);
                return;
            }
            setLoadingProfile(false);
        })();

        return () => {
            active = false;
        };
        // Un seul chargement à l'ouverture des paramètres (évite la rafale GET /auth/me/)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchCurrentUser]);

    const userInitials = useMemo(() => getInitials(username || user?.username), [username, user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        setSaving(true);

        const roleBeforeSave = user?.role;
        const payload = {
            username: username.trim(),
            email: email.trim(),
            role,
        };
        if (role === 'COMPANY' && companyName.trim()) {
            payload.company_name = companyName.trim();
        }

        try {
            const updated = await updateUser(payload);
            const roleChanged =
                roleBeforeSave &&
                updated.role &&
                roleBeforeSave !== updated.role;

            if (roleChanged) {
                const target = `${dashboardPathForRole(updated.role)}?section=settings`;
                window.location.assign(target);
                return;
            }

            setMessage({ type: 'success', text: 'Profil mis à jour avec succès.' });
        } catch (err) {
            const data = err.response?.data;
            let text = 'Impossible de mettre à jour le profil.';
            if (typeof data === 'string') {
                text = data;
            } else if (data && typeof data === 'object') {
                const firstKey = Object.keys(data)[0];
                const val = data[firstKey];
                text = Array.isArray(val) ? val[0] : String(val);
            }
            setMessage({ type: 'error', text });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex justify-center w-full px-4 sm:px-8 lg:px-12">
            <div className="w-full max-w-2xl min-w-[min(100%,320px)]">
                <div className="bg-white rounded-3xl border border-[#C1E8FF]/80 shadow-lg shadow-[#052659]/5 overflow-hidden">
                    <div className="px-10 sm:px-14 pt-10 pb-6 text-center border-b border-[#C1E8FF]/60 bg-gradient-to-b from-[#f8fbff] to-white">
                        <div className="mx-auto w-20 h-20 rounded-2xl bg-[#052659] text-white flex items-center justify-center text-2xl font-semibold tracking-tight shadow-md shadow-[#052659]/20">
                            {userInitials}
                        </div>
                        <h3 className="mt-5 text-xl font-bold text-[#052659] tracking-tight">
                            {username || user?.username || 'Mon compte'}
                        </h3>
                        <p className="mt-1 text-sm text-[#7DA0CA]">{accountLabel}</p>
                        <span className="inline-block mt-3 text-xs font-medium uppercase tracking-wider text-[#052659]/70 bg-[#C1E8FF]/40 px-3 py-1 rounded-full">
                            {ROLE_LABELS[role] || role}
                        </span>
                    </div>

                    {loadingProfile ? (
                        <div className="px-10 sm:px-14 py-12 text-center text-sm text-[#7DA0CA]">
                            Chargement du profil…
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="px-10 sm:px-14 py-8 space-y-5">
                            {message.text && (
                                <div
                                    className={`text-sm text-center px-4 py-3 rounded-xl border ${
                                        message.type === 'success'
                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                            : 'bg-rose-50 text-rose-800 border-rose-200'
                                    }`}
                                >
                                    {message.text}
                                </div>
                            )}

                            <div className="space-y-1.5 text-center">
                                <label htmlFor="profile-username" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Nom d&apos;utilisateur
                                </label>
                                <input
                                    id="profile-username"
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full text-center px-4 py-3 rounded-xl border border-[#C1E8FF] bg-slate-50/50 text-[#052659] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DA0CA]/40 focus:border-[#7DA0CA] transition"
                                />
                            </div>

                            <div className="space-y-1.5 text-center">
                                <label htmlFor="profile-email" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Email
                                </label>
                                <input
                                    id="profile-email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full text-center px-4 py-3 rounded-xl border border-[#C1E8FF] bg-slate-50/50 text-[#052659] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DA0CA]/40 focus:border-[#7DA0CA] transition"
                                />
                            </div>

                            <div className="space-y-1.5 text-center">
                                <label htmlFor="profile-role" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Rôle
                                </label>
                                <select
                                    id="profile-role"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full text-center px-4 py-3 rounded-xl border border-[#C1E8FF] bg-white text-[#052659] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DA0CA]/40 focus:border-[#7DA0CA] transition cursor-pointer"
                                >
                                    {ROLE_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[11px] text-slate-400 mt-1">
                                    Un changement de rôle redirige vers le tableau de bord correspondant.
                                </p>
                            </div>

                            {role === 'COMPANY' && (
                                <div className="space-y-1.5 text-center">
                                    <label htmlFor="profile-company" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Nom de l&apos;entreprise
                                    </label>
                                    <input
                                        id="profile-company"
                                        type="text"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        placeholder="Optionnel si déjà enregistré"
                                        className="w-full text-center px-4 py-3 rounded-xl border border-[#C1E8FF] bg-slate-50/50 text-[#052659] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DA0CA]/40 focus:border-[#7DA0CA] transition"
                                    />
                                </div>
                            )}

                            {stats.length > 0 && (
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    {stats.map((stat) => (
                                        <div
                                            key={stat.label}
                                            className="text-center rounded-xl bg-[#f4f8fc] border border-[#C1E8FF]/50 py-3 px-2"
                                        >
                                            <p className="text-lg font-bold text-[#052659]">{stat.value}</p>
                                            <p className="text-[10px] uppercase tracking-wide text-slate-500 mt-0.5">
                                                {stat.label}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-3.5 rounded-xl bg-[#052659] text-white text-sm font-semibold hover:bg-[#7DA0CA] transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                            >
                                {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
                            </button>
                        </form>
                    )}

                    <div className="px-10 sm:px-14 pb-8">
                        <button
                            type="button"
                            onClick={onLogout}
                            className="w-full py-3 rounded-xl border border-[#C1E8FF] text-[#052659] text-sm font-semibold hover:bg-[#C1E8FF]/30 transition"
                        >
                            Se déconnecter
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
