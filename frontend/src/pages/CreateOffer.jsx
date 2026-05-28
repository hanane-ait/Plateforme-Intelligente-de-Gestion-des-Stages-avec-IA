import { useState } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function CreateOffer() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [duration, setDuration] = useState('');
    const [skills, setSkills] = useState(''); // Saisis sous forme : Java, React, SQL
    const [techs, setTechs] = useState('');   // Saisis sous forme : Spring Boot, Django
    const [msg, setMsg] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Transformer les chaînes de caractères en listes JSON pour l'IA
        const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s !== '');
        const techsArray = techs.split(',').map(t => t.trim()).filter(t => t !== '');

        try {
            await API.post('offers/', {
                title,
                description,
                location,
                duration,
                skills_required: skillsArray,
                technologies: techsArray
            });
            setMsg('Offre publiée avec succès !');
            setTimeout(() => navigate('/offers'), 2000);
        } catch (err) {
            setMsg("Erreur lors de la publication. Vérifiez vos droits d'entreprise.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl w-full bg-white p-8 rounded-xl shadow-md space-y-6">
                <h2 className="text-3xl font-bold text-gray-900 text-center">Publier une Offre de Stage</h2>
                {msg && <div className="text-center text-sm p-3 bg-blue-100 rounded text-blue-800 font-medium">{msg}</div>}
                
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Titre du stage</label>
                        <input type="text" required className="mt-1 block w-full px-3 py-2 border rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Ex: Développeur Full-Stack React/Django" value={title} onChange={e => setTitle(e.target.value)} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description du poste</label>
                        <textarea required rows="4" className="mt-1 block w-full px-3 py-2 border rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Détaillez les missions du stagiaire..." value={description} onChange={e => setDescription(e.target.value)}></textarea>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Localisation</label>
                            <input type="text" required className="mt-1 block w-full px-3 py-2 border rounded shadow-sm"
                                placeholder="Ex: Casablanca, Télétravail" value={location} onChange={e => setLocation(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Durée</label>
                            <input type="text" required className="mt-1 block w-full px-3 py-2 border rounded shadow-sm"
                                placeholder="Ex: 4 à 6 mois" value={duration} onChange={e => setDuration(e.target.value)} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Compétences clés (séparées par des virgules)</label>
                        <input type="text" className="mt-1 block w-full px-3 py-2 border rounded border-indigo-200 bg-indigo-50/30"
                            placeholder="Ex: Java, React, SQL, Algorithmique" value={skills} onChange={e => setSkills(e.target.value)} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Technologies cibles (séparées par des virgules)</label>
                        <input type="text" className="mt-1 block w-full px-3 py-2 border rounded border-indigo-200 bg-indigo-50/30"
                            placeholder="Ex: Django, Git, PostgreSQL, Tailwind" value={techs} onChange={e => setTechs(e.target.value)} />
                    </div>

                    <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium text-lg transition duration-150">
                        Mettre en ligne l'offre
                    </button>
                </form>
            </div>
        </div>
    );
}