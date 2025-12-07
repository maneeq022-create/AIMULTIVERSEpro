
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { MockBackend } from '../services/mockBackend';
import { Zap, UserPlus, LogIn, User } from 'lucide-react';

const Welcome: React.FC = () => {
  const navigate = useNavigate();

  const handleGuestLogin = () => {
    MockBackend.loginAsGuest();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-darker relative overflow-hidden px-4">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
         <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px]" />
      </div>

      <div className="z-10 w-full max-w-md space-y-8 text-center">
        <div className="flex flex-col items-center gap-3 mb-8 animate-fade-in-up">
            <div className="bg-gradient-to-br from-primary to-purple-600 p-4 rounded-2xl shadow-2xl shadow-primary/30">
                <Zap size={48} className="text-white fill-white" />
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">AI Multiverse Pro</h1>
            <p className="text-slate-400 text-lg">Your all-in-one AI creative studio.</p>
        </div>

        <div className="space-y-4 animate-fade-in-up delay-100">
             <Button 
                onClick={handleGuestLogin}
                className="w-full py-4 text-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200"
             >
                <User className="mr-2" size={20} />
                Sign in as Guest
             </Button>

             <div className="grid grid-cols-2 gap-4">
                <Link to="/signup">
                    <Button className="w-full py-4 bg-primary hover:bg-indigo-500">
                        <UserPlus className="mr-2" size={20} />
                        Sign Up
                    </Button>
                </Link>
                <Link to="/login">
                    <Button variant="secondary" className="w-full py-4">
                        <LogIn className="mr-2" size={20} />
                        Sign In
                    </Button>
                </Link>
             </div>
        </div>

        <p className="text-slate-500 text-xs mt-8">
            By continuing, you agree to our Terms of Service.
        </p>
      </div>
    </div>
  );
};

export default Welcome;
