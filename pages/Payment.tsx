
import React, { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { PLAN_DETAILS, ADMIN_PAYMENT_INFO, PlanType } from '../types';
import Button from '../components/Button';
import { MockBackend } from '../services/mockBackend';
import { ArrowLeft, CheckCircle, Copy, Landmark, Smartphone, Check, Loader2 } from 'lucide-react';

const Payment: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as { planType: PlanType, amount: number, durationMonths: number } | undefined;
    
    const [method, setMethod] = useState<'bank' | 'jazzcash'>('bank');
    
    // User Inputs
    const [senderBankName, setSenderBankName] = useState('');
    const [senderAccountNumber, setSenderAccountNumber] = useState('');
    const [senderName, setSenderName] = useState('');
    const [transactionId, setTransactionId] = useState('');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const user = MockBackend.getCurrentUser();

    if (!user) return <Navigate to="/welcome" />;
    if (!state) return <Navigate to="/pricing" />;

    const planName = PLAN_DETAILS[state.planType].label;

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleSubmit = () => {
        // Validation
        if (!senderName) {
            alert("Please enter Sender Name.");
            return;
        }
        if (method === 'bank') {
            if (!senderBankName || !senderAccountNumber) {
                alert("Please enter your Bank Name and Account Number.");
                return;
            }
        }
        if (method === 'jazzcash' && !senderAccountNumber) { // Using account number field for mobile number
             alert("Please enter your JazzCash Mobile Number.");
             return;
        }

        setIsSubmitting(true);
        
        // Simulating "Auto-Process" time
        setTimeout(() => {
            MockBackend.createPaymentRequest(
                user.id,
                state.planType,
                state.amount,
                state.durationMonths,
                method,
                senderName,
                method === 'bank' ? senderBankName : 'JazzCash',
                senderAccountNumber,
                transactionId || 'AUTO_PROCESSED'
            );
            setIsSubmitting(false);
            
            // Success Message & Redirect
            alert("Payment Verified Successfully! Your plan has been upgraded.");
            navigate('/');
        }, 2000);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-12">
            <button onClick={() => navigate('/pricing')} className="flex items-center text-slate-400 hover:text-white">
                <ArrowLeft size={16} className="mr-2" /> Cancel Payment
            </button>

            <div className="text-center">
                <h1 className="text-3xl font-bold text-white mb-2">Direct Bank Transfer</h1>
                <p className="text-slate-400">Securely transfer funds to activate your premium plan instantly.</p>
            </div>

            {/* Plan Summary */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Amount Payable</p>
                    <p className="text-4xl font-bold text-primary">${state.amount.toLocaleString()} <span className="text-lg text-slate-300">USD</span></p>
                </div>
                <div className="text-right">
                    <p className="text-white font-bold text-xl">{planName}</p>
                    <p className="text-sm text-slate-400">Instant Activation</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Section 1: Admin Bank Details */}
                <div className="space-y-6">
                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                        <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                        Transfer Money To
                    </h3>
                    
                    {/* Method Tabs */}
                    <div className="flex gap-2 p-1 bg-slate-900 rounded-xl border border-slate-700">
                        <button 
                            onClick={() => setMethod('bank')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${method === 'bank' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            HBL Bank
                        </button>
                        <button 
                            onClick={() => setMethod('jazzcash')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${method === 'jazzcash' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            JazzCash
                        </button>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 relative overflow-hidden group">
                        {method === 'bank' && (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold">Bank Name</p>
                                    <div className="flex items-center gap-2">
                                        <Landmark className="text-green-400" size={20} />
                                        <p className="text-white font-bold text-lg">{ADMIN_PAYMENT_INFO.BANK.bank_name}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold">Account Number</p>
                                    <div className="flex items-center justify-between mt-1 bg-black/30 p-3 rounded-lg border border-slate-600/50">
                                        <p className="text-xl text-white font-mono tracking-wider">{ADMIN_PAYMENT_INFO.BANK.account_number}</p>
                                        <button 
                                            onClick={() => handleCopy(ADMIN_PAYMENT_INFO.BANK.account_number, 'acc_num')}
                                            className="text-slate-400 hover:text-white transition-colors"
                                        >
                                            {copiedField === 'acc_num' ? <Check size={18} className="text-green-500"/> : <Copy size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold">Account Title</p>
                                    <p className="text-white font-medium">{ADMIN_PAYMENT_INFO.BANK.account_title}</p>
                                </div>
                            </div>
                        )}

                        {method === 'jazzcash' && (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold">Service</p>
                                    <div className="flex items-center gap-2">
                                        <Smartphone className="text-red-500" size={20} />
                                        <p className="text-white font-bold text-lg">JazzCash Mobile Account</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold">Mobile Number</p>
                                    <div className="flex items-center justify-between mt-1 bg-black/30 p-3 rounded-lg border border-slate-600/50">
                                        <p className="text-xl text-white font-mono tracking-wider">{ADMIN_PAYMENT_INFO.JAZZCASH.number}</p>
                                        <button 
                                            onClick={() => handleCopy(ADMIN_PAYMENT_INFO.JAZZCASH.number, 'mobile')}
                                            className="text-slate-400 hover:text-white transition-colors"
                                        >
                                            {copiedField === 'mobile' ? <Check size={18} className="text-green-500"/> : <Copy size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold">Account Title</p>
                                    <p className="text-white font-medium">{ADMIN_PAYMENT_INFO.JAZZCASH.title}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Section 2: User Details Form */}
                <div className="space-y-6">
                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                        <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                        Enter Your Details
                    </h3>
                    
                    <div className="bg-surface rounded-2xl border border-slate-700 p-6 space-y-4 shadow-xl">
                        {method === 'bank' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Your Bank Name</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-primary placeholder-slate-600 transition-all"
                                        placeholder="e.g. Meezan Bank, HBL"
                                        value={senderBankName}
                                        onChange={(e) => setSenderBankName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Your Account Number / IBAN</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-primary placeholder-slate-600 transition-all"
                                        placeholder="Account used for sending"
                                        value={senderAccountNumber}
                                        onChange={(e) => setSenderAccountNumber(e.target.value)}
                                    />
                                </div>
                            </>
                        )}
                        
                        {method === 'jazzcash' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Your JazzCash Mobile Number</label>
                                <input 
                                    type="text"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-primary placeholder-slate-600 transition-all"
                                    placeholder="03XX-XXXXXXX"
                                    value={senderAccountNumber}
                                    onChange={(e) => setSenderAccountNumber(e.target.value)}
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Sender Name (Account Title)</label>
                            <input 
                                type="text"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-primary placeholder-slate-600 transition-all"
                                placeholder="Name on your account"
                                value={senderName}
                                onChange={(e) => setSenderName(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Transaction ID (Optional)</label>
                            <input 
                                type="text"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-primary placeholder-slate-600 transition-all"
                                placeholder="Paste TID if available"
                                value={transactionId}
                                onChange={(e) => setTransactionId(e.target.value)}
                            />
                        </div>

                        <Button 
                            onClick={handleSubmit} 
                            isLoading={isSubmitting} 
                            className="w-full py-4 text-lg font-bold bg-green-600 hover:bg-green-700 shadow-lg shadow-green-900/20 mt-4"
                        >
                            {isSubmitting ? (
                                <>Processing...</>
                            ) : (
                                <><CheckCircle size={20} /> Pay & Activate Now</>
                            )}
                        </Button>
                        <p className="text-[10px] text-center text-slate-500">
                            By clicking Pay, you confirm you have transferred the funds.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Payment;
