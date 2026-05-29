import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        try {
            const data = await login(username, password);
            const token = localStorage.getItem('access_token');
            let userRole = "";

            if (token) {
                try {
                    const base64Url = token.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));
                    
                    const decoded = JSON.parse(jsonPayload);
                    userRole = decoded.role || decoded.user_role || "";
                } catch (jwtErr) {
                    console.error("Erreur lors du décodage du jeton :", jwtErr);
                }
            }

            if (!userRole && data) {
                const backendUser = data.user || data.user_info || data;
                userRole = backendUser.role || "";
            }

            const finalRole = userRole.toUpperCase().trim();
            console.log("🎯 Redirection basée sur le rôle détecté :", finalRole);

            if (finalRole === 'COMPANY' || finalRole === 'ENTREPRISE') {
                navigate('/company-dashboard'); 
            } else {
                navigate('/student-dashboard'); 
            }

        } catch (err) {
            console.error("Détails de l'erreur de connexion :", err.response?.data || err.message);
            if (err.response && err.response.data) {
                const dataErr = err.response.data;
                if (dataErr.username && Array.isArray(dataErr.username)) {
                    setError(`Erreur Identifiant : ${dataErr.username[0]}`);
                } else if (dataErr.non_field_errors && Array.isArray(dataErr.non_field_errors)) {
                    setError(dataErr.non_field_errors[0]);
                } else if (dataErr.detail) {
                    setError(dataErr.detail);
                } else {
                    setError("Données de connexion invalides.");
                }
            } else {
                setError("Nom d'utilisateur ou mot de passe incorrect.");
            }
        }
    };

    const handleGoogleLogin = () => {
        // Logique ou redirection OAuth Google (fictive pour le moment)
        console.log("Connexion via Google déclenchée");
    };

    return (
        <div className="min-h-screen flex flex-col justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-800 relative">
            
            {/* Bouton discret de retour à l'accueil */}
            <div className="absolute top-6 left-6">
                <Link to="/" className="text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors">
                    ← Retour à l'accueil
                </Link>
            </div>

            <div className="sm:mx-auto w-full max-w-md">
                {/* Logo & En-tête */}
                <div className="text-center mb-8">
                    <div className="inline-flex h-10 w-10 rounded-xl bg-indigo-600 items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-200 mb-4">
                        💡
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                        Bienvenue à nouveau
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                        Accédez à votre espace TalentAI
                    </p>
                </div>

                {/* Boîtier principal */}
                <div className="bg-white py-8 px-6 shadow-xl shadow-slate-100 border border-slate-200/60 rounded-2xl sm:px-10">
                    
                    {/* Message d'erreur */}
                    {error && (
                        <div className="mb-4 text-red-600 text-xs font-semibold bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-2">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    {/* Formulaire standard */}
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5">
                                Identifiant ou Email
                            </label>
                            <input
                                type="text"
                                required
                                className="block w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl placeholder-slate-400 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white transition-all"
                                placeholder="votre_username ou email@exemple.com"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-xs font-bold uppercase tracking-wide text-slate-700">
                                    Mot de passe
                                </label>
                                <a href="#forgot" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                                    Mot de passe oublié ?
                                </a>
                            </div>
                            <input
                                type="password"
                                required
                                className="block w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl placeholder-slate-400 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white transition-all"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                className="w-full flex justify-center py-3 px-4 bg-indigo-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/10 hover:bg-indigo-700 hover:shadow-lg transition-all"
                            >
                                Se connecter
                            </button>
                        </div>
                    </form>

                    {/* Séparateur horizontal "Ou" */}
                    <div className="mt-6 relative">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-xs font-medium uppercase tracking-wider">
                            <span className="bg-white px-3 text-slate-400">Ou continuer avec</span>
                        </div>
                    </div>

                    {/* Bouton d'authentification Google */}
                    <div className="mt-6">
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path
                                    fill="#EA4335"
                                    d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3A11.934 11.934 0 0 0 12 0C7.33 0 3.305 2.536 1.127 6.273l4.139 3.492Z"
                                />
                                <path
                                    fill="#4285F4"
                                    d="M23.455 12.273c0-.818-.073-1.609-.209-2.373H12v4.509h6.418a5.49 5.49 0 0 1-2.382 3.6l4.1 3.182c2.4-2.21 3.782-5.464 3.782-9.318Z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.266 14.235A7.012 7.012 0 0 1 4.909 12c0-.791.137-1.555.357-2.265L1.127 6.273A11.921 11.921 0 0 0 0 12c0 2.11.545 4.091 1.509 5.818l3.757-3.583Z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 24c3.24 0 5.955-1.073 7.945-2.909l-4.1-3.182c-1.137.764-2.591 1.218-4.136 1.218-3.191 0-5.9-2.155-6.864-5.064L1.086 17.65A11.947 11.947 0 0 0 12 24Z"
                                />
                            </svg>
                            <span>Google</span>
                        </button>
                    </div>

                </div>

                {/* Lien bas de page d'inscription */}
                <p className="mt-6 text-center text-sm text-slate-500">
                    Nouveau sur la plateforme ?{' '}
                    <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                        Créer un compte
                    </Link>
                </p>
            </div>
        </div>
    );
}