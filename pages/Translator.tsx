
import React, { useState, useRef, useEffect } from 'react';
import { ArrowRightLeft, Copy, Check, RotateCcw, Mic, Volume2, Loader2, StopCircle } from 'lucide-react';
import Button from '../components/Button';
import ToolGuide from '../components/ToolGuide';
import { translateText, generateSpeech } from '../services/geminiService';
import { MockBackend } from '../services/mockBackend';
import { CREDIT_COSTS } from '../types';

const LANGUAGES = [
  "Afrikaans", "Albanian", "Amharic", "Arabic", "Armenian", "Azerbaijani", "Basque", "Belarusian", "Bengali", 
  "Bosnian", "Bulgarian", "Catalan", "Cebuano", "Chinese (Simplified)", "Chinese (Traditional)", "Corsican", 
  "Croatian", "Czech", "Danish", "Dutch", "English", "Esperanto", "Estonian", "Finnish", "French", "Frisian", 
  "Galician", "Georgian", "German", "Greek", "Gujarati", "Haitian Creole", "Hausa", "Hawaiian", "Hebrew", "Hindi", 
  "Hmong", "Hungarian", "Icelandic", "Igbo", "Indonesian", "Irish", "Italian", "Japanese", "Javanese", "Kannada", 
  "Kazakh", "Khmer", "Kinyarwanda", "Korean", "Kurdish", "Kyrgyz", "Lao", "Latin", "Latvian", "Lithuanian", 
  "Luxembourgish", "Macedonian", "Malagasy", "Malay", "Malayalam", "Maltese", "Maori", "Marathi", "Mongolian", 
  "Myanmar (Burmese)", "Nepali", "Norwegian", "Nyanja (Chichewa)", "Odia (Oriya)", "Pashto", "Persian", "Polish", 
  "Portuguese", "Punjabi", "Romanian", "Russian", "Samoan", "Scots Gaelic", "Serbian", "Sesotho", "Shona", 
  "Sindhi", "Sinhala (Sinhalese)", "Slovak", "Slovenian", "Somali", "Spanish", "Sundanese", "Swahili", "Swedish", 
  "Tagalog (Filipino)", "Tajik", "Tamil", "Tatar", "Telugu", "Thai", "Turkish", "Turkmen", "Ukrainian", "Urdu", 
  "Uyghur", "Uzbek", "Vietnamese", "Welsh", "Xhosa", "Yiddish", "Yoruba", "Zulu"
];

