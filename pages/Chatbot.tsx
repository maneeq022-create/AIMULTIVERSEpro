
import React, { useState, useRef, useEffect } from 'react';
import { Send, User as UserIcon, Mic, Image as ImageIcon, Globe, Loader2, Sparkles, X, Plus, ChevronDown, Headphones, Search, Volume2, StopCircle, Video, MapPin, Zap, Brain } from 'lucide-react';
import { generateChatResponse, generateSpeech, transcribeAudio } from '../services/geminiService';
import { MockBackend } from '../services/mockBackend';
import { CREDIT_COSTS } from '../types';
import ToolGuide from '../components/ToolGuide';

interface Message {
  role: 'user' | 'ai';
  content: string;
  image?: string;
  video?: string;
}

type ChatMode = 'fast' | 'standard' | 'thinking' | 'grounded_search' | 'grounded_maps';

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Attachments
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  // Modes
  const [chatMode, setChatMode] = useState<ChatMode>('standard');
  const [showModeSelector, setShowModeSelector] = useState(false);
  
  // Voice & Audio
  const [isRecording, setIsRecording] = useState(false);
  const [autoRead, setAutoRead] = useState(false);
  const [playingMessageIndex, setPlayingMessageIndex] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);
  useEffect(() => {
    return () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    };
  }, []);

  // File Handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = () => {
              setSelectedImage(reader.result as string);
              setSelectedVideo(null); // Clear video if image selected
          };
          reader.readAsDataURL(file);
      }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = () => {
              setSelectedVideo(reader.result as string);
              setSelectedImage(null); // Clear image if video selected
          };
          reader.readAsDataURL(file);
      }
  };

  // Audio Recording for Transcription
  const toggleRecording = async () => {
      if (isRecording) {
          mediaRecorderRef.current?.stop();
          setIsRecording(false);
      } else {
          try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              const mediaRecorder = new MediaRecorder(stream);
              mediaRecorderRef.current = mediaRecorder;
              chunksRef.current = [];

              mediaRecorder.ondataavailable = (e) => {
                  if (e.data.size > 0) chunksRef.current.push(e.data);
              };

              mediaRecorder.onstop = async () => {
                  const blob = new Blob(chunksRef.current, { type: 'audio/mp3' });
                  const reader = new FileReader();
                  reader.onloadend = async () => {
                      const base64 = (reader.result as string).split(',')[1];
                      setIsLoading(true);
                      const text = await transcribeAudio(base64);
                      setInput(prev => prev + " " + text);
                      setIsLoading(false);
                  };
                  reader.readAsDataURL(blob);
                  
                  // Stop all tracks
                  stream.getTracks().forEach(track => track.stop());
              };

              mediaRecorder.start();
              setIsRecording(true);
          } catch (err) {
              alert("Microphone access denied.");
          }
      }
  };

  const speakMessage = async (text: string, index: number) => {
      if (audioRef.current) {
          audioRef.current.pause();
          if (playingMessageIndex === index) {
              setPlayingMessageIndex(null);
              return;
          }
      }
      const user = MockBackend.getCurrentUser();
      if (user.credits !== 'unlimited' && user.credits < CREDIT_COSTS.TTS) {
          alert("Insufficient credits for Voice Output.");
          return;
      }
      setPlayingMessageIndex(index);
      try {
          MockBackend.deductCredits(user.id, CREDIT_COSTS.TTS, 'TTS');
          const audioUrl = await generateSpeech(text);
          if (audioUrl) {
              const audio = new Audio(audioUrl);
              audioRef.current = audio;
              audio.onended = () => setPlayingMessageIndex(null);
              audio.play();
          }
      } catch (e) {
          setPlayingMessageIndex(null);
      }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage && !selectedVideo) || isLoading) return;

    const user = MockBackend.getCurrentUser();
    
    // Cost calculation logic
    let cost = 1;
    let action: any = 'CHATBOT';
    
    if (selectedVideo) {
        cost = CREDIT_COSTS.VIDEO_ANALYSIS;
        action = 'VIDEO_ANALYSIS';
    } else if (chatMode === 'thinking') {
        cost = 5; // Higher cost for thinking
    }

    if (user.credits !== 'unlimited' && user.credits < cost) {
         alert(`Insufficient credits. Required: ${cost}`);
         return;
    }

    const userMsg = input;
    const currentImage = selectedImage;
    const currentVideo = selectedVideo;
    
    setInput('');
    setSelectedImage(null);
    setSelectedVideo(null);
    setMessages(prev => [...prev, { role: 'user', content: userMsg, image: currentImage || undefined, video: currentVideo || undefined }]);
    setIsLoading(true);

    MockBackend.deductCredits(user.id, cost, action); 

    try {
        const imageBase64 = currentImage ? currentImage.split(',')[1] : undefined;
        const videoBase64 = currentVideo ? currentVideo.split(',')[1] : undefined;

        const responseText = await generateChatResponse(userMsg, {
            mode: chatMode,
            image: imageBase64,
            video: videoBase64
        });
        
        setMessages(prev => {
            const newMessages = [...prev, { role: 'ai', content: responseText }];
            if (autoRead) {
                setTimeout(() => speakMessage(responseText, newMessages.length - 1), 500);
            }
            return newMessages as Message[];
        });

    } catch (e) {
        setMessages(prev => [...prev, { role: 'ai', content: "Error communicating with AI." }]);
    } finally {
        setIsLoading(false);
    }
  };

  const getModeIcon = () => {
      switch(chatMode) {
          case 'fast': return <Zap className="text-yellow-400" size={16} />;
          case 'thinking': return <Brain className="text-purple-400" size={16} />;
          case 'grounded_search': return <Globe className="text-blue-400" size={16} />;
          case 'grounded_maps': return <MapPin className="text-red-400" size={16} />;
          default: return <Sparkles className="text-primary" size={16} />;
      }
  };

  const getModeLabel = () => {
      switch(chatMode) {
          case 'fast': return 'Fast (Flash Lite)';
          case 'thinking': return 'Thinking (Gemini 3 Pro)';
          case 'grounded_search': return 'Web Search';
          case 'grounded_maps': return 'Maps Grounding';
          default: return 'Standard (Gemini 2.5)';
      }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] relative font-sans">
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-2 flex justify-center z-20 gap-2 pointer-events-none">
        <div className="pointer-events-auto flex gap-2">
            <div className="relative">
                <button 
                    onClick={() => setShowModeSelector(!showModeSelector)}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 px-3 py-2 rounded-xl transition-colors backdrop-blur-sm bg-darker/80 border border-slate-700"
                >
                    {getModeIcon()}
                    <span>{getModeLabel()}</span>
                    <ChevronDown size={14} className="text-slate-500" />
                </button>
                
                {showModeSelector && (
                    <div className="absolute top-full mt-2 left-0 w-64 bg-surface border border-slate-700 rounded-xl shadow-xl overflow-hidden flex flex-col z-30">
                        <button onClick={() => { setChatMode('standard'); setShowModeSelector(false); }} className="px-4 py-3 hover:bg-slate-700/50 text-left text-sm text-slate-200 flex items-center gap-2">
                            <Sparkles size={16} className="text-primary"/> Standard (Gemini 2.5)
                        </button>
                        <button onClick={() => { setChatMode('fast'); setShowModeSelector(false); }} className="px-4 py-3 hover:bg-slate-700/50 text-left text-sm text-slate-200 flex items-center gap-2">
                            <Zap size={16} className="text-yellow-400"/> Fast Responses (Lite)
                        </button>
                        <button onClick={() => { setChatMode('thinking'); setShowModeSelector(false); }} className="px-4 py-3 hover:bg-slate-700/50 text-left text-sm text-slate-200 flex items-center gap-2">
                            <Brain size={16} className="text-purple-400"/> Deep Thinking (Pro)
                        </button>
                        <div className="h-px bg-slate-700 my-1"></div>
                        <button onClick={() => { setChatMode('grounded_search'); setShowModeSelector(false); }} className="px-4 py-3 hover:bg-slate-700/50 text-left text-sm text-slate-200 flex items-center gap-2">
                            <Globe size={16} className="text-blue-400"/> Web Search Grounding
                        </button>
                        <button onClick={() => { setChatMode('grounded_maps'); setShowModeSelector(false); }} className="px-4 py-3 hover:bg-slate-700/50 text-left text-sm text-slate-200 flex items-center gap-2">
                            <MapPin size={16} className="text-red-400"/> Maps Grounding
                        </button>
                    </div>
                )}
            </div>

            <button 
                onClick={() => setAutoRead(!autoRead)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors backdrop-blur-sm border border-slate-700 ${autoRead ? 'bg-green-500/20 text-green-400' : 'bg-darker/80 text-slate-500 hover:text-white'}`}
            >
                <Headphones size={18} />
            </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 md:px-0 pt-16 pb-32">
        {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center space-y-8 animate-fade-in text-center px-4 max-w-4xl mx-auto">
                <div className="bg-surface p-4 rounded-full shadow-2xl shadow-primary/20">
                     <Brain size={32} className="text-white" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white">Gemini Intelligence Hub</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                    <button onClick={() => { setChatMode('thinking'); setInput("Solve this complex math problem step-by-step: "); }} className="p-4 bg-surface border border-slate-700/50 rounded-2xl hover:bg-slate-700/50 text-left transition-colors">
                        <span className="flex items-center gap-2 font-medium text-purple-400 mb-1"><Brain size={16}/> Deep Thinking</span>
                        <span className="text-xs text-slate-500">Complex reasoning tasks</span>
                    </button>
                    <button onClick={() => { setChatMode('grounded_search'); setInput("What are the latest tech news today?"); }} className="p-4 bg-surface border border-slate-700/50 rounded-2xl hover:bg-slate-700/50 text-left transition-colors">
                         <span className="flex items-center gap-2 font-medium text-blue-400 mb-1"><Globe size={16}/> Web Search</span>
                         <span className="text-xs text-slate-500">Real-time information</span>
                    </button>
                </div>
                
                <div className="w-full">
                    <ToolGuide 
                        title="AI Chatbot"
                        steps={[
                            "Type your message in the input bar below.",
                            "Use the mode selector (top left) to switch between Standard, Thinking, or Search modes.",
                            "Click the Image or Video icons to upload attachments for analysis.",
                            "Press Send or hit Enter to chat."
                        ]}
                        tips={[
                            "Use 'Deep Thinking' mode for math, coding, and complex logic puzzles.",
                            "Use 'Web Search' for current events and news.",
                            "You can upload a video and ask questions about its content (uses Gemini 1.5 Pro).",
                            "Toggle the headphone icon to auto-read responses aloud."
                        ]}
                    />
                </div>
            </div>
        ) : (
            <div className="w-full max-w-3xl mx-auto space-y-6">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'ai' && (
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                                <Sparkles size={14} className="text-white" />
                            </div>
                        )}
                        
                        <div className={`max-w-[85%] md:max-w-[75%] space-y-2 group`}>
                            {msg.image && (
                                <img src={msg.image} alt="User upload" className="max-w-xs rounded-xl border border-slate-700/50" />
                            )}
                            {msg.video && (
                                <video src={msg.video} controls className="max-w-xs rounded-xl border border-slate-700/50" />
                            )}
                            {msg.content && (
                                <div className={`prose prose-invert prose-sm max-w-none text-[15px] leading-7 ${msg.role === 'user' ? 'bg-surface/50 px-4 py-2 rounded-2xl' : ''}`}>
                                    {msg.content.split('\n').map((line, i) => <p key={i} className="my-1">{line}</p>)}
                                </div>
                            )}
                            
                            {msg.role === 'ai' && (
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => speakMessage(msg.content, idx)}
                                        className={`p-1.5 rounded-full hover:bg-slate-700 transition-colors ${playingMessageIndex === idx ? 'text-green-400' : 'text-slate-500'}`}
                                    >
                                        {playingMessageIndex === idx ? <StopCircle size={16} /> : <Volume2 size={16} />}
                                    </button>
                                </div>
                            )}
                        </div>

                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 mt-1">
                                <UserIcon size={14} className="text-slate-300" />
                            </div>
                        )}
                    </div>
                ))}
                
                {isLoading && (
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                            <Loader2 size={14} className="text-white animate-spin" />
                        </div>
                        <div className="flex gap-1 items-center h-8">
                            <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-75"></span>
                            <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-150"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
        )}
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 pb-6 px-4 bg-gradient-to-t from-darker via-darker to-transparent pt-10">
        <div className="w-full max-w-3xl mx-auto">
            
            {/* Previews */}
            {(selectedImage || selectedVideo) && (
                <div className="mb-2 inline-flex items-center gap-2 bg-surface border border-slate-700 p-2 rounded-xl">
                    {selectedImage ? (
                        <img src={selectedImage} alt="Preview" className="h-10 w-10 object-cover rounded-lg" />
                    ) : (
                        <video src={selectedVideo!} className="h-10 w-10 object-cover rounded-lg" />
                    )}
                    <button onClick={() => { setSelectedImage(null); setSelectedVideo(null); }} className="bg-slate-700 rounded-full p-1 text-slate-300 hover:text-white">
                        <X size={12} />
                    </button>
                </div>
            )}

            <div className="bg-[#2f2f2f] rounded-[26px] p-2 flex items-end gap-2 relative shadow-lg border border-white/5">
                <div className="flex flex-col gap-1">
                    <button onClick={() => fileInputRef.current?.click()} className="p-2.5 rounded-full bg-white/10 text-slate-200 hover:bg-white/20 transition-colors" title="Add Image">
                        <ImageIcon size={20} />
                    </button>
                    <button onClick={() => videoInputRef.current?.click()} className="p-2.5 rounded-full bg-white/10 text-slate-200 hover:bg-white/20 transition-colors" title="Add Video">
                        <Video size={20} />
                    </button>
                </div>

                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                <input type="file" ref={videoInputRef} onChange={handleVideoUpload} className="hidden" accept="video/*" />

                <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder={isRecording ? "Listening..." : "Ask anything (Images, Videos, Maps...)"}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-slate-400 max-h-32 min-h-[50px] py-3 resize-none custom-scrollbar text-[16px]"
                    rows={1}
                />

                <div className="flex items-center gap-1 mb-0.5">
                    {input.trim() || selectedImage || selectedVideo ? (
                        <button onClick={handleSend} className="p-2.5 bg-white text-black rounded-full hover:bg-slate-200 transition-all">
                            <Send size={18} fill="currentColor" />
                        </button>
                    ) : (
                        <button 
                            onClick={toggleRecording}
                            className={`p-2.5 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-white'}`}
                        >
                             <Mic size={20} />
                        </button>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
