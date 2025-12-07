
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MockBackend } from '../services/mockBackend';
import Button from '../components/Button';
import { Lock, Mail, ArrowLeft } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const result = MockBackend.login(email, password);
    
    if (result.success) {
      window.location.href = '/'; 
    } else {
      setError(result.message);
    }
  };

  const handleSocialLogin = (provider: 'google' | 'yahoo') => {
      MockBackend.socialLogin(provider);
      // Force reload to update Layout user state immediately
      window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
       <div className="absolute top-8 left-8">
           <Link to="/welcome" className="text-slate-400 hover:text-white flex items-center gap-2">
               <ArrowLeft size={20} /> Back
           </Link>
       </div>

      <div className="max-w-md w-full p-8 bg-surface rounded-2xl border border-slate-700 shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Welcome Back</h2>
        
        <div className="space-y-3 mb-6">
            <button 
                onClick={() => handleSocialLogin('google')}
                className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors"
            >
                <div className="w-5 h-5 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px]">G</div>
                Continue with Google
            </button>
            <button 
                onClick={() => handleSocialLogin('yahoo')}
                className="w-full flex items-center justify-center gap-3 bg-[#410093] text-white font-bold py-3 rounded-xl hover:bg-[#5000b0] transition-colors"
            >
                <div className="w-5 h-5 font-serif">Y!</div>
                Continue with Yahoo
            </button>
        </div>

        <div className="flex items-center gap-4 mb-6">
            <div className="h-px bg-slate-700 flex-1"></div>
            <span className="text-slate-500 text-sm">OR</span>
            <div className="h-px bg-slate-700 flex-1"></div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="email" 
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="password" 
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <Button type="submit" className="w-full py-3">
            Sign In with Email
          </Button>

          <div className="text-center mt-2">
              <Link to="/signup" className="text-primary text-sm hover:underline">Don't have an account? Sign Up</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
