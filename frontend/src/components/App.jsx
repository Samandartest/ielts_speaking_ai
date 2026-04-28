import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import Navbar from './common/Navbar';
import ProtectedRoute from './common/ProtectedRoute';
import AdminRoute from './common/AdminRoute';
import Login from './Auth/Login';
import Register from './Auth/Register';
import Dashboard from './Dashboard/Dashboard';
import VocabularySearch from './Vocabulary/VocabularySearch';
import PartSelector from './Speaking/PartSelector';
import TopicSelector from './Speaking/TopicSelector';
import SpeakingSession from './Speaking/SpeakingSession';
import AdminPanel from './Admin/AdminPanel';
import MockExamSession from './Speaking/MockExamSession';
import PremiumPage from './Premium/PremiumPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/vocabulary" element={<ProtectedRoute><VocabularySearch /></ProtectedRoute>} />
            <Route path="/speaking" element={<ProtectedRoute><PartSelector /></ProtectedRoute>} />
            <Route path="/speaking/topics/:partId" element={<ProtectedRoute><TopicSelector /></ProtectedRoute>} />
            <Route path="/speaking/session/:topicId" element={<ProtectedRoute><SpeakingSession /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
            <Route path="/mock-exam" element={<ProtectedRoute><MockExamSession /></ProtectedRoute>} />
            <Route path="/premium" element={<ProtectedRoute><PremiumPage /></ProtectedRoute>} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;