
import React, { useState } from 'react';
import { MockBackend } from '../services/mockBackend';
import Button from '../components/Button';
import { Send, AlertOctagon, Lightbulb, MessageSquare } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const ReportIssue: React.FC = () => {
    const [message, setMessage] = useState('');
    const [type, setType] = useState<'issue' | 'suggestion'>('issue');
    const user = MockBackend.getCurrentUser();

    if (!user) return <Navigate to="/welcome" />;

    const handleSubmit = () => {
        if (!message.trim()) return;
        MockBackend.submitComplaint(user.id, message, type);
        alert(type === 'issue' ? "Report submitted. An admin will review it." : "Thank you for your suggestion!");
        setMessage('');
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Help Center</h1>
                <p className="text-slate-400">Report technical problems or suggest new features to the owner.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={() => setType('issue')}
                    className={`p-6 rounded-2xl border transition-all flex flex-col items-center gap-3 ${
                        type === 'issue' 
                        ? 'bg-red-500/10 border-red-500 text-red-400' 
                        : 'bg-surface border-slate-700 text-slate-400 hover:bg-slate-700/50'
                    }`}
                >
                    <AlertOctagon size={32} />
                    <span className="font-bold">Report Issue</span>
                </button>

                <button 
                    onClick={() => setType('suggestion')}
                    className={`p-6 rounded-2xl border transition-all flex flex-col items-center gap-3 ${
                        type === 'suggestion' 
                        ? 'bg-green-500/10 border-green-500 text-green-400' 
                        : 'bg-surface border-slate-700 text-slate-400 hover:bg-slate-700/50'
                    }`}
                >
                    <Lightbulb size={32} />
                    <span className="font-bold">Suggestion</span>
                </button>
            </div>

            <div className="bg-surface border border-slate-700 rounded-2xl p-8 animate-fade-in">
                <div className="flex items-center gap-2 mb-4">
                    {type === 'issue' ? <AlertOctagon className="text-red-500" size={20} /> : <Lightbulb className="text-green-500" size={20} />}
                    <label className="text-lg font-medium text-white">
                        {type === 'issue' ? "Describe the bug or problem" : "Describe your idea or feature request"}
                    </label>
                </div>
                
                <textarea 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-primary h-48 resize-none mb-6 placeholder-slate-600"
                    placeholder={type === 'issue' ? "E.g., I cannot access Image to Video features despite upgrading..." : "E.g., It would be great if we could edit generated images..."}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
                
                <Button onClick={handleSubmit} className="w-full" variant={type === 'issue' ? 'danger' : 'primary'}>
                    <Send size={18} /> {type === 'issue' ? "Submit Issue Report" : "Send Suggestion"}
                </Button>
            </div>
        </div>
    );
};

export default ReportIssue;
