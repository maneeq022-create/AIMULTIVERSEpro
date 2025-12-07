
import React, { useState, useRef, useEffect } from 'react';
import Button from '../components/Button';
import ToolGuide from '../components/ToolGuide';
import { Upload, Mic, Play, Lock, Sliders, Clock, Zap, Sparkles, Music, AlertCircle, CheckCircle2, CheckCircle, Image as ImageIcon, StopCircle, RefreshCw, Trash2 } from 'lucide-react';
import { MockBackend } from '../services/mockBackend';
import { VOICE_CLONE_CONFIG, PLAN_DETAILS } from '../types';
import { Link, Navigate } from 'react-router-dom';

const VoiceClone: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [text, setText] = useState('');
  
  // Input Method State
  const [inputMethod, setInputMethod] = useState<'upload' | 'record'>('upload');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  // Refs for Recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Configuration State
  const [selectedModelId, setSelectedModelId] = useState(VOICE_CLONE_CONFIG.MODELS[0].id);
  const [duration, setDuration] = useState(10); // Default 10 seconds

  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const user = MockBackend.getCurrentUser();

  useEffect(() => {
    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);
  
  if (!user) return <Navigate to="/welcome" />;

  const hasPermission = MockBackend.hasPermission(user, 'VOICE_CLONE');
  const planDetails = PLAN_DETAILS[user.plan_type];
  const wordLimit = (planDetails as any).voice_clone_word_limit || 500;

  const selectedModel = VOICE_CLONE_CONFIG.MODELS.find(m => m.id === selectedModelId) || VOICE_CLONE_CONFIG.MODELS[0];
  const totalCost = user.credits === 'unlimited' ? 0 : Math.round(duration * VOICE_CLONE_CONFIG.COST_PER_SECOND * selectedModel.multiplier);
  
  // Calculate Word Count
  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const isOverLimit = wordCount > wordLimit;

  // Recording Logic
  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
            const audioFile = new File([blob], "recorded_voice.webm", { type: 'audio/webm' });
            setFile(audioFile);
            
            // Stop all tracks to release mic
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
        setRecordingTime(0);
        
        timerRef.current = setInterval(() => {
            setRecordingTime(prev => prev + 1);
        }, 1000);

    } catch (err) {
        console.error("Error accessing microphone:", err);
        setError("Microphone access denied. Please allow permission to record.");
    }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          if (timerRef.current) clearInterval(timerRef.current);
      }
  };

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getModelIcon = (id: string) => {
    if (id.includes('hd')) return <Sparkles className="text-purple-400" size={24} />;
    if (id.includes('expressive')) return <Music className="text-pink-400" size={24} />;
    return <Zap className="text-blue-400" size={24} />;
  };

  const handleGenerate = () => {
    if (!hasPermission) return;

    if (user.credits !== 'unlimited' && user.credits < totalCost) {
        setError(`Insufficient credits. Required: ${totalCost}`);
        return;
    }

    if (!file || !text) {
        setError("Please upload audio or record voice, and enter text.");
        return;
    }

    if (isOverLimit) {
        setError(`Text exceeds your plan's limit of ${wordLimit} words. Please shorten your script.`);
        return;
    }

    setIsProcessing(true);
    setError(null);
    setResultUrl(null);
    setSaved(false);

    // Simulate Processing Time based on complexity
    const processingTime = 2000 * selectedModel.multiplier;

    setTimeout(() => {
        const success = MockBackend.deductCredits(user.id, totalCost, 'VOICE_CLONE');
        if (success) {
            const url = "https://actions.google.com/sounds/v1/science_fiction/robot_radio_chatter.ogg";
            setResultUrl(url); 

            MockBackend.saveFile({
                id: Date.now().toString(),
                user_id: user.id,
                type: 'audio',
                url: url,
                name: `Clone: ${text.slice(0, 20)}...`,
                created_at: new Date().toISOString()
            });
            setSaved(true);
        } else {
            setError("Transaction failed.");
        }
        setIsProcessing(false);
    }, processingTime);
  };

  if (!hasPermission) {
    return (
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
            <div className="p-6 bg-slate-800 rounded-full border border-slate-700">
                <Lock className="h-16 w-16 text-slate-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Feature Locked</h1>
            <p className="text-slate-400 max-w-md">
                You have reached the usage limit for Voice Cloning on your current plan. Upgrade to a higher tier for more access.
            </p>
            <Link to="/pricing">
                <Button className="px-8 py-3">View Upgrade Plans</Button>
            </Link>
        </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Voice Cloning Studio</h1>
          <p className="text-slate-400 mt-2">Clone any voice with high fidelity AI models.</p>
        </div>
        <div className="flex flex-col items-end gap-1">
            <div className="hidden md:block bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-700">
                <span className="text-slate-400 text-sm">Base Rate: </span>
                <span className="text-primary font-bold">{VOICE_CLONE_CONFIG.COST_PER_SECOND} Credits/sec</span>
            </div>
            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
                Plan Limit: {wordLimit} words/script
            </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Inputs (5 columns) */}
        <div className="lg:col-span-5 space-y-6">
            {/* 1. Source Voice */}
            <div className="bg-surface p-6 rounded-2xl border border-slate-700/50 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                        <span className="bg-slate-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                        Source Voice
                    </label>
                    <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                        <button 
                            onClick={() => setInputMethod('upload')} 
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${inputMethod === 'upload' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                            Upload File
                        </button>
                        <button 
                            onClick={() => setInputMethod('record')} 
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${inputMethod === 'record' ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-white'}`}
                        >
                            Record Voice
                        </button>
                    </div>
                </div>

                {inputMethod === 'upload' ? (
                    <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:bg-slate-700/30 transition-colors group cursor-pointer relative min-h-[200px] flex flex-col items-center justify-center">
                        <input 
                            type="file" 
                            accept="audio/*" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                            id="audio-upload"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                        <div className="flex flex-col items-center">
                            <div className={`h-14 w-14 rounded-full flex items-center justify-center mb-3 transition-colors ${file ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-300'}`}>
                                {file ? <CheckCircle2 size={28} /> : <Upload size={28} />}
                            </div>
                            <span className="text-slate-200 font-medium">{file ? file.name : "Drop audio file or click"}</span>
                            <span className="text-slate-500 text-xs mt-1">MP3, WAV • 1-2 mins recommended</span>
                        </div>
                    </div>
                ) : (
                    <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[200px] bg-slate-900/20">
                        {(!file || isRecording) ? (
                            !isRecording ? (
                                <button 
                                    onClick={startRecording} 
                                    className="h-20 w-20 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-all hover:scale-105 group"
                                >
                                    <Mic size={40} className="text-white" />
                                </button>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <div className="mb-4 text-4xl font-mono font-bold text-red-400 animate-pulse">
                                        {formatTime(recordingTime)}
                                    </div>
                                    <button 
                                        onClick={stopRecording} 
                                        className="h-20 w-20 bg-slate-800 border-2 border-red-500 rounded-full flex items-center justify-center hover:bg-slate-700 transition-all"
                                    >
                                        <StopCircle size={40} className="text-red-500" />
                                    </button>
                                    <p className="mt-4 text-sm text-red-400 font-medium animate-pulse">Recording...</p>
                                </div>
                            )
                        ) : (
                            <div className="flex flex-col items-center w-full">
                                <div className="h-16 w-16 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 mb-4">
                                    <CheckCircle2 size={32} />
                                </div>
                                <p className="text-white font-medium text-lg mb-1">Recording Saved</p>
                                <p className="text-slate-500 text-sm mb-6">Ready to clone</p>
                                
                                <div className="flex gap-3 w-full max-w-xs">
                                    <Button variant="secondary" onClick={() => setFile(null)} className="flex-1">
                                        <RefreshCw size={16} /> Retake
                                    </Button>
                                </div>
                            </div>
                        )}
                        {!isRecording && !file && <p className="mt-6 text-slate-400 text-sm font-medium">Click mic to start recording</p>}
                    </div>
                )}
            </div>

            {/* 2. Cover Image (NEW) */}
            <div className="bg-surface p-6 rounded-2xl border border-slate-700/50 shadow-sm">
                <label className="block text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                    <span className="bg-slate-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                    Upload Cover Image <span className="text-slate-500 font-normal ml-1">(Optional)</span>
                </label>
                <div className="border-2 border-dashed border-slate-600 rounded-xl p-4 text-center hover:bg-slate-700/30 transition-colors group cursor-pointer relative min-h-[160px] flex items-center justify-center">
                    <input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        onChange={handleImageChange}
                    />
                    {imagePreview ? (
                        <div className="relative w-full h-full rounded-lg overflow-hidden">
                            <img src={imagePreview} alt="Cover Preview" className="max-h-40 w-full object-cover rounded-lg" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white font-medium text-sm flex items-center gap-2"><Upload size={14} /> Change Image</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center mb-2 text-slate-400 group-hover:bg-slate-700 transition-colors">
                                <ImageIcon size={20} />
                            </div>
                            <span className="text-slate-300 text-sm font-medium">Add Branding / Cover</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Text to Speak */}
            <div className="bg-surface p-6 rounded-2xl border border-slate-700/50 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                        <span className="bg-slate-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                        Text to Speak
                    </label>
                    <span className={`text-xs font-bold ${isOverLimit ? 'text-red-500' : 'text-slate-500'}`}>
                        {wordCount} / {wordLimit} words
                    </span>
                </div>
                <textarea 
                    className={`w-full bg-slate-900 border rounded-xl p-4 text-white focus:ring-2 outline-none h-40 resize-none text-[15px] leading-relaxed ${isOverLimit ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-primary focus:border-transparent'}`}
                    placeholder="Enter the script you want the cloned voice to say..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                <div className="flex justify-between mt-3 px-1">
                    <span className="text-xs text-slate-500">{text.length} chars</span>
                    <span className="text-xs text-slate-500">~{Math.ceil(text.length / 15)} sec est.</span>
                </div>
                {isOverLimit && (
                    <p className="text-xs text-red-500 mt-2 font-medium">
                        Script exceeds the word limit for your {user.plan_type.replace(/_/g, ' ')} plan.
                    </p>
                )}
            </div>
        </div>

        {/* Right Column: Config & Output (7 columns) */}
        <div className="lg:col-span-7 space-y-6">
            <div className="bg-surface p-6 rounded-2xl border border-slate-700/50 shadow-sm h-full flex flex-col">
                <label className="block text-sm font-bold text-slate-300 mb-6 flex items-center gap-2">
                    <span className="bg-slate-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">4</span>
                    Configuration
                </label>

                {/* Model Selection Cards */}
                <div className="space-y-3 mb-8">
                    <span className="text-xs text-slate-500 uppercase font-bold tracking-wider ml-1">Select AI Model</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {VOICE_CLONE_CONFIG.MODELS.map(model => {
                            const isSelected = selectedModelId === model.id;
                            return (
                                <button
                                    key={model.id}
                                    onClick={() => setSelectedModelId(model.id)}
                                    className={`relative p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between h-full ${
                                        isSelected
                                        ? 'bg-primary/10 border-primary shadow-[0_0_0_1px_rgba(99,102,241,1)]' 
                                        : 'bg-slate-900/40 border-slate-700 hover:border-slate-500 hover:bg-slate-800/40'
                                    }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="p-2 bg-slate-800 rounded-lg">
                                            {getModelIcon(model.id)}
                                        </div>
                                        {isSelected && <div className="h-3 w-3 bg-primary rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white mb-1">{model.name}</div>
                                        <div className="text-xs text-slate-400 mb-3 leading-tight min-h-[2.5em]">{model.description}</div>
                                        <div className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${isSelected ? 'bg-primary/20 text-primary' : 'bg-slate-800 text-slate-500'}`}>
                                            {model.multiplier}x Multiplier
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Duration Slider */}
                <div className="space-y-6 mb-8 bg-slate-900/30 p-5 rounded-2xl border border-slate-700/30">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-slate-800 rounded text-slate-400">
                                <Clock size={16} />
                            </div>
                            <span className="text-sm font-medium text-slate-300">Max Duration Limit</span>
                        </div>
                        <span className="text-xl font-mono font-bold text-white">{duration}s</span>
                    </div>
                    
                    <div className="relative pt-2 pb-1">
                        <input 
                            type="range" 
                            min="5" 
                            max="60" 
                            step="1" 
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <div className="flex justify-between text-[10px] font-bold text-slate-600 mt-2 uppercase tracking-wide">
                            <span>5 Seconds</span>
                            <span>60 Seconds</span>
                        </div>
                    </div>
                </div>

                {/* Cost Summary & Action */}
                <div className="mt-auto space-y-4">
                    <div className="bg-black/20 rounded-xl p-4 flex items-center justify-between border border-slate-800">
                        <div>
                            <p className="text-slate-400 text-xs uppercase font-bold mb-1">Total Estimated Cost</p>
                            <p className="text-xs text-slate-500">
                                {duration}s × {VOICE_CLONE_CONFIG.COST_PER_SECOND} × {selectedModel.multiplier}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Zap className={`h-5 w-5 ${totalCost > (user.credits === 'unlimited' ? 999999 : user.credits) ? 'text-red-500' : 'text-yellow-400'}`} fill="currentColor" />
                            <span className={`text-2xl font-bold ${totalCost > (user.credits === 'unlimited' ? 999999 : user.credits) ? 'text-red-500' : 'text-white'}`}>
                                {totalCost}
                            </span>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-lg text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <Button 
                        onClick={handleGenerate} 
                        isLoading={isProcessing} 
                        className="w-full py-4 text-lg bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/20"
                        disabled={isProcessing || isOverLimit}
                    >
                        <Mic className="h-5 w-5" />
                        Generate Cloned Voice
                    </Button>
                </div>
            </div>

            {/* Output Area */}
            {resultUrl && (
                <div className="bg-surface p-6 rounded-2xl border border-green-500/30 animate-fade-in shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-12 w-12 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                            <Play className="h-6 w-6 text-green-400 ml-1" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Generation Complete!</h3>
                            <p className="text-slate-400 text-sm">Your cloned audio is ready for playback.</p>
                        </div>
                    </div>
                    {imagePreview && (
                        <div className="mb-4 bg-black/20 p-2 rounded-xl flex items-center gap-3">
                            <img src={imagePreview} alt="Cover" className="h-12 w-12 rounded object-cover" />
                            <div className="text-xs text-slate-400">Linked branding image applied to project metadata.</div>
                        </div>
                    )}
                    <div className="bg-black/30 p-4 rounded-xl mb-4">
                        <audio controls src={resultUrl} className="w-full" />
                    </div>
                    <div className="flex gap-3">
                        <Button variant="secondary" className="flex-1" onClick={() => setResultUrl(null)}>
                            Generate New
                        </Button>
                        <a 
                            href={resultUrl} 
                            download="cloned-voice.wav" 
                            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Download
                        </a>
                        {saved && (
                             <div className="flex items-center justify-center px-4 bg-green-500/10 rounded-lg border border-green-500/20">
                                <CheckCircle size={20} className="text-green-500" />
                             </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>

      <ToolGuide 
        title="Voice Cloning Studio"
        steps={[
            "Select 'Upload File' to use existing audio OR 'Record Voice' to record instantly.",
            "If recording, ensure you are in a quiet environment and speak clearly.",
            "Optionally upload a cover image for project branding.",
            "Type the script you want the cloned voice to say.",
            "Click 'Generate' and listen to the result."
        ]}
        tips={[
            "The 'High Fidelity' model captures subtle breathing and intonation nuances.",
            "Ensure the source audio (upload or recording) has minimal background noise.",
            "Record at least 30 seconds for better clone accuracy."
        ]}
      />
    </div>
  );
};

export default VoiceClone;
