
import React from 'react';
import { Video, ArrowLeft, Sparkles } from 'lucide-react';
import Button from '../components/Button';
import { MockBackend } from '../services/mockBackend';
import { Link, Navigate } from 'react-router-dom';

const ImageToVideo: React.FC = () => {
  const user = MockBackend.getCurrentUser();

  if (!user) return <Navigate to="/welcome" />;

  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 animate-fade-in-up">
       <div className="relative">
            <div className="absolute inset-0 bg-pink-500 blur-3xl opacity-20 rounded-full"></div>
            <div className="relative p-8 bg-surface rounded-full border border-pink-500/30 shadow-2xl shadow-pink-500/20">
                <Video className="h-20 w-20 text-pink-400" />
            </div>
       </div>

       <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white">Veo Video Studio</h1>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20">
                <Sparkles size={16} className="text-pink-400" />
                <span className="text-lg font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent uppercase tracking-wider">
                    Coming Soon
                </span>
            </div>
       </div>

       <p className="text-slate-400 text-lg max-w-lg leading-relaxed">
            We are currently fine-tuning the <b>Veo 3.1</b> cinematic generation engine to provide you with Hollywood-grade AI video creation.
       </p>

       <div className="pt-4">
            <Link to="/">
                <Button variant="secondary" className="px-8 py-3">
                    <ArrowLeft size={18} /> Back to Dashboard
                </Button>
            </Link>
       </div>
    </div>
  );
};

export default ImageToVideo;
