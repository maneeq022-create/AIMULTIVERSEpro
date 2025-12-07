
import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Lightbulb, CheckCircle2 } from 'lucide-react';

interface ToolGuideProps {
  title: string;
  steps: string[];
  tips: string[];
}

const ToolGuide: React.FC<ToolGuideProps> = ({ title, steps, tips }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl overflow-hidden mt-8 transition-all duration-300 shadow-sm">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-800/50 transition-colors group"
      >
        <div className="flex items-center gap-3 text-slate-200 font-semibold text-lg">
          <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
            <HelpCircle size={20} className="text-primary" />
          </div>
          <span>Guide: How to use {title}</span>
        </div>
        {isOpen ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
      </button>
      
      {isOpen && (
        <div className="p-6 pt-2 border-t border-slate-700/50 grid md:grid-cols-2 gap-8 animate-fade-in">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              Step-by-Step
            </h4>
            <ol className="space-y-4">
              {steps.map((step, idx) => (
                <li key={idx} className="flex gap-3 text-slate-300 text-sm leading-relaxed">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-5">
            <h4 className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">
              <Lightbulb size={16} />
              Pro Tips
            </h4>
            <ul className="space-y-3">
              {tips.map((tip, idx) => (
                <li key={idx} className="flex gap-3 text-slate-300 text-sm leading-relaxed">
                  <CheckCircle2 size={16} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolGuide;
