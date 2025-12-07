
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MockBackend } from '../services/mockBackend';
import Button from '../components/Button';
import { Lock, Mail, User, ArrowLeft } from 'lucide-react';

const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const result = MockBackend.register(name, email, password);
    
    if (result.success) {
      window.location.href = '/'; 
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
       <div className="absolute top-8 left-8">
           <Link to="/welcome" className="text-slate-400 hover:text-white flex items-center gap-2">
               <ArrowLeft size={20} /> Back
           </Link>
       </div>

      <div className="max-w-md w-full p-8 bg-surface rounded-2xl border border-slate-700 shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-2 text-center">Create Account</h2>
        <p className="text-slate-400 text-center mb-8">Join AI Multiverse today</p>
        
        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

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

          <Button type="submit" className="w-full py-3 text-lg">
            Create Account
          </Button>

          <div className="text-center mt-4">
              <Link to="/login" className="text-primary text-sm hover:underline">Already have an account? Sign In</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
