
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Mic, 
  Languages, 
  Speaker, 
  Video, 
  MessageSquare, 
  FileText, 
  CreditCard, 
  User, 
  Menu, 
  X,
  Zap,
  Shield,
  LogOut,
  LogIn,
  Image,
  AlertOctagon,
  LifeBuoy,
  Radio,
  BookOpen,
  FolderOpen,
  Key,
  AlertTriangle,
  Copy
} from 'lucide-react';
import { MockBackend } from '../services/mockBackend';
import { isApiConfigured } from '../services/geminiService';
import { User as UserType } from '../types';
import Button from './Button';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [showApiInstructionModal, setShowApiInstructionModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthPage = ['/welcome', '/login', '/signup'].includes(location.pathname);
  const apiConfigured = isApiConfigured();

  useEffect(() => {
    // Poll for user updates
    const interval = setInterval(() => {
      setUser(MockBackend.getCurrentUser());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Features Guide', icon: BookOpen, path: '/guide' },
    { name: 'My Creations', icon: FolderOpen, path: '/creations' },
    { name: 'AI Chatbot', icon: MessageSquare, path: '/chatbot' },
    { name: 'Live Studio', icon: Radio, path: '/live' },
    { name: 'Text to Image', icon: Image, path: '/text-to-image' },
    { name: 'Veo Video', icon: Video, path: '/image-to-video' },
    { name: 'Voice Clone', icon: Mic, path: '/voice-clone' },
    { name: 'Translator', icon: Languages, path: '/translator' },
    { name: 'Text to Speech', icon: Speaker, path: '/tts' },
    { name: 'Document AI', icon: FileText, path: '/doc-ai' },
    { name: 'Pricing', icon: CreditCard, path: '/pricing' },
    // Conditional Item: Admin gets Support Dashboard, Users get Report Issue
    ...(user?.is_admin ? [
        { name: 'Complaint & Support', icon: LifeBuoy, path: '/admin', state: { defaultTab: 'complaints' } }
    ] : [
        { name: 'Report Issue', icon: AlertOctagon, path: '/report' }
    ]),
    { name: 'Profile', icon: User, path: '/profile' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('ai_multiverse_current_user_id');
    window.location.href = '/welcome'; 
  };

  if (isAuthPage) {
    return <main className="min-h-screen bg-darker">{children}</main>;
  }

  return (
    <div className="min-h-screen bg-darker text-slate-100 flex font-sans">
      
      {/* API Key Missing Banner - Persistent */}
      {!apiConfigured && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-yellow-600 text-white px-4 py-2 flex items-center justify-center gap-4 shadow-xl">
           <div className="flex items-center gap-2">
               <AlertTriangle size={18} className="fill-white text-yellow-700" />
               <span className="font-bold text-sm">API Key Missing!</span>
               <span className="text-xs hidden sm:inline">AI features will not work until you configure it.</span>
           </div>
           <button 
             onClick={() => setShowApiInstructionModal(true)}
             className="bg-white text-yellow-700 px-3 py-1 rounded text-xs font-bold hover:bg-slate-100 transition-colors"
           >
             How to Fix
           </button>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-surface border-r border-slate-700/50 
        transform transition-transform duration-300 ease-in-out
        flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${!apiConfigured ? 'mt-10 md:mt-0' : ''} /* Push down if banner exists on mobile */
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
            <Zap className="h-6 w-6 fill-primary" />
            AI Multiverse
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400">
            <X size={24} />
          </button>
        </div>

        <nav className="px-3 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                state={(item as any).state}
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-primary/10 text-primary border border-primary/20' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/50'}
                `}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
          
          {user?.is_admin && (
             <Link
                to="/admin"
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-red-400 hover:bg-red-500/10 mt-4 border border-red-500/20
                `}
              >
                <Shield size={20} />
                <span className="font-bold">Admin Panel</span>
              </Link>
          )}
        </nav>

        {/* Auth Button */}
        <div className="px-4 pb-2">
           {user ? (
               <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-700/50 hover:text-white transition-all">
                   <LogOut size={20} />
                   <span className="font-medium">Logout</span>
               </button>
           ) : (
               <Link to="/login" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-700/50 hover:text-white transition-all">
                   <LogIn size={20} />
                   <span className="font-medium">Login</span>
               </Link>
           )}
        </div>

        {/* Credits Widget */}
        {user && (
          <div className="p-4 mx-4 mb-6 rounded-xl bg-slate-900 border border-slate-700">
            <p className="text-xs text-slate-400 mb-1">Available Credits</p>
            <div className="flex items-end justify-between">
              <span className={`text-xl font-bold ${user?.credits === 'unlimited' ? 'text-green-400' : 'text-white'}`}>
                {user?.credits === 'unlimited' ? '∞ Unlimited' : user?.credits?.toLocaleString()}
              </span>
            </div>
            {user?.plan_type === 'free' && (
              <Link to="/pricing" className="mt-3 block text-center text-xs font-semibold text-dark bg-primary rounded py-1.5 hover:bg-indigo-500 transition-colors">
                Upgrade Plan
              </Link>
            )}
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-h-screen overflow-hidden ${!apiConfigured ? 'mt-10' : ''}`}>
        {/* Header */}
        <header className="h-16 border-b border-slate-700/50 bg-darker/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-2 text-slate-400 hover:text-white"
          >
            <Menu size={24} />
          </button>
          
          <div className="ml-auto flex items-center gap-4">
             {user && (
               <>
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-slate-400 capitalize">{user?.plan_type.replace(/_/g, ' ')} Plan</p>
                </div>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ${user?.is_admin ? 'bg-red-500' : 'bg-gradient-to-br from-primary to-purple-600'}`}>
                  {user?.is_admin ? <Shield size={18}/> : user?.name.charAt(0)}
                </div>
               </>
             )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </main>
      </div>

      {/* API Instruction Modal */}
      {showApiInstructionModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
            <div className="bg-surface border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">
                <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-900/50 rounded-t-2xl">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Key size={18} className="text-yellow-500" />
                        Setup API Key
                    </h3>
                    <button onClick={() => setShowApiInstructionModal(false)} className="text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-6">
                    <p className="text-sm text-slate-300">
                        To enable AI features, you must add your Google Gemini API Key to the environment variables.
                    </p>
                    
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <div className="h-6 w-6 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">1</div>
                            <div>
                                <p className="text-sm text-white font-medium">Create Environment File</p>
                                <p className="text-xs text-slate-400 mt-1">In your project root (where package.json is), create a new file named <code className="bg-slate-800 px-1 rounded text-yellow-400">.env</code></p>
                            </div>
                        </div>
                        
                        <div className="flex gap-3">
                            <div className="h-6 w-6 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">2</div>
                            <div className="w-full">
                                <p className="text-sm text-white font-medium">Paste Your Key</p>
                                <p className="text-xs text-slate-400 mt-1 mb-2">Add this line to the file:</p>
                                <div className="bg-black/50 p-3 rounded-lg border border-slate-700 flex items-center justify-between">
                                    <code className="text-xs text-green-400 font-mono">API_KEY=AIzaSy...</code>
                                    <Copy size={14} className="text-slate-500" />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="h-6 w-6 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">3</div>
                            <div>
                                <p className="text-sm text-white font-medium">Restart App</p>
                                <p className="text-xs text-slate-400 mt-1">Stop the dev server and run <code>npm start</code> again.</p>
                            </div>
                        </div>
                    </div>

                    <Button onClick={() => setShowApiInstructionModal(false)} className="w-full">
                        I Understand
                    </Button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default Layout;
