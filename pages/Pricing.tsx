
import React, { useState } from 'react';
import { PRICING_USD, PlanType, PLAN_DETAILS } from '../types';
import Button from '../components/Button';
import { Check, Star, Zap, Crown, XCircle } from 'lucide-react';
import { MockBackend } from '../services/mockBackend';
import { useNavigate, Navigate } from 'react-router-dom';

const Pricing: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const user = MockBackend.getCurrentUser();

  if (!user) return <Navigate to="/welcome" />;

  const handlePurchase = (plan: PlanType, amount: number, durationMonths: number) => {
    if (user.is_banned) {
        alert("Account banned. Cannot purchase.");
        return;
    }

    // Navigate to payment page with plan details
    navigate('/payment', { state: { planType: plan, amount, durationMonths } });
  };

  const PlanCard = ({ type, price, duration }: { type: PlanType, price: number, duration: number }) => {
      const details = PLAN_DETAILS[type];
      const isCurrent = user.plan_type === type;
      
      let borderColor = 'border-slate-700/50';
      let bgColor = 'bg-surface';
      let icon = <Star className="text-slate-400" />;
      
      if (type === 'premium_3_month') { borderColor = 'border-blue-500/30'; icon = <Zap className="text-blue-400" />; }
      if (type === 'premium_6_month') { borderColor = 'border-purple-500/30'; icon = <Star className="text-purple-400" />; }
      if (type === 'premium_year') { borderColor = 'border-amber-500/30'; icon = <Crown className="text-amber-400" />; }
      if (type === 'premium_2year') { borderColor = 'border-red-500/30'; icon = <Crown className="text-red-500 fill-red-500" />; }

      return (
        <div className={`rounded-3xl p-6 border ${borderColor} ${bgColor} flex flex-col h-full hover:shadow-xl transition-all`}>
            <div className="flex items-center gap-2 mb-2">
                {icon}
                <h3 className="text-xl font-bold text-white">{details.label}</h3>
            </div>
            
            <div className="my-4">
                <span className="text-3xl font-bold text-white">${price.toLocaleString()}</span>
                <span className="text-slate-400 text-sm"> USD</span>
            </div>

            <div className="mb-4 p-2 bg-slate-900 rounded-lg text-center">
                <span className="text-lg font-mono font-bold text-primary">
                    {typeof details.credits === 'number' ? details.credits.toLocaleString() : 'UNLIMITED'}
                </span>
                <span className="text-xs text-slate-500 block">Credits</span>
            </div>

            <ul className="space-y-3 mb-6 flex-1">
                {details.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-300 text-sm">
                        <Check size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                        <span>{feat}</span>
                    </li>
                ))}
                {details.blocked.map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-500 text-sm">
                        <XCircle size={16} className="text-slate-600 mt-0.5 flex-shrink-0" />
                        <span className="line-through">{feat}</span>
                    </li>
                ))}
            </ul>

            <Button 
                variant={isCurrent ? "secondary" : "primary"}
                className="w-full text-sm"
                disabled={isCurrent}
                onClick={() => handlePurchase(type, price, duration)}
                isLoading={isProcessing}
            >
                {isCurrent ? "Current Plan" : "Upgrade"}
            </Button>
        </div>
      );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
          Choose Your Power
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Plans designed for every level of creator.
        </p>
      </div>

      {/* FREE PLAN CARD (Manual) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
         <div className="rounded-3xl p-6 border border-slate-700/50 bg-surface flex flex-col h-full">
            <h3 className="text-xl font-bold text-slate-200">Free Starter</h3>
            <div className="my-4">
                <span className="text-3xl font-bold text-white">$0</span>
                <span className="text-slate-400"> USD</span>
            </div>
            <div className="mb-4 p-2 bg-slate-900 rounded-lg text-center">
                <span className="text-lg font-mono font-bold text-slate-300">10,000</span>
                <span className="text-xs text-slate-500 block">Credits</span>
            </div>
            <ul className="space-y-3 mb-6 flex-1">
                {PLAN_DETAILS.free.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-300 text-sm"><Check size={14} className="text-green-400"/> {f}</li>
                ))}
                {PLAN_DETAILS.free.blocked.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-500 text-sm"><XCircle size={14}/> {f}</li>
                ))}
            </ul>
            <Button variant="secondary" className="w-full text-sm" disabled={user.plan_type === 'free'}>
                {user.plan_type === 'free' ? "Current Plan" : "Downgrade"}
            </Button>
         </div>

         <PlanCard type="premium_3_month" price={PRICING_USD.PREMIUM_3_MONTH} duration={3} />
         <PlanCard type="premium_6_month" price={PRICING_USD.PREMIUM_6_MONTH} duration={6} />
         <PlanCard type="premium_year" price={PRICING_USD.YEARLY} duration={12} />
         <PlanCard type="premium_2year" price={PRICING_USD.TWO_YEAR} duration={24} />
      </div>
    </div>
  );
};

export default Pricing;
