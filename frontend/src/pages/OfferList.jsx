import { useEffect, useState } from 'react';
import API from '../services/api';

export default function OfferList() {
    const [offers, setOffers] = useState([]);
    const [selectedOffer, setSelectedOffer] = useState(null); // Gère l'offre sélectionnée pour la modal
    const [cvFile, setCvFile] = useState(null);
    const [coverLetter, setCoverLetter] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. Récupération des offres au chargement
    useEffect(() => {
        API.get('offers/') // Assurez-vous que cet endpoint liste vos offres globales
            .then(res => setOffers(res.data))
            .catch(err => console.error("Erreur lors de la récupération des offres", err));
    }, []);

    // 2. Traitement de la soumission de candidature
    const handleApplySubmit = async (e) => {
        e.preventDefault();
        if (!cvFile) {
            alert("Veuillez téléverser votre CV au format PDF.");
            return;
        }

        setIsSubmitting(true);
        setMessage('');

        // TRÈS IMPORTANT : Pour envoyer un fichier, on doit utiliser l'objet FormData natif de JavaScript
        const formDataToSend = new FormData();
        formDataToSend.append('offer', selectedOffer.id);
        formDataToSend.append('cv_file', cvFile);
        formDataToSend.append('cover_letter', coverLetter);

        try {
            await API.post(`offers/${selectedOffer.id}/apply/`, formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data', // Indique qu'on envoie un fichier
                },
            });
            setMessage('🎉 Candidature envoyée avec succès !');
            setCvFile(null);
            setCoverLetter('');
            setTimeout(() => setSelectedOffer(null), 2000); // Ferme la modal après succès
        } catch (err) {
            console.error(err);
            setMessage('❌ Erreur : Vous avez peut-être déjà postulé à cette offre.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-3xl font-extrabold text-indigo-950 mb-8">Offres de Stages Disponibles</h1>

                {/* Liste des offres */}
                <div className="grid grid-cols-1 gap-6">
                    {offers.map(offer => (
                        <div key={offer.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{offer.title}</h2>
                                <p className="text-sm text-indigo-600 font-medium">📍 {offer.location} • ⏱️ {offer.duration}</p>
                                <p className="text-gray-600 mt-2 text-sm line-clamp-2">{offer.description}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedOffer(offer)}
                                className="px-4 py-2 bg-indigo-600 text-white font-medium text-sm rounded-lg hover:bg-indigo-700 transition"
                            >
                                Postuler
                            </button>
                        </div>
                    ))}
                </div>

                {/* MODAL TAILWIND POUR TÉLÉVERSER LE CV */}
                {selectedOffer && (
                    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-fadeIn">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Postuler pour : {selectedOffer.title}</h3>
                            <p className="text-xs text-gray-500 mb-4">Complétez votre dossier pour l'analyse IA future.</p>

                            {message && <div className="p-3 bg-indigo-50 text-indigo-700 text-xs rounded-lg mb-4 font-medium text-center">{message}</div>}

                            <form onSubmit={handleApplySubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Votre CV (Format PDF uniquement) *</label>
                                    <input 
                                        type="file" 
                                        accept=".pdf"
                                        required
                                        onChange={e => setCvFile(e.target.files[0])}
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Lettre de motivation (Optionnel)</label>
                                    <textarea 
                                        rows="4"
                                        placeholder="Pourquoi ce stage vous intéresse..."
                                        value={coverLetter}
                                        onChange={e => setCoverLetter(e.target.value)}
                                        className="w-full p-2 border border-gray-300 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                <div className="flex justify-end space-x-2 pt-2">
                                    <button 
                                        type="button"
                                        onClick={() => setSelectedOffer(null)}
                                        className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                                    >
                                        Annuler
                                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-4 py-2 bg-indigo-600 text-white font-medium text-sm rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                                    >
                                        {isSubmitting ? 'Envoi...' : 'Confirmer ma candidature'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}