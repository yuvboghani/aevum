import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './LandingPage';
import Dashboard from './Dashboard';

function App() {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            {/* Handle auth callback if backend redirects here without path */}
            <Route path="/callback" element={<Navigate to="/dashboard" replace />} />
            {/* Catch all - 404s go to Landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