const Translator: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [targetLang, setTargetLang] = useState('Spanish');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
      return () => {
          if (recognitionRef.current) recognitionRef.current.stop();
          if (audioRef.current) audioRef.current.pause();
      };
  }, []);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;

    const user = MockBackend.getCurrentUser();
    if (user.credits !== 'unlimited' && user.credits < CREDIT_COSTS.TRANSLATION) {
        alert("Insufficient credits for translation.");
        return;
    }

    setIsProcessing(true);
    MockBackend.deductCredits(user.id, CREDIT_COSTS.TRANSLATION, 'TRANSLATE');

    try {
        const result = await translateText(inputText, targetLang);
        setOutputText(result);
    } catch (error) {
        setOutputText("Error during translation.");
    } finally {
        setIsProcessing(false);
    }
  };

  const toggleVoiceInput = () => {
      if (isListening) {
          if (recognitionRef.current) recognitionRef.current.stop();
          setIsListening(false);
          return;
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
          alert("Voice input is not supported in this browser.");
          return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US'; // Default to English input for now

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
      };

      recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputText(prev => prev ? `${prev} ${transcript}` : transcript);
      };

      recognitionRef.current = recognition;
      recognition.start();
  };

  const handlePlayOutput = async () => {
      if (!outputText) return;

      // If already playing, stop it
      if (isPlaying && audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
          return;
      }

      // Voice output in Translator is FREE (0 credits)
      setIsPlaying(true);
      
      try {
           const audioUrl = await generateSpeech(outputText);
           if (audioUrl) {
               const audio = new Audio(audioUrl);
               audioRef.current = audio;
               audio.onended = () => setIsPlaying(false);
               audio.play().catch(e => {
                   console.error("Audio play error", e);
                   setIsPlaying(false);
               });
           } else {
               setIsPlaying(false);
           }
      } catch (e) {
          console.error(e);
          setIsPlaying(false);
          alert("Failed to generate audio.");
      }
  };

  const copyToClipboard = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwap = () => {
      setInputText(outputText);
      setOutputText(inputText);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">AI Universal Translator</h1>
          <p className="text-slate-400 mt-2">Professional grade translation powered by Gemini 2.5.</p>
        </div>
        <div className="bg-purple-500/10 px-4 py-2 rounded-lg border border-purple-500/20 flex flex-col items-end">
            <span className="text-purple-300 text-sm font-medium">Translate: {CREDIT_COSTS.TRANSLATION} Credits</span>
            <span className="text-green-400 text-xs font-bold mt-1">Voice Output: FREE</span>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        {/* Controls */}
        <div className="bg-slate-900/50 p-4 flex flex-col md:flex-row items-center gap-4 border-b border-slate-700">
            <div className="flex-1 w-full">
                <select className="w-full bg-slate-800 border-none rounded-lg p-2.5 text-slate-300 font-medium cursor-not-allowed opacity-70" disabled>
                    <option>English (Detected)</option>
                </select>
            </div>
            
            <button onClick={handleSwap} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 transition-colors">
                <ArrowRightLeft size={20} />
            </button>

            <div className="flex-1 w-full">
                <select 
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-medium focus:ring-2 focus:ring-primary outline-none"
                >
                    {LANGUAGES.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                    ))}
                </select>
            </div>

            <Button onClick={handleTranslate} isLoading={isProcessing} className="w-full md:w-auto px-8">
                Translate
            </Button>
        </div>

        {/* Text Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 h-[400px] divide-y md:divide-y-0 md:divide-x divide-slate-700">
            {/* Input Side */}
            <div className="relative p-4 flex flex-col">
                <textarea 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter text to translate..."
                    className="flex-1 w-full bg-transparent border-none resize-none focus:ring-0 text-lg text-white placeholder-slate-500"
                />
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                     <button 
                        onClick={toggleVoiceInput}
                        className={`p-2 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                        title={isListening ? "Stop Listening" : "Voice Input"}
                     >
                        {isListening ? <StopCircle size={20} /> : <Mic size={20} />}
                     </button>
                     {isListening && <span className="text-xs text-red-400 font-medium animate-pulse">Listening...</span>}
                </div>
                <div className="absolute bottom-4 right-4 text-xs text-slate-500">
                    {inputText.length} chars
                </div>
            </div>

            {/* Output Side */}
            <div className="relative p-4 bg-slate-900/30 flex flex-col">
                {isProcessing ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-pulse text-primary font-medium">Translating...</div>
                    </div>
                ) : (
                    <textarea 
                        readOnly
                        value={outputText}
                        placeholder="Translation will appear here..."
                        className="flex-1 w-full bg-transparent border-none resize-none focus:ring-0 text-lg text-slate-200 placeholder-slate-600"
                    />
                )}
                <div className="absolute bottom-4 right-4 flex gap-2">
                    {outputText && (
                        <button 
                            onClick={handlePlayOutput}
                            className={`p-2 rounded-lg transition-colors ${isPlaying ? 'bg-primary text-white' : 'hover:bg-slate-700/50 text-slate-400'}`}
                            title={isPlaying ? "Stop" : "Listen (FREE)"}
                        >
                            {isPlaying ? <StopCircle size={18} /> : <Volume2 size={18} />}
                        </button>
                    )}
                    <button 
                        onClick={() => setInputText('')}
                        className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400"
                        title="Clear"
                    >
                        <RotateCcw size={18} />
                    </button>
                    <button 
                        onClick={copyToClipboard}
                        className={`p-2 rounded-lg transition-colors ${copied ? 'bg-green-500/20 text-green-400' : 'hover:bg-slate-700/50 text-slate-400'}`}
                        title="Copy Translation"
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                </div>
            </div>
        </div>
      </div>

      <ToolGuide 
        title="Universal Translator"
        steps={[
            "Type text in the left box OR use the Microphone icon for voice input.",
            "Select your desired target language from the dropdown menu.",
            "Click the 'Translate' button.",
            "Use the speaker icon to listen to the pronunciation (Free feature)."
        ]}
        tips={[
            "Speak clearly and close to the microphone for best voice recognition.",
            "Use the copy button to quickly paste the translation into other apps.",
            "Short, clear sentences result in the most accurate translations.",
            "Listening to the translation helps with language learning."
        ]}
      />
    </div>
  );
};

export default Translator;
