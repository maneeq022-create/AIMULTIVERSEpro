
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Activity, XCircle, Info } from 'lucide-react';
import Button from '../components/Button';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { MockBackend } from '../services/mockBackend';
import { Navigate } from 'react-router-dom';

const LiveStudio: React.FC = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [status, setStatus] = useState("Ready to connect");
    const [audioLevel, setAudioLevel] = useState(0);

    const user = MockBackend.getCurrentUser();
    
    // Audio Context Refs
    const inputContextRef = useRef<AudioContext | null>(null);
    const outputContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    
    // Playback Refs
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    // API & Session
    const sessionPromiseRef = useRef<Promise<any> | null>(null);

    useEffect(() => {
        return () => {
            disconnect();
        };
    }, []);

    if (!user) return <Navigate to="/welcome" />;
    
    // --- Helper: Float32 to PCM16 ---
    const createBlob = (data: Float32Array): { data: string, mimeType: string } => {
        const l = data.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
            int16[i] = data[i] * 32768;
        }
        
        // Manual binary string construction for btoa
        const bytes = new Uint8Array(int16.buffer);
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        
        return {
            data: btoa(binary),
            mimeType: 'audio/pcm;rate=16000',
        };
    };

    // --- Helper: Decode Base64 to ArrayBuffer ---
    const decodeAudioData = async (base64: string, ctx: AudioContext): Promise<AudioBuffer> => {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Decode raw PCM 24000Hz 1 channel
        const dataInt16 = new Int16Array(bytes.buffer);
        const frameCount = dataInt16.length;
        const buffer = ctx.createBuffer(1, frameCount, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i] / 32768.0;
        }
        return buffer;
    };

    const connect = async () => {
        try {
            setStatus("Initializing...");
            const apiKey = process.env.API_KEY || '';
            const ai = new GoogleGenAI({ apiKey });

            // 1. Setup Audio Contexts
            inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            // 2. Get Mic Stream
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            // 3. Connect to Live API
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
                    },
                    systemInstruction: "You are a helpful, conversational AI assistant.",
                },
                callbacks: {
                    onopen: () => {
                        setStatus("Connected! Speak now.");
                        setIsConnected(true);
                        startAudioInputProcessing(stream);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        handleServerMessage(message);
                    },
                    onerror: (e) => {
                        console.error(e);
                        setStatus("Error occurred.");
                        disconnect();
                    },
                    onclose: () => {
                        setStatus("Disconnected.");
                        disconnect();
                    }
                }
            });

        } catch (e) {
            console.error(e);
            setStatus("Connection Failed.");
        }
    };

    const startAudioInputProcessing = (stream: MediaStream) => {
        if (!inputContextRef.current) return;

        const source = inputContextRef.current.createMediaStreamSource(stream);
        const scriptProcessor = inputContextRef.current.createScriptProcessor(4096, 1, 1);
        scriptProcessorRef.current = scriptProcessor;

        scriptProcessor.onaudioprocess = (e) => {
            if (isMuted) return;
            
            const inputData = e.inputBuffer.getChannelData(0);
            
            // Visualizer logic (simple rms)
            let sum = 0;
            for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
            setAudioLevel(Math.sqrt(sum / inputData.length) * 5);

            const pcmBlob = createBlob(inputData);
            
            if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then(session => {
                    session.sendRealtimeInput({ media: pcmBlob });
                });
            }
        };

        source.connect(scriptProcessor);
        scriptProcessor.connect(inputContextRef.current.destination);
    };

    const handleServerMessage = async (message: LiveServerMessage) => {
        // Handle Audio
        const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (audioData && outputContextRef.current) {
            const ctx = outputContextRef.current;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
            
            const audioBuffer = await decodeAudioData(audioData, ctx);
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            
            source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
            });
            
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            sourcesRef.current.add(source);
        }

        // Handle Interruption
        if (message.serverContent?.interrupted) {
            sourcesRef.current.forEach(src => src.stop());
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
        }
    };

    const disconnect = () => {
        setIsConnected(false);
        setStatus("Ready to connect");
        
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
        }
        if (inputContextRef.current) inputContextRef.current.close();
        if (outputContextRef.current) outputContextRef.current.close();
        
        sessionPromiseRef.current = null;
    };

    return (
        <div className="max-w-xl mx-auto flex flex-col items-center justify-center h-[calc(100vh-120px)] space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-white mb-2">Live Studio</h1>
                <p className="text-slate-400">Real-time conversational AI with Gemini 2.5 Native Audio</p>
            </div>

            {/* Visualizer Circle */}
            <div className={`relative w-64 h-64 rounded-full flex items-center justify-center transition-all duration-300 ${isConnected ? 'bg-slate-800' : 'bg-slate-900 border border-slate-700'}`}>
                {isConnected && (
                    <>
                        {/* Pulse Effect based on audio */}
                        <div 
                            className="absolute inset-0 bg-primary/30 rounded-full blur-xl transition-transform duration-75"
                            style={{ transform: `scale(${1 + audioLevel})` }}
                        />
                        <div className="z-10 text-primary animate-pulse">
                            <Activity size={64} />
                        </div>
                    </>
                )}
                {!isConnected && <MicOff size={48} className="text-slate-600" />}
            </div>

            <div className="bg-surface px-6 py-3 rounded-full border border-slate-700 text-sm font-mono text-slate-300">
                Status: <span className={isConnected ? "text-green-400" : "text-slate-400"}>{status}</span>
            </div>

            <div className="flex gap-4">
                {!isConnected ? (
                    <Button onClick={connect} className="px-8 py-4 rounded-full text-lg shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                        <Mic className="mr-2" /> Start Live Session
                    </Button>
                ) : (
                    <>
                        <button 
                            onClick={() => setIsMuted(!isMuted)}
                            className={`p-4 rounded-full border transition-all ${isMuted ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-slate-800 border-slate-600 text-white'}`}
                        >
                            {isMuted ? <MicOff /> : <Mic />}
                        </button>
                        <Button variant="danger" onClick={disconnect} className="px-8 py-4 rounded-full text-lg">
                            <XCircle className="mr-2" /> End Session
                        </Button>
                    </>
                )}
            </div>

            <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 max-w-md flex gap-3 items-start">
                <Info className="text-blue-400 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-blue-200 leading-relaxed">
                    This feature uses the Gemini Live API over WebSocket. It streams raw audio from your microphone and plays back the AI's response with ultra-low latency. Requires a stable connection.
                </p>
            </div>
        </div>
    );
};

export default LiveStudio;
