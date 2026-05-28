import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import OfferList from './pages/OfferList';
import CreateOffer from './pages/CreateOffer';
import StudentDashboard from './pages/dashboards/StudentDashboard';
import CompanyDashboard from './pages/dashboards/CompanyDashboard';

const STATS = [
  { num: '120+', label: 'Offres actives' },
  { num: '85%', label: 'Taux de matching' },
  { num: '40+', label: 'Entreprises partenaires' },
];

const FEATURES = [
  { icon: '🎯', title: 'Analyse de CV', desc: "Extraction automatique de vos compétences depuis votre PDF." },
  { icon: '📊', title: 'Score de matching', desc: "Compatibilité calculée entre votre profil et chaque offre." },
  { icon: '✨', title: 'Recommandations', desc: "Suggestions personnalisées avant même de postuler." },
  { icon: '✉️', title: 'Lettre de motivation', desc: "Génération automatique adaptée à chaque offre." },
];

const STEPS = [
  { n: 1, title: 'Créez votre profil', desc: 'Inscrivez-vous et uploadez votre CV en PDF.' },
  { n: 2, title: "L'IA analyse votre profil", desc: 'Extraction de compétences et calcul du score de matching.' },
  { n: 3, title: 'Postulez en un clic', desc: 'Envoyez votre candidature avec lettre générée automatiquement.' },
];

function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">

      {/* NAVBAR PROFESSIONNELLE */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 bg-clip-text text-transparent">
            Talent<span className="text-indigo-600">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
            Connexion
          </Link>
          <Link to="/register" className="text-sm font-semibold bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-700 hover:shadow transition-all transform hover:-translate-y-0.5">
            Créer un compte
          </Link>
        </div>
      </nav>

      {/* HERO SECTION DESIGN HAUT DE GAMME */}
      <header className="relative overflow-hidden bg-white pt-16 pb-20 border-b border-slate-200/60">
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full border border-indigo-100 mb-6 animate-pulse">
            ✨ Analyse IA de CV &amp; matching intelligent
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 leading-[1.15] mb-6">
            Votre stage idéal, trouvé par <br />
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-500 bg-clip-text text-transparent">
              l'intelligence artificielle
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-500 leading-relaxed mb-10 max-w-2xl mx-auto">
            Uploadez votre CV, laissez l'IA analyser vos compétences et découvrez les stages qui vous correspondent — avec un score de compatibilité calculé en temps réel.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/register" className="px-8 py-3.5 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all text-center">
              Espace Étudiant
            </Link>
            <Link to="/login" className="px-8 py-3.5 bg-white text-slate-700 font-semibold rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all text-center">
              Espace Recruteur
            </Link>
          </div>
        </div>
        {/* Background Décoratif subtil */}
        <div className="absolute top-0 left-1/2 -z-10 h-[600px] w-[1000px] -translate-x-1/2 [mask-image:radial-gradient(ellipse_at_top,white,transparent)] bg-gradient-to-b from-indigo-50/40 to-transparent" />
      </header>

      {/* BANDEAU DES STATISTIQUES */}
      <section className="bg-slate-900 text-white py-10 shadow-inner">
        <div className="max-w-5xl mx-auto px-4 flex items-center gap-8 flex-wrap justify-around">
          {STATS.map((s, i) => (
            <div key={s.label} className="text-center min-w-[150px]">
              <div className="text-3xl font-extrabold text-indigo-400">{s.num}</div>
              <div className="text-xs text-slate-400 font-medium tracking-wide mt-1 uppercase">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES GRILLE INTÉGRÉE */}
      <section className="max-w-5xl mx-auto px-6 py-20 w-full">
        <div className="text-center mb-12">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Technologies Intégrées</p>
          <h2 className="text-3xl font-bold text-slate-900">Une IA qui travaille pour vous</h2>
          <p className="text-sm text-slate-400 mt-2">Des outils intelligents pour automatiser et maximiser vos chances.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-all">
              <div className="text-2xl mb-3 h-10 w-10 bg-slate-50 flex items-center justify-center rounded-lg">{f.icon}</div>
              <div className="text-sm font-bold text-slate-800 mb-1.5">{f.title}</div>
              <div className="text-xs text-slate-500 leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* COMMENT ÇA MARCHE + PROFILS ACCÈS */}
      <section className="bg-white border-t border-b border-slate-200/60 w-full py-16">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Workflow</p>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">En 3 étapes simples</h2>
            <div className="flex flex-col divide-y divide-slate-100">
              {STEPS.map(s => (
                <div key={s.n} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    {s.n}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{s.title}</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Pour qui ?</p>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Deux profils, une plateforme</h2>
            <div className="flex flex-col gap-4">
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-5 shadow-sm">
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold mb-3 inline-block">Étudiant</span>
                <p className="text-sm font-bold text-slate-800 mb-2">Trouvez votre stage</p>
                <ul className="text-xs text-slate-500 space-y-2">
                  <li className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> Dashboard candidatures complet</li>
                  <li className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> Suivi des statuts en temps réel</li>
                  <li className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> Lien entretien Meet &amp; Score IA intégrés</li>
                </ul>
              </div>
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 shadow-sm">
                <span className="text-xs bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full font-semibold mb-3 inline-block">Entreprise</span>
                <p className="text-sm font-bold text-slate-800 mb-2">Recrutez les meilleurs profils</p>
                <ul className="text-xs text-slate-500 space-y-2">
                  <li className="flex items-center gap-1.5"><span className="text-indigo-600">✓</span> Publication d'offres simplifiée</li>
                  <li className="flex items-center gap-1.5"><span className="text-indigo-600">✓</span> Classement et matching automatique des CVs</li>
                  <li className="flex items-center gap-1.5"><span className="text-indigo-600">✓</span> Planification d'entretiens simplifiée</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION CRÉATION DE COMPTE (CTA UNIQUE ET PRO) */}
      <div className="max-w-5xl mx-auto px-6 py-12 w-full">
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 border border-slate-800 rounded-2xl p-8 md:p-12 text-center shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Prêt à trouver votre stage idéal ?</h2>
            <p className="text-sm text-indigo-200 mb-6 max-w-xl mx-auto">Rejoignez dès maintenant notre écosystème intelligent pour accélérer vos processus de recrutement.</p>
            <div className="flex justify-center">
              <Link to="/register" className="px-6 py-3 bg-white text-indigo-950 text-sm font-bold rounded-xl shadow-md hover:bg-slate-50 transition-all transform hover:-translate-y-0.5">
                Créer mon compte gratuitement
              </Link>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 h-40 w-40 bg-indigo-700/20 rounded-full blur-2xl" />
        </div>
      </div>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-slate-200 bg-white px-6 py-6 flex justify-between items-center flex-wrap gap-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">TalentAI</span>
        </div>
        <div className="flex gap-6 text-xs font-medium text-slate-400">
          <Link to="/" className="hover:text-indigo-600 transition-colors">À propos</Link>
          <span className="cursor-pointer hover:text-indigo-600 transition-colors">Contact</span>
          <span className="cursor-pointer hover:text-indigo-600 transition-colors">Confidentialité</span>
        </div>
        <span className="text-xs text-slate-400">© {new Date().getFullYear()} TalentAI. Tous droits réservés.</span>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/offers" element={<OfferList />} />
          <Route path="/offers/new" element={<CreateOffer />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/company-dashboard" element={<CompanyDashboard />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}