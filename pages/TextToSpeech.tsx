
import React, { useState } from 'react';
import { Speaker, Download, Play, Pause, RefreshCw, Lock, CheckCircle } from 'lucide-react';
import Button from '../components/Button';
import ToolGuide from '../components/ToolGuide';
import { generateSpeech } from '../services/geminiService';
import { MockBackend } from '../services/mockBackend';
import { CREDIT_COSTS } from '../types';
import { Link } from 'react-router-dom';

const VOICES = [
  { id: 'Kore', name: 'Kore (Female - Balanced)', gender: 'Female' },
  { id: 'Puck', name: 'Puck (Male - Balanced)', gender: 'Male' },
  { id: 'Charon', name: 'Charon (Male - Deep)', gender: 'Male' },
  { id: 'Fenrir', name: 'Fenrir (Male - Intense)', gender: 'Male' },
  { id: 'Zephyr', name: 'Zephyr (Female - Soft)', gender: 'Female' },
  { id: 'Aoede', name: 'Aoede (Female - Elegant)', gender: 'Female' },
  { id: 'Leda', name: 'Leda (Female - Warm)', gender: 'Female' },
  { id: 'Orpheus', name: 'Orpheus (Male - Confident)', gender: 'Male' },
  { id: 'Castor', name: 'Castor (Male - Authoritative)', gender: 'Male' },
  { id: 'Lyra', name: 'Lyra (Female - Cheerful)', gender: 'Female' },
  { id: 'Rigel', name: 'Rigel (Male - Energetic)', gender: 'Male' },
  { id: 'Thalia', name: 'Thalia (Female - Playful)', gender: 'Female' },
  { id: 'Titan', name: 'Titan (Male - Resonant)', gender: 'Male' },
  { id: 'Mimas', name: 'Mimas (Male - Smooth)', gender: 'Male' },
];

const TextToSpeech: React.FC = () => {
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const user = MockBackend.getCurrentUser();
  const hasPermission = MockBackend.hasPermission(user, 'TTS');

  const handleGenerate = async () => {
    if (!hasPermission) return;

    if (!text.trim()) return;

    if (user.credits !== 'unlimited' && user.credits < CREDIT_COSTS.TTS) {
        alert("Insufficient credits.");
        return;
    }

    setIsProcessing(true);
    setAudioUrl(null);
    setSaved(false);
    MockBackend.deductCredits(user.id, CREDIT_COSTS.TTS, 'TTS');

    try {
        const url = await generateSpeech(text, selectedVoice);
        setAudioUrl(url);

        if (url) {
            MockBackend.saveFile({
                id: Date.now().toString(),
                user_id: user.id,
                type: 'audio',
                url: url,
                name: `TTS - ${selectedVoice}`,
                created_at: new Date().toISOString()
            });
            setSaved(true);
        }

    } catch (error) {
        alert("Failed to generate speech. Please check API configuration.");
    } finally {
        setIsProcessing(false);
    }
  };

  if (!hasPermission) {
    return (
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
            <div className="p-6 bg-slate-800 rounded-full border border-slate-700">
                <Lock className="h-16 w-16 text-slate-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Feature Locked</h1>
            <p className="text-slate-400 max-w-md">
                You have used your Text-to-Speech allowance for this plan. Please upgrade to continue generating speech.
            </p>
            <Link to="/pricing">
                <Button className="px-8 py-3">View Upgrade Plans</Button>
            </Link>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">AI Text to Speech</h1>
          <p className="text-slate-400 mt-2">Convert text into lifelike speech using advanced neural models.</p>
        </div>
        <div className="bg-indigo-500/10 px-4 py-2 rounded-lg border border-indigo-500/20">
            <span className="text-indigo-300 text-sm font-medium">Cost: {CREDIT_COSTS.TTS} Credits</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Settings Panel */}
        <div className="space-y-6">
            <div className="bg-surface p-5 rounded-xl border border-slate-700">
                <label className="block text-sm font-medium text-slate-300 mb-3">Select Voice</label>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {VOICES.map(voice => (
                        <div 
                            key={voice.id}
                            onClick={() => setSelectedVoice(voice.id)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                selectedVoice === voice.id 
                                ? 'bg-primary/20 border-primary text-white' 
                                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="font-medium block">{voice.name}</span>
                                </div>
                                {selectedVoice === voice.id && <Speaker size={16} className="text-primary" />}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Editor Panel */}
        <div className="md:col-span-2 space-y-6">
            <div className="bg-surface p-6 rounded-xl border border-slate-700 h-full flex flex-col">
                <textarea 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type or paste your text here..."
                    className="flex-1 bg-transparent border-none resize-none focus:ring-0 text-lg text-white placeholder-slate-600 min-h-[200px]"
                />
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-700 mt-4">
                    <span className="text-sm text-slate-500">{text.length} characters</span>
                    <Button onClick={handleGenerate} isLoading={isProcessing}>
                        Generate Audio
                    </Button>
                </div>
            </div>

            {/* Audio Player */}
            {audioUrl && (
                <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex items-center gap-4 animate-fade-in flex-wrap">
                    <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <Play fill="white" size={20} className="text-white ml-1" />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <p className="text-sm font-medium text-white mb-1">Generated Audio</p>
                        <audio controls src={audioUrl} className="w-full h-8" />
                    </div>
                    <div className="flex items-center gap-2">
                        <a 
                            href={audioUrl} 
                            download={`tts-${Date.now()}.wav`}
                            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors"
                        >
                            <Download size={20} />
                        </a>
                        {saved && (
                            <span className="text-green-400 flex items-center gap-1 text-xs font-bold px-2 py-1 bg-green-500/10 rounded">
                                <CheckCircle size={14} /> Saved
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>

      <ToolGuide 
        title="Text to Speech"
        steps={[
            "Select a voice persona from the left panel (e.g., Kore, Puck).",
            "Type your script in the text area on the right.",
            "Click 'Generate Audio' to process the text.",
            "Use the player to listen or the download button to save the audio file."
        ]}
        tips={[
            "Use punctuation like commas and periods to create natural pauses.",
            "Different voices have different tones; try 'Fenrir' for drama or 'Zephyr' for calming content.",
            "Longer texts will consume more processing time.",
            "The output is high-fidelity WAV format."
        ]}
      />
    </div>
  );
};

export default TextToSpeech;
