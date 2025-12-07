
import React from 'react';
import { Mic, MessageSquare, Video, Image, Languages, Speaker, FileText, Radio, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';

const FeaturesGuide: React.FC = () => {
  const features = [
    {
      icon: MessageSquare,
      title: "AI Chatbot Intelligence",
      description: "A multimodal assistant capable of standard chat, deep reasoning (Thinking Mode), and real-time web search.",
      capabilities: ["Text Analysis", "Image Understanding", "Web Grounding", "Math & Coding"],
      link: "/chatbot",
      color: "text-blue-400",
      bg: "bg-blue-500/10"
    },
    {
      icon: Mic,
      title: "Voice Cloning Studio",
      description: "Clone any human voice from a 1-minute sample. Supports text-to-speech using your custom cloned voices.",
      capabilities: ["Instant Cloning", "High Fidelity", "Multi-lingual Support", "Mic Recording"],
      link: "/voice-clone",
      color: "text-green-400",
      bg: "bg-green-500/10"
    },
    {
      icon: Video,
      title: "Veo Video Generation",
      description: "Turn text prompts or static images into high-quality videos using Google's Veo 3.1 model.",
      capabilities: ["Text-to-Video", "Image-to-Video", "Cinematic Quality", "1080p Output"],
      link: "/image-to-video",
      color: "text-pink-400",
      bg: "bg-pink-500/10"
    },
    {
      icon: Image,
      title: "Pro Image Studio",
      description: "Generate photorealistic images with Gemini 3 Pro and Imagen models.",
      capabilities: ["8K Resolution", "Various Aspect Ratios", "Style Control", "Commercial Rights"],
      link: "/text-to-image",
      color: "text-purple-400",
      bg: "bg-purple-500/10"
    },
    {
      icon: Radio,
      title: "Live Studio",
      description: "Real-time, low-latency voice conversation with AI. Feels like talking to a real human.",
      capabilities: ["Native Audio", "Interruptions", "Emotional Intelligence", "Hands-free"],
      link: "/live",
      color: "text-red-400",
      bg: "bg-red-500/10"
    },
    {
      icon: Languages,
      title: "Universal Translator",
      description: "Translate text and speech between 100+ languages with nuance and cultural context.",
      capabilities: ["Voice Input", "Audio Output", "Context Aware", "Instant Translation"],
      link: "/translator",
      color: "text-yellow-400",
      bg: "bg-yellow-500/10"
    },
    {
      icon: Speaker,
      title: "Text to Speech (TTS)",
      description: "Convert written script into lifelike spoken audio with a library of premium AI voices.",
      capabilities: ["Multiple Personas", "Emotion Control", "WAV Download", "Unlimited Length"],
      link: "/tts",
      color: "text-indigo-400",
      bg: "bg-indigo-500/10"
    },
    {
      icon: FileText,
      title: "Document AI",
      description: "Upload PDFs, Code files, or Images to extract summaries, data, and insights.",
      capabilities: ["PDF Analysis", "Code Explanation", "Data Extraction", "Table Parsing"],
      link: "/doc-ai",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white">Features Guide</h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Explore the full capabilities of the AI Multiverse Pro platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, idx) => (
          <div key={idx} className="bg-surface rounded-2xl border border-slate-700/50 p-6 flex flex-col hover:border-slate-500 transition-all group">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.bg}`}>
              <feature.icon size={24} className={feature.color} />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
            <p className="text-slate-400 text-sm mb-6 flex-1 leading-relaxed">
              {feature.description}
            </p>

            <div className="space-y-3 mb-6">
              {feature.capabilities.map((cap, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-medium text-slate-300">
                  <span className={`w-1.5 h-1.5 rounded-full ${feature.bg.replace('/10', '')}`} />
                  {cap}
                </div>
              ))}
            </div>

            <Link to={feature.link}>
              <Button variant="secondary" className="w-full group-hover:bg-slate-700">
                Try Feature <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturesGuide;
