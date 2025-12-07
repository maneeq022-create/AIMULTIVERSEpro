
import React, { useEffect, useState } from 'react';
import { MockBackend } from '../services/mockBackend';
import { User, UsageHistory } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Mic, Languages, Video, ArrowRight, Speaker } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<UsageHistory[]>([]);

  useEffect(() => {
    const u = MockBackend.getCurrentUser();
    setUser(u);
    if (u) {
        setHistory(MockBackend.getHistory(u.id));
    }
  }, []); 

  // Protected by App.tsx, but good for safety
  if (!user) {
      const currentUser = MockBackend.getCurrentUser();
      if (!currentUser) return <Navigate to="/welcome" />;
      // Wait for state sync or render loading
      return null;
  }

  const chartData = history.reduce((acc: any[], curr) => {
    const existing = acc.find(item => item.name === curr.action_type);
    if (existing) {
      existing.usage += 1;
    } else {
      acc.push({ name: curr.action_type, usage: 1 });
    }
    return acc;
  }, []);

  const stats = [
    { label: 'Credits Left', value: user?.credits === 'unlimited' ? '∞' : user?.credits.toLocaleString(), color: 'text-primary' },
    { label: 'Plan Status', value: user?.plan_type === 'free' ? 'Free' : 'Premium', color: 'text-green-400' },
    { label: 'Total Actions', value: history.length, color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-surface p-6 rounded-2xl border border-slate-700/50 shadow-lg">
            <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
            <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link to="/voice-clone" className="group p-4 bg-surface hover:bg-slate-700/50 rounded-xl border border-slate-700 transition-all cursor-pointer">
                    <div className="h-10 w-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary mb-3 group-hover:scale-110 transition-transform">
                        <Mic size={20} />
                    </div>
                    <h3 className="font-semibold text-white">Clone Voice</h3>
                    <p className="text-sm text-slate-400 mt-1">Create realistic AI voices</p>
                </Link>
                <Link to="/translator" className="group p-4 bg-surface hover:bg-slate-700/50 rounded-xl border border-slate-700 transition-all cursor-pointer">
                    <div className="h-10 w-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400 mb-3 group-hover:scale-110 transition-transform">
                        <Languages size={20} />
                    </div>
                    <h3 className="font-semibold text-white">Translate</h3>
                    <p className="text-sm text-slate-400 mt-1">Multi-language support</p>
                </Link>
                <Link to="/tts" className="group p-4 bg-surface hover:bg-slate-700/50 rounded-xl border border-slate-700 transition-all cursor-pointer">
                    <div className="h-10 w-10 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-110 transition-transform">
                        <Speaker size={20} />
                    </div>
                    <h3 className="font-semibold text-white">Text to Speech</h3>
                    <p className="text-sm text-slate-400 mt-1">Lifelike AI narration</p>
                </Link>
                <Link to="/image-to-video" className="group p-4 bg-surface hover:bg-slate-700/50 rounded-xl border border-slate-700 transition-all cursor-pointer">
                    <div className="h-10 w-10 bg-pink-500/20 rounded-lg flex items-center justify-center text-pink-400 mb-3 group-hover:scale-110 transition-transform">
                        <Video size={20} />
                    </div>
                    <h3 className="font-semibold text-white">Image to Video</h3>
                    <p className="text-sm text-slate-400 mt-1">Animate your static images</p>
                </Link>
            </div>
        </div>

        {/* Chart with Fix */}
        <div className="bg-surface p-6 rounded-2xl border border-slate-700/50 shadow-lg flex flex-col">
            <h2 className="text-xl font-bold text-white mb-6">Usage Activity</h2>
            <div className="flex-1 w-full min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                            itemStyle={{ color: '#818cf8' }}
                        />
                        <Bar dataKey="usage" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* Recent History */}
      <div className="bg-surface rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="p-6 border-b border-slate-700/50">
            <h2 className="text-xl font-bold text-white">Recent History</h2>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-medium">
                    <tr>
                        <th className="px-6 py-4">Action</th>
                        <th className="px-6 py-4">Cost</th>
                        <th className="px-6 py-4">Time</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                    {history.slice(0, 5).map((item) => (
                        <tr key={item.id} className="text-sm hover:bg-slate-700/20 transition-colors">
                            <td className="px-6 py-4 font-medium text-white">{item.action_type}</td>
                            <td className="px-6 py-4 text-red-400">-{item.credits_deducted}</td>
                            <td className="px-6 py-4 text-slate-400">{new Date(item.timestamp).toLocaleDateString()}</td>
                        </tr>
                    ))}
                    {history.length === 0 && (
                        <tr>
                            <td colSpan={3} className="px-6 py-8 text-center text-slate-500">No activity yet. Start creating!</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
