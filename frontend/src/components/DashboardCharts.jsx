const PALETTE = ['#052659', '#5488B3', '#7DA0CA', '#94b8d9', '#C1E8FF', '#2d6a9f'];

const STATUS_COLORS = {
    PENDING: '#f59e0b',
    ANALYZED: '#5488B3',
    INTERVIEW: '#052659',
    ACCEPTED: '#10b981',
    REJECTED: '#f43f5e',
};

function AnalyticsShell({ title, subtitle, children, loading }) {
    if (loading) {
        return (
            <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
                <div className="h-32 rounded-3xl bg-gradient-to-r from-[#C1E8FF]/50 to-white" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((n) => (
                        <div key={n} className="h-28 rounded-2xl bg-white/80 border border-[#C1E8FF]" />
                    ))}
                </div>
                <div className="h-72 rounded-3xl bg-white/80 border border-[#C1E8FF]" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#052659] via-[#2d5a8e] to-[#7DA0CA] p-8 mb-8 shadow-xl shadow-[#052659]/20">
                <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -left-4 bottom-0 w-32 h-32 rounded-full bg-[#C1E8FF]/20 blur-xl" />
                <div className="relative z-10">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70 mb-2">
                        TalentAI Insights
                    </p>
                    <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{title}</h2>
                    <p className="text-sm text-white/80 mt-2 max-w-lg">{subtitle}</p>
                </div>
            </div>
            {children}
        </div>
    );
}

function MetricCard({ label, value, hint, accent = 'from-[#052659] to-[#5488B3]', icon }) {
    return (
        <div className="group relative overflow-hidden rounded-2xl bg-white border border-[#C1E8FF]/80 p-5 shadow-sm hover:shadow-lg hover:shadow-[#052659]/5 transition-all duration-300">
            <div
                className={`absolute top-0 right-0 w-24 h-24 rounded-bl-[4rem] bg-gradient-to-br ${accent} opacity-[0.08] group-hover:opacity-[0.14] transition-opacity`}
            />
            <div className="flex items-start justify-between gap-3 relative">
                <div>
                    <p className="text-3xl font-black text-[#052659] tabular-nums tracking-tight">{value}</p>
                    <p className="text-sm font-semibold text-[#7DA0CA] mt-1">{label}</p>
                    {hint && <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>}
                </div>
                {icon && (
                    <div
                        className={`w-11 h-11 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-white shadow-md shrink-0`}
                    >
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
}

function DonutDistribution({ title, subtitle, items, emptyLabel }) {
    const total = items.reduce((sum, i) => sum + i.count, 0);
    if (!items.length || total === 0) {
        return (
            <Panel title={title} subtitle={subtitle}>
                <p className="text-sm text-slate-400 text-center py-16">{emptyLabel}</p>
            </Panel>
        );
    }

    let acc = 0;
    const gradientStops = items
        .map((item, idx) => {
            const pct = (item.count / total) * 100;
            const start = acc;
            acc += pct;
            const color = STATUS_COLORS[item.key] || PALETTE[idx % PALETTE.length];
            return `${color} ${start}% ${acc}%`;
        })
        .join(', ');

    return (
        <Panel title={title} subtitle={subtitle}>
            <div className="flex flex-col md:flex-row items-center gap-8 py-2">
                <div className="relative shrink-0">
                    <div
                        className="w-44 h-44 rounded-full shadow-inner"
                        style={{ background: `conic-gradient(${gradientStops})` }}
                    />
                    <div className="absolute inset-[22%] rounded-full bg-white shadow-sm flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-[#052659]">{total}</span>
                        <span className="text-[10px] uppercase tracking-widest text-[#7DA0CA] font-semibold">
                            Total
                        </span>
                    </div>
                </div>
                <div className="flex-1 w-full space-y-3">
                    {items.map((item, idx) => {
                        const pct = Math.round((item.count / total) * 100);
                        const color = STATUS_COLORS[item.key] || PALETTE[idx % PALETTE.length];
                        return (
                            <div key={item.key || item.label} className="flex items-center gap-3">
                                <span
                                    className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white shadow-sm"
                                    style={{ backgroundColor: color }}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline gap-2 mb-1">
                                        <span className="text-sm font-medium text-[#052659] truncate">
                                            {item.label}
                                        </span>
                                        <span className="text-xs font-bold text-[#7DA0CA] tabular-nums shrink-0">
                                            {item.count} · {pct}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-[#f0f6fc] overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700 ease-out"
                                            style={{ width: `${pct}%`, backgroundColor: color }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Panel>
    );
}

function RankedBars({ title, subtitle, items, emptyLabel }) {
    const max = Math.max(...items.map((i) => i.count), 1);

    return (
        <Panel title={title} subtitle={subtitle}>
            {items.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-16">{emptyLabel}</p>
            ) : (
                <div className="space-y-4 pt-1">
                    {items.map((item, idx) => (
                        <div key={item.key || item.label} className="flex items-center gap-4">
                            <span className="w-8 h-8 rounded-xl bg-[#f4f8fc] border border-[#C1E8FF] text-xs font-black text-[#052659] flex items-center justify-center shrink-0">
                                {idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between mb-1.5">
                                    <span className="text-sm font-semibold text-[#052659] truncate pr-2">
                                        {item.label}
                                    </span>
                                    <span className="text-sm font-bold text-[#7DA0CA] tabular-nums">
                                        {item.count}
                                    </span>
                                </div>
                                <div className="h-3 rounded-full bg-[#f0f6fc] overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-[#052659] to-[#7DA0CA] transition-all duration-700"
                                        style={{ width: `${(item.count / max) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Panel>
    );
}

function Panel({ title, subtitle, children }) {
    return (
        <div className="rounded-3xl bg-white/90 backdrop-blur-sm border border-[#C1E8FF]/90 p-6 md:p-8 shadow-sm">
            <div className="mb-6">
                <h4 className="text-base font-bold text-[#052659]">{title}</h4>
                {subtitle && <p className="text-xs text-[#7DA0CA] mt-1">{subtitle}</p>}
            </div>
            {children}
        </div>
    );
}

const icons = {
    applications: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    ),
    offers: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
        </svg>
    ),
    calendar: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    ),
    chart: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    ),
};

export function StudentDashboardCharts({ stats, loading }) {
    return (
        <AnalyticsShell
            loading={loading}
            title="Vos statistiques"
            subtitle="Visualisez l'avancement de vos candidatures et entretiens sur TalentAI."
        >
            {stats && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard
                            label="Candidatures envoyées"
                            value={stats.applications_total}
                            icon={icons.applications}
                        />
                        <MetricCard
                            label="Offres disponibles"
                            value={stats.offers_available}
                            accent="from-[#5488B3] to-[#7DA0CA]"
                            icon={icons.offers}
                        />
                        <MetricCard
                            label="Entretiens à venir"
                            value={stats.meetings_upcoming}
                            accent="from-[#052659] to-[#7DA0CA]"
                            icon={icons.calendar}
                        />
                        <MetricCard
                            label="Entretiens passés"
                            value={stats.meetings_past}
                            accent="from-[#94b8d9] to-[#C1E8FF]"
                            icon={icons.chart}
                        />
                    </div>
                    <DonutDistribution
                        title="Répartition par statut"
                        subtitle="Où en sont vos dossiers aujourd'hui"
                        items={stats.applications_by_status || []}
                        emptyLabel="Postulez à une offre pour voir vos statistiques."
                    />
                </div>
            )}
        </AnalyticsShell>
    );
}

export function CompanyDashboardCharts({ stats, loading }) {
    return (
        <AnalyticsShell
            loading={loading}
            title="Pilotage recrutement"
            subtitle="Indicateurs clés sur vos offres, candidatures et entretiens."
        >
            {stats && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard
                            label="Offres actives"
                            value={stats.offers_active}
                            hint={`${stats.offers_total} publiées au total`}
                            icon={icons.offers}
                        />
                        <MetricCard
                            label="Candidatures reçues"
                            value={stats.applications_total}
                            accent="from-[#5488B3] to-[#7DA0CA]"
                            icon={icons.applications}
                        />
                        <MetricCard
                            label="Entretiens à venir"
                            value={stats.interviews_upcoming}
                            accent="from-[#052659] to-[#7DA0CA]"
                            icon={icons.calendar}
                        />
                        <MetricCard
                            label="Offres retirées"
                            value={stats.offers_inactive}
                            accent="from-[#94b8d9] to-[#C1E8FF]"
                            icon={icons.chart}
                        />
                    </div>
                    <div className="grid lg:grid-cols-2 gap-6">
                        <DonutDistribution
                            title="Pipeline candidatures"
                            subtitle="Répartition par étape de sélection"
                            items={stats.applications_by_status || []}
                            emptyLabel="Aucune candidature pour le moment."
                        />
                        <RankedBars
                            title="Top offres"
                            subtitle="Volume de candidatures par poste"
                            items={(stats.applications_by_offer || []).map((o) => ({
                                label: o.label,
                                count: o.count,
                                key: o.offer_id,
                            }))}
                            emptyLabel="Publiez une offre pour recevoir des candidatures."
                        />
                    </div>
                </div>
            )}
        </AnalyticsShell>
    );
}
