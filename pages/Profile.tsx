
import React, { useEffect, useState } from 'react';
import { CreditCard, Settings, FileText, LogOut, MessageCircle, Send, File, Image, Music, Video, Trash2, Download, Shield, Play } from 'lucide-react';
import Button from '../components/Button';
import { MockBackend } from '../services/mockBackend';
import { User as UserType, PaymentRequest, SavedFile } from '../types';
import { Link, useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const [user, setUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'files'>('overview');
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [savedFiles, setSavedFiles] = useState<SavedFile[]>([]);
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const [complaintText, setComplaintText] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const u = MockBackend.getCurrentUser();
    setUser(u);
    if (u) {
        setPayments(MockBackend.getUserPayments(u.id));
        setSavedFiles(MockBackend.getSavedFiles(u.id));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('ai_multiverse_current_user_id');
    window.location.href = '/#/welcome';
    window.location.reload();
  };

  const handleDeleteData = () => {
      if(confirm("Are you sure? This will reset your simulated local account.")) {
          localStorage.clear();
          window.location.reload();
      }
  };

  const handleDeleteFile = (id: string) => {
      if(confirm("Delete this saved file?")) {
          MockBackend.deleteSavedFile(id);
          setSavedFiles(prev => prev.filter(f => f.id !== id));
      }
  };

  const submitComplaint = () => {
      if(!user || !complaintText.trim()) return;
      MockBackend.submitComplaint(user.id, complaintText, 'issue'); // Default to issue for profile report
      alert("Report submitted. Admin will review it.");
      setComplaintText('');
      setIsComplaintOpen(false);
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 relative pb-12">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Profile & Settings</h1>
        <Button variant="danger" onClick={handleLogout} className="text-sm py-2 px-4 shadow-none">
            <LogOut size={16} /> Logout
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 overflow-x-auto">
        <button 
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-white'}`}
        >
            Account Overview
        </button>
        <button 
            onClick={() => setActiveTab('payments')}
            className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'payments' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-white'}`}
        >
            Payment History
        </button>
        <button 
            onClick={() => setActiveTab('files')}
            className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'files' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-white'}`}
        >
            Saved Files
        </button>
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
              {/* User Card */}
              <div className="bg-surface rounded-2xl p-6 border border-slate-700 flex flex-col md:flex-row items-center gap-6">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-primary/20">
                    {user.name.charAt(0)}
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                    <p className="text-slate-400">{user.email}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
                        <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-600 text-xs font-medium text-slate-300 capitalize">
                            {user.plan_type.replace(/_/g, ' ')}
                        </span>
                        {user.is_admin && (
                            <span className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500/50 text-xs font-medium text-red-400">
                                Administrator
                            </span>
                        )}
                    </div>
                </div>
              </div>

              {/* Subscription */}
              <div className="bg-surface rounded-2xl border border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CreditCard className="text-primary" size={20} />
                        <h3 className="font-bold text-white">Subscription Details</h3>
                    </div>
                    <button 
                        onClick={() => setIsComplaintOpen(true)}
                        className="text-xs flex items-center gap-2 bg-red-500/10 text-red-400 px-3 py-1 rounded hover:bg-red-500/20 transition-colors"
                    >
                        <MessageCircle size={14} /> Report Issue
                    </button>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-slate-400 text-sm mb-1">Current Plan</p>
                        <p className="text-lg font-medium text-white capitalize">{user.plan_type.replace(/_/g, ' ')}</p>
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm mb-1">Credits Available</p>
                        <p className="text-lg font-medium text-green-400">
                            {user.credits === 'unlimited' ? '∞ Unlimited' : user.credits.toLocaleString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm mb-1">Next Reset / Expiry</p>
                        <p className="text-slate-200">
                            {user.plan_expiry_date 
                                ? new Date(user.plan_expiry_date).toLocaleDateString() 
                                : new Date(user.free_reset_date).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="flex items-end">
                        <Link to="/pricing">
                            <Button variant="secondary" className="w-full">Manage Plan</Button>
                        </Link>
                    </div>
                </div>
              </div>

              {/* Settings & Links */}
              <div className="bg-surface rounded-2xl border border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex items-center gap-3">
                    <Settings className="text-slate-400" size={20} />
                    <h3 className="font-bold text-white">App Settings & Legal</h3>
                </div>
                <div className="divide-y divide-slate-700">
                    <Link to="/terms" className="flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors">
                        <div className="flex items-center gap-3 text-slate-300">
                            <Shield size={18} />
                            <span>Privacy Policy</span>
                        </div>
                        <span className="text-slate-500">&rarr;</span>
                    </Link>
                    <Link to="/terms" className="flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors">
                        <div className="flex items-center gap-3 text-slate-300">
                            <FileText size={18} />
                            <span>Terms of Service</span>
                        </div>
                        <span className="text-slate-500">&rarr;</span>
                    </Link>
                    
                    <div className="p-4 bg-red-500/5">
                        <h4 className="text-red-400 text-sm font-bold mb-2">Danger Zone</h4>
                        <div className="flex items-center justify-between">
                            <p className="text-slate-500 text-sm">Reset local account data simulation.</p>
                            <Button variant="danger" onClick={handleDeleteData} className="py-1 px-3 text-xs">Reset Data</Button>
                        </div>
                    </div>
                </div>
              </div>
          </div>
      )}

      {/* TAB CONTENT: PAYMENTS */}
      {activeTab === 'payments' && (
          <div className="bg-surface rounded-2xl border border-slate-700/50 overflow-hidden animate-fade-in">
              <div className="p-4 border-b border-slate-700 bg-slate-900/50">
                  <h3 className="font-bold text-white">Transaction History</h3>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead className="bg-slate-900 text-slate-400 text-xs uppercase font-medium">
                          <tr>
                              <th className="px-6 py-4">Date</th>
                              <th className="px-6 py-4">Plan / Item</th>
                              <th className="px-6 py-4">Amount</th>
                              <th className="px-6 py-4">Method</th>
                              <th className="px-6 py-4">Status</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                          {payments.length === 0 ? (
                              <tr>
                                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                      No payment history found.
                                  </td>
                              </tr>
                          ) : (
                              payments.map((pay) => (
                                  <tr key={pay.id} className="text-sm hover:bg-slate-700/20">
                                      <td className="px-6 py-4 text-slate-300">{new Date(pay.timestamp).toLocaleDateString()}</td>
                                      <td className="px-6 py-4 text-white capitalize">{pay.plan_type.replace(/_/g, ' ')}</td>
                                      <td className="px-6 py-4 text-white font-mono">${pay.amount.toLocaleString()}</td>
                                      <td className="px-6 py-4 text-slate-400 capitalize">{pay.method}</td>
                                      <td className="px-6 py-4">
                                          <span className={`text-xs px-2 py-1 rounded font-bold capitalize ${
                                              pay.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                              pay.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                              'bg-yellow-500/20 text-yellow-400'
                                          }`}>
                                              {pay.status}
                                          </span>
                                      </td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* TAB CONTENT: SAVED FILES */}
      {activeTab === 'files' && (
          <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center bg-surface p-4 rounded-xl border border-slate-700">
                  <div>
                      <h3 className="font-bold text-white">Saved Files</h3>
                      <p className="text-xs text-slate-400">Access your generated assets</p>
                  </div>
                  <span className="text-xs text-slate-500">{savedFiles.length} files</span>
              </div>

              {savedFiles.length === 0 ? (
                  <div className="text-center py-16 bg-surface rounded-2xl border border-slate-700 border-dashed">
                      <File className="mx-auto h-12 w-12 text-slate-600 mb-4" />
                      <p className="text-slate-400">No saved files yet.</p>
                      <Link to="/" className="text-primary text-sm hover:underline mt-2 inline-block">Start creating assets</Link>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {savedFiles.map((file) => (
                          <div key={file.id} className="bg-surface rounded-xl border border-slate-700 overflow-hidden group hover:border-slate-500 transition-all flex flex-col">
                              {/* Preview Area */}
                              <div className="relative overflow-hidden bg-slate-900 flex-1 min-h-[160px] flex items-center justify-center">
                                  {file.type === 'image' && <img src={file.url} alt={file.name} className="w-full h-full object-cover" />}
                                  {file.type === 'video' && (
                                      <div className="flex flex-col items-center">
                                          <Video className="h-10 w-10 text-slate-500 mb-2" />
                                          <span className="text-xs text-slate-500">Video File</span>
                                      </div>
                                  )}
                                  {file.type === 'audio' && (
                                      <div className="w-full px-4 flex flex-col items-center justify-center h-full bg-slate-800">
                                          <Music className="h-8 w-8 text-primary mb-2 opacity-50" />
                                          <audio controls src={file.url} className="w-full h-8 mt-2" />
                                      </div>
                                  )}
                                  {file.type === 'document' && <FileText className="h-12 w-12 text-slate-500" />}
                                  
                                  {file.type !== 'audio' && (
                                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
                                          {/* Overlay actions if needed */}
                                      </div>
                                  )}
                              </div>
                              
                              {/* Meta Info */}
                              <div className="p-4 border-t border-slate-700 bg-surface z-10">
                                  <div className="flex justify-between items-start mb-2">
                                      <div className="overflow-hidden">
                                          <h4 className="font-bold text-white text-sm truncate" title={file.name}>{file.name}</h4>
                                          <p className="text-xs text-slate-500 capitalize">{file.type} • {new Date(file.created_at).toLocaleDateString()}</p>
                                      </div>
                                      <div className="flex gap-2">
                                          <a href={file.url} download className="text-slate-500 hover:text-green-400 transition-colors" title="Download">
                                              <Download size={16} />
                                          </a>
                                          <button 
                                            onClick={() => handleDeleteFile(file.id)}
                                            className="text-slate-500 hover:text-red-400 transition-colors"
                                            title="Delete"
                                          >
                                              <Trash2 size={16} />
                                          </button>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      )}

      {/* Complaint Modal */}
      {isComplaintOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-surface border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                  <h3 className="text-xl font-bold text-white mb-4">Report Plan Issue</h3>
                  <textarea 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-primary h-32 resize-none mb-4"
                    placeholder="Describe your issue regarding your current plan..."
                    value={complaintText}
                    onChange={(e) => setComplaintText(e.target.value)}
                  />
                  <div className="flex justify-end gap-3">
                      <Button variant="ghost" onClick={() => setIsComplaintOpen(false)}>Cancel</Button>
                      <Button onClick={submitComplaint}>
                          <Send size={16} /> Submit
                      </Button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Profile;
