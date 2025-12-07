
import React, { useState } from 'react';
import { FileText, Upload, Check, AlertCircle, Loader2, File, FileCode, FileImage } from 'lucide-react';
import Button from '../components/Button';
import ToolGuide from '../components/ToolGuide';
import { analyzeDocument } from '../services/geminiService';
import { MockBackend } from '../services/mockBackend';
import { CREDIT_COSTS } from '../types';
import { Link } from 'react-router-dom';

const DocumentAI: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [promptType, setPromptType] = useState('summary');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState('');

  const PROMPTS = {
    summary: "Analyze this document and provide a concise summary of the main points.",
    extract: "Extract all key data points, dates, and names from this document.",
    table: "Identify any tables in this document and convert them into JSON format.",
    custom: ""
  };

  const user = MockBackend.getCurrentUser();
  const hasPermission = MockBackend.hasPermission(user, 'DOC_AI');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = reader.result as string;
            // Remove data url prefix
            const base64Data = base64.split(',')[1];
            resolve(base64Data);
        };
        reader.onerror = error => reject(error);
    });
  };

  const handleAnalyze = async () => {
    if (!file) return;

    if (!hasPermission) {
        alert("Permission denied.");
        return;
    }

    if (user && user.credits !== 'unlimited' && user.credits < CREDIT_COSTS.DOC_AI_PER_PAGE) {
        alert("Insufficient credits.");
        return;
    }

    setIsProcessing(true);
    setResult('');
    
    try {
        const base64 = await convertToBase64(file);
        const promptText = promptType === 'custom' ? customPrompt : PROMPTS[promptType as keyof typeof PROMPTS];
        
        if (user) {
             MockBackend.deductCredits(user.id, CREDIT_COSTS.DOC_AI_PER_PAGE, 'DOC_AI');
        }

        // Pass dynamic mimeType
        const text = await analyzeDocument(base64, file.type, promptText);
        setResult(text);
    } catch (error) {
        console.error(error);
        setResult("Error analyzing document. Some file types might not be supported directly by the AI model. Please try converting to PDF or Text if this fails.");
    } finally {
        setIsProcessing(false);
    }
  };

  const getFileIcon = () => {
      if (!file) return <Upload className="h-10 w-10 text-slate-400 mb-3" />;
      if (file.type.includes('image')) return <FileImage className="h-10 w-10 text-purple-400 mb-3" />;
      if (file.type.includes('code') || file.name.endsWith('.js') || file.name.endsWith('.py') || file.name.endsWith('.ts')) return <FileCode className="h-10 w-10 text-blue-400 mb-3" />;
      if (file.type.includes('pdf')) return <FileText className="h-10 w-10 text-red-400 mb-3" />;
      return <File className="h-10 w-10 text-green-400 mb-3" />;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Document AI</h1>
          <p className="text-slate-400 mt-2">Extract insights from any document (PDF, Word, Code, Text, etc).</p>
        </div>
        <div className="bg-emerald-500/10 px-4 py-2 rounded-lg border border-emerald-500/20">
            <span className="text-emerald-300 text-sm font-medium">Cost: {CREDIT_COSTS.DOC_AI_PER_PAGE} Credits</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
            {/* Upload Area */}
            <div className="bg-surface p-6 rounded-2xl border border-slate-700">
                <label className="block text-sm font-medium text-slate-300 mb-4">Upload Document</label>
                <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:bg-slate-700/30 transition-colors relative">
                    <input 
                        type="file" 
                        accept="*" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileChange}
                    />
                    {file ? (
                        <div className="flex flex-col items-center">
                            {getFileIcon()}
                            <span className="text-white font-medium">{file.name}</span>
                            <span className="text-slate-500 text-sm mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            <span className="text-slate-600 text-xs mt-0.5 uppercase">{file.type.split('/')[1] || 'FILE'}</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <Upload className="h-10 w-10 text-slate-400 mb-3" />
                            <span className="text-slate-200 font-medium">Click to upload</span>
                            <span className="text-slate-500 text-sm mt-1">PDF, Word, Excel, Code, Text, Images supported</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Prompt Config */}
            <div className="bg-surface p-6 rounded-2xl border border-slate-700">
                <label className="block text-sm font-medium text-slate-300 mb-4">Analysis Type</label>
                <div className="grid grid-cols-2 gap-3 mb-4">
                    {['summary', 'extract', 'table', 'custom'].map(type => (
                        <button
                            key={type}
                            onClick={() => setPromptType(type)}
                            className={`p-3 rounded-lg border capitalize text-sm font-medium transition-all ${
                                promptType === type 
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
                
                {promptType === 'custom' && (
                    <textarea 
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Ask anything about the document..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none h-24 resize-none"
                    />
                )}

                <Button 
                    onClick={handleAnalyze} 
                    isLoading={isProcessing} 
                    disabled={!file}
                    className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                    {isProcessing ? <Loader2 className="animate-spin h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    {isProcessing ? 'Analyzing...' : 'Analyze Document'}
                </Button>
            </div>
        </div>

        {/* Results Area */}
        <div className="bg-surface rounded-2xl border border-slate-700 flex flex-col h-[600px]">
            <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex items-center justify-between">
                <span className="font-bold text-white">Analysis Result</span>
                {result && <span className="text-xs text-slate-400">Generated by Gemini 3 Pro</span>}
            </div>
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                {result ? (
                    <div className="prose prose-invert max-w-none whitespace-pre-wrap text-slate-300">
                        {result}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500">
                        <AlertCircle className="h-12 w-12 opacity-20 mb-4" />
                        <p>Upload a document and analyze to see results</p>
                    </div>
                )}
            </div>
        </div>
      </div>

      <ToolGuide 
        title="Document AI"
        steps={[
            "Click the upload box to select ANY document (PDF, Word, Code, Image, Text, etc).",
            "Choose an Analysis Type: Summary, Extract (key data), Table (for data grids), or Custom.",
            "If using 'Custom', type your specific question about the document.",
            "Click 'Analyze Document' and view the results in the right panel."
        ]}
        tips={[
            "PDFs work best for multi-page documents.",
            "You can upload code files (.js, .py) to have Gemini explain the code.",
            "Large files may take longer to process.",
            "Handwritten text is supported in images and PDFs."
        ]}
      />
    </div>
  );
};

export default DocumentAI;
