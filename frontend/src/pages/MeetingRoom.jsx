import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function MeetingRoom() {
    const { applicationId } = useParams();
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const apiRef = useRef(null);

    // Génère un nom de salle unique et stable basé sur l'ID de candidature
    const roomName = `talentai-meeting-${applicationId}`;

    useEffect(() => {
        // Charge le script Jitsi dynamiquement
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;

        script.onload = () => {
            if (!containerRef.current) return;

            apiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', {
                roomName,
                parentNode: containerRef.current,
                width: '100%',
                height: '100%',
                configOverwrite: {
                    startWithAudioMuted: false,
                    startWithVideoMuted: false,
                    disableDeepLinking: true,
                },
                interfaceConfigOverwrite: {
                    SHOW_JITSI_WATERMARK: false,
                    SHOW_WATERMARK_FOR_GUESTS: false,
                    TOOLBAR_BUTTONS: [
                        'microphone', 'camera', 'closedcaptions',
                        'desktop', 'fullscreen', 'hangup', 'chat',
                        'recording', 'settings', 'raisehand', 'tileview'
                    ],
                },
            });

            // Redirige vers les meetings quand l'appel se termine
            apiRef.current.addEventListener('readyToClose', () => {
                navigate('/student-dashboard?section=meetings');
            });
        };

        document.body.appendChild(script);

        return () => {
            // Nettoyage à la sortie de la page
            if (apiRef.current) {
                apiRef.current.dispose();
            }
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, [roomName, navigate]);

    return (
        <div className="flex flex-col h-screen bg-gray-900">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 bg-gray-800 border-b border-gray-700 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                        T
                    </div>
                    <span className="text-white font-semibold text-sm">
                        TalentAI — Entretien en cours
                    </span>
                    <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-500/30 font-medium">
                        🔴 Live
                    </span>
                </div>
                <button
                    onClick={() => navigate('/student-dashboard?section=meetings')}
                    className="text-xs text-gray-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-gray-700"
                >
                    ← Retour aux entretiens
                </button>
            </div>

            {/* Jitsi container */}
            <div ref={containerRef} className="flex-1 w-full" />
        </div>
    );
}