
import React, { useState, useEffect } from 'react';
import { Image, Sparkles, Download, Lock, Key, CheckCircle } from 'lucide-react';
import Button from '../components/Button';
import ToolGuide from '../components/ToolGuide';
import { generateImage } from '../services/geminiService';
import { MockBackend } from '../services/mockBackend';
import { CREDIT_COSTS } from '../types';
import { Link, Navigate } from 'react-router-dom';

const ASPECT_RATIOS = ["1:1", "3:4", "4:3", "9:16", "16:9", "21:9"];
const RESOLUTIONS = ["1K", "2K", "4K"];

const TextToImage: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [resolution, setResolution] = useState("1K");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [needsApiKey, setNeedsApiKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const user = MockBackend.getCurrentUser();
  
  useEffect(() => {
    // High quality model often requires paid key selection if using 2K/4K
    const checkKey = async () => {
      const aistudio = (window as any).aistudio;
      if (aistudio && (resolution === '2K' || resolution === '4K')) {
        const hasKey = await aistudio.hasSelectedApiKey();
        setNeedsApiKey(!hasKey);
      } else {
        setNeedsApiKey(false);
      }
    };
    checkKey();
  }, [resolution]);

  if (!user) return <Navigate to="/welcome" />;

  const hasPermission = MockBackend.hasPermission(user, 'TEXT_TO_IMAGE');

  const handleConnectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      await aistudio.openSelectKey();
      setNeedsApiKey(false);
    }
  };

  const handleGenerate = async () => {
    if (!hasPermission) return;
    if (!prompt.trim()) return;

    if (user.credits !== 'unlimited' && user.credits < CREDIT_COSTS.TEXT_TO_IMAGE) {
        alert("Insufficient credits.");
        return;
    }

    setIsProcessing(true);
    setImageUrl(null);
    setSaved(false);
    MockBackend.deductCredits(user.id, CREDIT_COSTS.TEXT_TO_IMAGE, 'TEXT_TO_IMAGE');

    try {
        const url = await generateImage(prompt, aspectRatio, resolution);
        setImageUrl(url);
        
        if (url) {
            // Save to Profile
            MockBackend.saveFile({
                id: Date.now().toString(),
                user_id: user.id,
                type: 'image',
                url: url,
                name: prompt.slice(0, 30) + (prompt.length > 30 ? '...' : ''),
                created_at: new Date().toISOString()
            });
            setSaved(true);
        }

    } catch (error: any) {
        if (JSON.stringify(error).includes("key")) {
             setNeedsApiKey(true);
        }
        alert("Generation failed. " + error.message);
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
                You have reached your Text to Image generation limit for this plan. Please upgrade for more.
            </p>
            <Link to="/pricing">
                <Button className="px-8 py-3">View Upgrade Plans</Button>
            </Link>
        </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Pro Image Studio</h1>
          <p className="text-slate-400 mt-2">Generate high-fidelity images with Gemini 3 Pro.</p>
        </div>
        <div className="bg-pink-500/10 px-4 py-2 rounded-lg border border-pink-500/20">
            <span className="text-pink-300 text-sm font-medium">Cost: {CREDIT_COSTS.TEXT_TO_IMAGE} Credits</span>
        </div>
      </div>

      {needsApiKey && (
         <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Key className="text-yellow-500" />
                <span className="text-white">High Resolution generation requires a paid Google Cloud Project Key.</span>
            </div>
            <Button onClick={handleConnectKey} className="text-sm py-1 bg-yellow-600">Connect Key</Button>
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5 space-y-6">
              <div className="bg-surface p-6 rounded-2xl border border-slate-700">
                  <label className="block text-sm font-medium text-slate-300 mb-4">Prompt</label>
                  <textarea 
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="A futuristic city on Mars at sunset, photorealistic 8k..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-primary outline-none h-40 resize-none mb-4"
                  />
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                       <div>
                           <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Aspect Ratio</label>
                           <div className="grid grid-cols-3 gap-2">
                               {ASPECT_RATIOS.map(ar => (
                                   <button 
                                     key={ar} 
                                     onClick={() => setAspectRatio(ar)}
                                     className={`px-3 py-3 text-sm font-medium rounded-lg border transition-all ${aspectRatio === ar ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105' : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                                   >
                                       {ar}
                                   </button>
                               ))}
                           </div>
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Resolution</label>
                           <div className="grid grid-cols-3 gap-2">
                               {RESOLUTIONS.map(res => {
                                   const isComingSoon = res === '2K' || res === '4K';
                                   return (
                                       <button 
                                         key={res} 
                                         onClick={() => !isComingSoon && setResolution(res)}
                                         disabled={isComingSoon}
                                         className={`relative overflow-hidden px-3 py-3 text-sm font-medium rounded-lg border transition-all ${
                                            resolution === res 
                                                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105' 
                                                : isComingSoon
                                                    ? 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed'
                                                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                                         }`}
                                       >
                                           <span className={isComingSoon ? 'opacity-20' : ''}>{res}</span>
                                           {isComingSoon && (
                                               <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-[10px] font-bold text-white uppercase tracking-wider">
                                                   Soon
                                               </div>
                                           )}
                                       </button>
                                   );
                               })}
                           </div>
                       </div>
                  </div>

                  <Button 
                    onClick={handleGenerate} 
                    isLoading={isProcessing}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 border-none py-3"
                  >
                      <Sparkles className="h-4 w-4" />
                      Generate Image
                  </Button>
              </div>
          </div>

          <div className="md:col-span-7 bg-surface p-6 rounded-2xl border border-slate-700 flex flex-col items-center justify-center min-h-[500px]">
              {imageUrl ? (
                  <div className="relative w-full h-full group flex flex-col items-center justify-center gap-4">
                      <img src={imageUrl} alt="Generated" className="max-w-full max-h-[450px] rounded-lg shadow-2xl object-contain" />
                      
                      <div className="flex gap-3">
                        <a 
                            href={imageUrl} 
                            download={`ai-image-${Date.now()}.png`}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                        >
                            <Download size={18} /> Download
                        </a>
                        {saved && (
                            <span className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 rounded-lg border border-green-500/20">
                                <CheckCircle size={18} /> Saved to Profile
                            </span>
                        )}
                      </div>
                  </div>
              ) : (
                  <div className="text-slate-500 flex flex-col items-center">
                      <Image className="h-16 w-16 opacity-20 mb-4" />
                      <p>Your {resolution} creation will appear here</p>
                  </div>
              )}
          </div>
      </div>
      
      <ToolGuide 
        title="Text to Image"
        steps={[
            "Enter a detailed description (prompt) in the text box.",
            "Select an aspect ratio (e.g., 16:9 for wallpapers, 1:1 for social media).",
            "Choose a resolution (1K available now, higher res coming soon).",
            "Click 'Generate Image' and wait for the AI to create your visual."
        ]}
        tips={[
            "Be specific about style, lighting, and composition (e.g., 'cyberpunk city, neon lights, 8k, photorealistic').",
            "Higher resolutions consume more processing power but yield sharper details.",
            "Try different aspect ratios to suit your project needs."
        ]}
      />
    </div>
  );
};

export default TextToImage;
