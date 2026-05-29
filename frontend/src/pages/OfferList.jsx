import { useEffect, useState } from 'react';
import API from '../services/api';

export default function OfferList() {
    const [offers, setOffers] = useState([]);
    const [selectedOffer, setSelectedOffer] = useState(null);
    const [cvFile, setCvFile] = useState(null);
    const [coverLetter, setCoverLetter] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);

    useEffect(() => {
        API.get('offers/')
            .then(res => setOffers(res.data))
            .catch(err => console.error("Erreur lors de la récupération des offres", err));
    }, []);

    const handleApplySubmit = async (e) => {
        e.preventDefault();
        if (!cvFile) {
            alert("Veuillez téléverser votre CV au format PDF.");
            return;
        }
        setIsSubmitting(true);
        setMessage('');
        const formDataToSend = new FormData();
        formDataToSend.append('offer', selectedOffer.id);
        formDataToSend.append('cv_file', cvFile);
        formDataToSend.append('cover_letter', coverLetter);
        try {
            await API.post(`offers/${selectedOffer.id}/apply/`, formDataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setMessage('🎉 Candidature envoyée avec succès !');
            setCvFile(null);
            setCoverLetter('');
            setTimeout(() => setSelectedOffer(null), 2000);
        } catch (err) {
            console.error(err);
            setMessage('❌ Erreur : Vous avez peut-être déjà postulé à cette offre.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ✨ Génération IA de la lettre de motivation
    const handleGenerateLetter = async () => {
        if (!selectedOffer) return;
        setIsGeneratingLetter(true);
        setCoverLetter('');
        try {
            const formData = new FormData();
            if (cvFile) {
                formData.append('cv_file', cvFile);
            }
            const res = await API.post(`offers/${selectedOffer.id}/generate-cover-letter/`, formData);
            setCoverLetter(res.data.cover_letter);
        } catch (err) {
            console.error(err);
            const detail = err.response?.data?.detail || "Erreur lors de la génération.";
            alert(`❌ ${detail}`);
        } finally {
            setIsGeneratingLetter(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-3xl font-extrabold text-indigo-950 mb-8">
                    Offres de Stages Disponibles
                </h1>

                <div className="grid grid-cols-1 gap-6">
                    {offers.map(offer => (
                        <div
                            key={offer.id}
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center"
                        >
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{offer.title}</h2>
                                <p className="text-sm text-indigo-600 font-medium">
                                    📍 {offer.location} • ⏱️ {offer.duration}
                                </p>
                                <p className="text-gray-600 mt-2 text-sm line-clamp-2">
                                    {offer.description}
                                </p>
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

                {/* MODAL CANDIDATURE */}
                {selectedOffer && (
                    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                                Postuler pour : {selectedOffer.title}
                            </h3>
                            <p className="text-xs text-gray-500 mb-4">
                                Complétez votre dossier pour l'analyse IA.
                            </p>

                            {message && (
                                <div className="p-3 bg-indigo-50 text-indigo-700 text-xs rounded-lg mb-4 font-medium text-center">
                                    {message}
                                </div>
                            )}

                            <form onSubmit={handleApplySubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Votre CV (PDF uniquement) *
                                    </label>
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        required
                                        onChange={e => setCvFile(e.target.files[0])}
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-xs font-semibold text-gray-700">
                                            Lettre de motivation (Optionnel)
                                        </label>
                                        {/* ✨ BOUTON GÉNÉRATION IA */}
                                        <button
                                            type="button"
                                            onClick={handleGenerateLetter}
                                            disabled={isGeneratingLetter}
                                            className="flex items-center gap-1.5 px-3 py-1 bg-violet-50 text-violet-700 border border-violet-200 text-xs font-semibold rounded-full hover:bg-violet-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isGeneratingLetter ? (
                                                <>
                                                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                                    </svg>
                                                    Génération...
                                                </>
                                            ) : (
                                                <>✨ Générer avec l'IA</>
                                            )}
                                        </button>
                                    </div>
                                    <textarea
                                        rows="5"
                                        placeholder="Écrivez votre lettre ou cliquez sur ✨ Générer avec l'IA..."
                                        value={coverLetter}
                                        onChange={e => setCoverLetter(e.target.value)}
                                        className="w-full p-2 border border-gray-300 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                    />
                                    {coverLetter && (
                                        <p className="text-xs text-violet-600 mt-1">
                                            ✅ Lettre générée — vous pouvez la modifier avant envoi.
                                        </p>
                                    )}
                                </div>

                                <div className="flex justify-end space-x-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedOffer(null);
                                            setMessage('');
                                            setCoverLetter('');
                                            setCvFile(null);
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-4 py-2 bg-indigo-600 text-white font-medium text-sm rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                                    >
                                        {isSubmitting ? 'Envoi en cours...' : 'Confirmer ma candidature'}
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