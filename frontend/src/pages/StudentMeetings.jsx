import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/** Redirige vers le dashboard étudiant (section entretiens intégrée). */
export default function StudentMeetings() {
    const navigate = useNavigate();

    useEffect(() => {
        navigate('/student-dashboard?section=meetings', { replace: true });
    }, [navigate]);

    return null;
}
