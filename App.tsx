
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';
import Payment from './pages/Payment';
import VoiceClone from './pages/VoiceClone';
import Chatbot from './pages/Chatbot';
import ImageToVideo from './pages/ImageToVideo';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Welcome from './pages/Welcome';
import AdminPanel from './pages/AdminPanel';
import Translator from './pages/Translator';
import TextToSpeech from './pages/TextToSpeech';
import DocumentAI from './pages/DocumentAI';
import TextToImage from './pages/TextToImage';
import ReportIssue from './pages/ReportIssue';
import Profile from './pages/Profile';
import Terms from './pages/Terms';
import LiveStudio from './pages/LiveStudio';
import FeaturesGuide from './pages/FeaturesGuide';
import MyCreations from './pages/MyCreations';
import { MockBackend } from './services/mockBackend';

const ProtectedRoute: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const user = MockBackend.getCurrentUser();
  if (!user) {
    return <Navigate to="/welcome" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/guide" element={<ProtectedRoute><FeaturesGuide /></ProtectedRoute>} />
          <Route path="/creations" element={<ProtectedRoute><MyCreations /></ProtectedRoute>} />
          <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
          <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
          <Route path="/voice-clone" element={<ProtectedRoute><VoiceClone /></ProtectedRoute>} />
          <Route path="/chatbot" element={<ProtectedRoute><Chatbot /></ProtectedRoute>} />
          <Route path="/live" element={<ProtectedRoute><LiveStudio /></ProtectedRoute>} />
          <Route path="/image-to-video" element={<ProtectedRoute><ImageToVideo /></ProtectedRoute>} />
          <Route path="/text-to-image" element={<ProtectedRoute><TextToImage /></ProtectedRoute>} />
          <Route path="/translator" element={<ProtectedRoute><Translator /></ProtectedRoute>} />
          <Route path="/tts" element={<ProtectedRoute><TextToSpeech /></ProtectedRoute>} />
          <Route path="/doc-ai" element={<ProtectedRoute><DocumentAI /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/report" element={<ProtectedRoute><ReportIssue /></ProtectedRoute>} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
