import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Terms: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link to="/profile" className="inline-flex items-center text-slate-400 hover:text-white mb-4">
        <ArrowLeft size={16} className="mr-2" /> Back to Profile
      </Link>
      
      <div className="bg-surface p-8 rounded-2xl border border-slate-700">
        <h1 className="text-3xl font-bold text-white mb-6">Terms of Service & Privacy</h1>
        
        <div className="prose prose-invert prose-slate max-w-none space-y-6 text-slate-300">
            <section>
                <h2 className="text-xl font-bold text-white">1. Acceptance of Terms</h2>
                <p>By accessing and using AI Multiverse Pro, you accept and agree to be bound by the terms and provision of this agreement.</p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white">2. AI Usage Policy</h2>
                <p>You agree not to use the AI generation features for any illegal, harmful, or abusive purpose. This includes generating content that promotes violence, hate speech, or harassment.</p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white">3. Credits & Refunds</h2>
                <p>Credits purchased are non-refundable. The subscription plans are billed according to the selected duration. We reserve the right to modify credit costs for actions at any time.</p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white">4. Privacy Policy</h2>
                <p>We value your privacy. Your input data (audio, images, text) is processed via Google Gemini API. We do not permanently store your generated content on our servers. Local storage is used for simulation purposes in this demo.</p>
            </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;