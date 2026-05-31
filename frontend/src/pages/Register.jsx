import { useState } from 'react';
import API from '../services/api';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
    const [formData, setFormData] = useState({
        username: '', 
        email: '', 
        password: '', 
        role: 'STUDENT', 
        telephone: '', 
        company_name: ''
    });
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        try {
            await API.post('auth/register/', formData);
            setSuccess('✨ Inscription réussie ! Redirection vers la page de connexion...');
            setTimeout(() => navigate('/login'), 2500);
        } catch (err) {
            console.error("Détails complets de l'erreur d'inscription :", err.response?.data);
            
            if (err.response && err.response.data) {
                const errors = err.response.data;
                const firstKey = Object.keys(errors)[0];
                const errorMessage = Array.isArray(errors[firstKey]) ? errors[firstKey][0] : errors[firstKey];
                setError(`Erreur [${firstKey}] : ${errorMessage}`);
            } else {
                setError("Une erreur est survenue lors de l'inscription.");
            }
        }
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
                <div className="text-center mb-6">
                    <div className="inline-flex h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-200 mb-4">
                        💡
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                        Créer un compte
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                        Rejoignez TalentAI et automatisez vos processus
                    </p>
                </div>

                {/* Boîtier principal */}
                <div className="bg-white py-8 px-6 shadow-xl shadow-slate-100 border border-slate-200/60 rounded-2xl sm:px-10">
                    
                    {/* Message de Succès */}
                    {success && (
                        <div className="mb-4 text-emerald-600 text-xs font-semibold bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-center gap-2">
                            <span>✅</span> {success}
                        </div>
                    )}

                    {/* Message d'Erreur */}
                    {error && (
                        <div className="mb-4 text-red-600 text-xs font-semibold bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-2">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        
                        {/* Type de compte (Sélecteur de rôle mis en valeur) */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5">
                                Vous êtes ?
                            </label>
                            <select 
                                value={formData.role} 
                                onChange={(e) => setFormData({...formData, role: e.target.value})}
                                className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all cursor-pointer"
                            >
                                <option value="STUDENT">👨‍🎓 Étudiant (recherche de stage)</option>
                                <option value="COMPANY">🏢 Entreprise (recruteur / éditeur)</option>
                            </select>
                        </div>

                        <hr className="border-slate-100 my-2" />

                        {/* Champ : Nom d'utilisateur */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5">
                                Nom d'utilisateur
                            </label>
                            <input 
                                type="text" 
                                placeholder="ex: amine_dev" 
                                required 
                                className="block w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl placeholder-slate-400 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                                value={formData.username}
                                onChange={e => setFormData({...formData, username: e.target.value})} 
                            />
                        </div>

                        {/* Champ : Adresse Email */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5">
                                Adresse Email
                            </label>
                            <input 
                                type="email" 
                                placeholder="adresse@exemple.com" 
                                required 
                                className="block w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl placeholder-slate-400 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})} 
                            />
                        </div>

                        {/* Champ : Mot de passe */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5">
                                Mot de passe
                            </label>
                            <input 
                                type="password" 
                                placeholder="••••••••" 
                                required 
                                className="block w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl placeholder-slate-400 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                                value={formData.password}
                                onChange={e => setFormData({...formData, password: e.target.value})} 
                            />
                        </div>

                        {/* Champ : Téléphone */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5">
                                Numéro de Téléphone
                            </label>
                            <input 
                                type="text" 
                                placeholder="+212 600-000000" 
                                className="block w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl placeholder-slate-400 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                                value={formData.telephone}
                                onChange={e => setFormData({...formData, telephone: e.target.value})} 
                            />
                        </div>

                        {/* Champ Conditionnel : Nom de l'entreprise */}
                        {formData.role === 'COMPANY' && (
                            <div className="animate-[fadeIn_0.3s_ease-out]">
                                <label className="block text-xs font-bold uppercase tracking-wide text-indigo-700 mb-1.5">
                                    Nom de l'entreprise
                                </label>
                                <input 
                                    type="text" 
                                    placeholder="ex: Google LLC" 
                                    required 
                                    className="block w-full px-3.5 py-2.5 bg-indigo-50/30 border border-indigo-200 rounded-xl placeholder-indigo-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                                    value={formData.company_name}
                                    onChange={e => setFormData({...formData, company_name: e.target.value})} 
                                />
                            </div>
                        )}

                        {/* Bouton d'action */}
                        <div className="pt-2">
                            <button 
                                type="submit" 
                                className="w-full flex justify-center py-3 px-4 bg-indigo-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/10 hover:bg-indigo-700 hover:shadow-lg transition-all"
                            >
                                Créer mon compte
                            </button>
                        </div>
                    </form>
                </div>

                {/* Lien vers la page de connexion */}
                <p className="mt-6 text-center text-sm text-slate-500">
                    Vous avez déjà un compte ?{' '}
                    <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                        Se connecter
                    </Link>
                </p>
            </div>
        </div>
    );
}