
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
  Radio
} from 'lucide-react';
import { MockBackend } from '../services/mockBackend';
import { User as UserType } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthPage = ['/welcome', '/login', '/signup'].includes(location.pathname);

  useEffect(() => {
    // Poll for user updates
    const interval = setInterval(() => {
      setUser(MockBackend.getCurrentUser());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
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
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
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
    </div>
  );
};

export default Layout;
