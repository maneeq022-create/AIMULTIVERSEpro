
import React, { useEffect, useState } from 'react';
import { MockBackend } from '../services/mockBackend';
import { User, Complaint, PLAN_DETAILS, PlanType, UsageHistory, PaymentRequest } from '../types';
import Button from '../components/Button';
import { Shield, Users, Ban, CheckCircle, MessageSquare, CornerDownRight, History, X, CreditCard, DollarSign, Lightbulb, AlertOctagon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'complaints' | 'billing'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [replyText, setReplyText] = useState<{[key: string]: string}>({});
  const [selectedUserHistory, setSelectedUserHistory] = useState<UsageHistory[] | null>(null);
  
  // Filters
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'issue' | 'suggestion'>('all');

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const user = MockBackend.getCurrentUser();
    setCurrentUser(user);
    if (!user.is_admin) {
        navigate('/');
        return;
    }
    refreshData();

    // Check if we need to default to a specific tab from navigation state
    if (location.state && (location.state as any).defaultTab) {
        setActiveTab((location.state as any).defaultTab);
    }
  }, [location]);

  const refreshData = () => {
      setUsers(MockBackend.getAllUsers());
      setComplaints(MockBackend.getAllComplaints());
      setPaymentRequests(MockBackend.getPaymentRequests());
  };

  const handleToggleBan = (userId: string, currentStatus: boolean | undefined) => {
    if (userId === currentUser?.id) return; 
    MockBackend.toggleBanUser(userId, !currentStatus);
    refreshData();
  };

  const handleViewHistory = (userId: string) => {
      const history = MockBackend.getHistory(userId);
      setSelectedUserHistory(history);
  };

  const handleReply = (complaintId: string) => {
      const text = replyText[complaintId];
      if (!text) return;
      MockBackend.replyToComplaint(complaintId, text);
      setReplyText(prev => ({...prev, [complaintId]: ''}));
      alert("Reply sent.");
      refreshData();
  };

  const handleApprovePayment = (reqId: string) => {
      if (confirm("Verify payment received and upgrade user plan?")) {
          MockBackend.approvePaymentRequest(reqId);
          alert("Payment Approved. User Plan Upgraded.");
          refreshData();
      }
  };

  const handleRejectPayment = (reqId: string) => {
      if (confirm("Reject this payment request?")) {
          MockBackend.rejectPaymentRequest(reqId);
          refreshData();
      }
  };

  const stats = [
    { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-400' },
    { label: 'Pending Issues', value: complaints.filter(c => c.status === 'pending').length, icon: MessageSquare, color: 'text-yellow-400' },
    { label: 'Pending Payments', value: paymentRequests.filter(p => p.status === 'pending').length, icon: DollarSign, color: 'text-green-400' },
  ];

  const planTypes = Object.keys(PLAN_DETAILS);
  
  const filteredComplaints = complaints.filter(c => {
      const matchesPlan = selectedPlanFilter === 'all' || c.plan_type === selectedPlanFilter;
      const matchesType = selectedTypeFilter === 'all' || c.type === selectedTypeFilter || (!c.type && selectedTypeFilter === 'issue'); // Default old to issue
      return matchesPlan && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 relative">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-red-500/20 rounded-xl">
            <Shield className="h-8 w-8 text-red-500" />
        </div>
        <div>
            <h1 className="text-3xl font-bold text-white">Admin Control Panel</h1>
            <p className="text-slate-400">Manage users, billing, and permissions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-surface p-6 rounded-2xl border border-slate-700/50">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
                    <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 opacity-50 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 border-b border-slate-700 pb-1 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'users' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-white'}`}
          >
              User Management
          </button>
          <button 
            onClick={() => setActiveTab('billing')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'billing' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-white'}`}
          >
              Billing & Requests
          </button>
          <button 
            onClick={() => setActiveTab('complaints')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'complaints' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-white'}`}
          >
              Issues & Suggestions
          </button>
      </div>

      {activeTab === 'users' && (
        <div className="bg-surface rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-medium">
                        <tr>
                            <th className="px-6 py-4">Name / Email</th>
                            <th className="px-6 py-4">Plan</th>
                            <th className="px-6 py-4">Credits</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {users.map((user) => (
                            <tr key={user.id} className="text-sm hover:bg-slate-700/20 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-white">{user.name} {user.is_admin && <span className="bg-red-500 text-white text-[10px] px-1 rounded ml-2">ADMIN</span>}</div>
                                    <div className="text-slate-400 text-xs">{user.email}</div>
                                </td>
                                <td className="px-6 py-4 capitalize text-white">{user.plan_type.replace(/_/g, ' ')}</td>
                                <td className="px-6 py-4 text-primary font-mono">
                                    {user.credits === 'unlimited' ? '∞' : user.credits.toLocaleString()}
                                </td>
                                <td className="px-6 py-4">
                                    {user.is_banned ? (
                                        <span className="text-red-400 font-bold flex items-center gap-1"><Ban size={14}/> Banned</span>
                                    ) : (
                                        <span className="text-green-400 font-bold flex items-center gap-1"><CheckCircle size={14}/> Active</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 flex gap-2">
                                    <Button 
                                        variant="secondary"
                                        onClick={() => handleViewHistory(user.id)}
                                        className="py-1 px-3 text-xs"
                                    >
                                        <History size={12} className="mr-1" /> History
                                    </Button>
                                    {!user.is_admin && (
                                        <Button 
                                            variant={user.is_banned ? 'primary' : 'danger'}
                                            onClick={() => handleToggleBan(user.id, user.is_banned)}
                                            className="py-1 px-3 text-xs"
                                        >
                                            {user.is_banned ? 'Unban' : 'Ban'}
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {activeTab === 'billing' && (
          <div className="bg-surface rounded-2xl border border-slate-700/50 overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-medium">
                          <tr>
                              <th className="px-6 py-4">User</th>
                              <th className="px-6 py-4">Plan / Amount</th>
                              <th className="px-6 py-4">Method</th>
                              <th className="px-6 py-4">Details</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                          {paymentRequests.length === 0 ? (
                              <tr>
                                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No payment requests found.</td>
                              </tr>
                          ) : (
                              paymentRequests.map((req) => (
                                  <tr key={req.id} className="text-sm hover:bg-slate-700/20 transition-colors">
                                      <td className="px-6 py-4">
                                          <div className="font-medium text-white">{req.user_name}</div>
                                          <div className="text-xs text-slate-500">{new Date(req.timestamp).toLocaleDateString()}</div>
                                      </td>
                                      <td className="px-6 py-4">
                                          <div className="text-white capitalize">{req.plan_type.replace(/_/g, ' ')}</div>
                                          <div className="text-primary font-bold">${req.amount.toLocaleString()}</div>
                                      </td>
                                      <td className="px-6 py-4 capitalize text-slate-300">
                                          <span className="px-2 py-1 rounded bg-slate-800 border border-slate-600 text-xs">
                                              {req.method}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4">
                                          <div className="text-xs text-slate-400">TID: <span className="text-white font-mono">{req.transaction_id}</span></div>
                                          <div className="text-xs text-slate-400">Sender: <span className="text-white">{req.sender_name}</span></div>
                                      </td>
                                      <td className="px-6 py-4">
                                          <span className={`text-xs px-2 py-1 rounded font-bold capitalize ${
                                              req.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                              req.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                              'bg-yellow-500/20 text-yellow-400'
                                          }`}>
                                              {req.status}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 flex gap-2">
                                          {req.status === 'pending' && (
                                              <>
                                                  <Button onClick={() => handleApprovePayment(req.id)} className="py-1 px-3 text-xs bg-green-600 hover:bg-green-700">
                                                      Approve
                                                  </Button>
                                                  <Button onClick={() => handleRejectPayment(req.id)} variant="danger" className="py-1 px-3 text-xs">
                                                      Reject
                                                  </Button>
                                              </>
                                          )}
                                      </td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {activeTab === 'complaints' && (
          <div className="space-y-6">
              {/* Type Filter */}
              <div className="flex justify-between items-center">
                   <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                        <button 
                            onClick={() => setSelectedTypeFilter('all')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedTypeFilter === 'all' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                            All
                        </button>
                        <button 
                            onClick={() => setSelectedTypeFilter('issue')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${selectedTypeFilter === 'issue' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-slate-400 hover:text-white'}`}
                        >
                            <AlertOctagon size={14}/> Issues
                        </button>
                        <button 
                            onClick={() => setSelectedTypeFilter('suggestion')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${selectedTypeFilter === 'suggestion' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Lightbulb size={14}/> Suggestions
                        </button>
                   </div>
              </div>

              {/* Plan Filter */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                  <button 
                    onClick={() => setSelectedPlanFilter('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border ${selectedPlanFilter === 'all' ? 'bg-primary text-white border-primary' : 'bg-surface text-slate-400 border-slate-700'}`}
                  >
                      All Plans
                  </button>
                  {planTypes.map(plan => (
                      <button 
                        key={plan}
                        onClick={() => setSelectedPlanFilter(plan)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border capitalize ${selectedPlanFilter === plan ? 'bg-primary text-white border-primary' : 'bg-surface text-slate-400 border-slate-700'}`}
                      >
                          {plan.replace(/_/g, ' ')}
                      </button>
                  ))}
              </div>

              <div className="space-y-4">
                  {filteredComplaints.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 bg-surface rounded-2xl border border-slate-700">
                          No items found for this selection.
                      </div>
                  ) : (
                      filteredComplaints.map(complaint => (
                          <div key={complaint.id} className={`bg-surface rounded-2xl border p-6 ${complaint.type === 'suggestion' ? 'border-green-500/20' : 'border-red-500/20'}`}>
                              <div className="flex justify-between items-start mb-4">
                                  <div>
                                      <div className="flex items-center gap-2 mb-1">
                                          {complaint.type === 'suggestion' ? (
                                              <span className="bg-green-500/10 text-green-400 text-xs font-bold px-2 py-0.5 rounded border border-green-500/20 flex items-center gap-1">
                                                  <Lightbulb size={10} /> SUGGESTION
                                              </span>
                                          ) : (
                                               <span className="bg-red-500/10 text-red-400 text-xs font-bold px-2 py-0.5 rounded border border-red-500/20 flex items-center gap-1">
                                                  <AlertOctagon size={10} /> ISSUE
                                              </span>
                                          )}
                                          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 capitalize">{complaint.plan_type.replace(/_/g, ' ')}</span>
                                      </div>
                                      <h3 className="font-bold text-white text-lg">{complaint.user_name}</h3>
                                      <p className="text-sm text-slate-500">{complaint.user_email}</p>
                                  </div>
                                  <span className={`text-xs px-2 py-1 rounded font-bold ${complaint.status === 'resolved' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                      {complaint.status.toUpperCase()}
                                  </span>
                              </div>
                              
                              <div className="bg-slate-900/50 p-4 rounded-xl text-slate-200 mb-4">
                                  "{complaint.message}"
                              </div>

                              {complaint.reply ? (
                                  <div className="ml-8 bg-primary/10 border border-primary/20 p-4 rounded-xl text-slate-300 relative">
                                      <CornerDownRight className="absolute -left-6 top-4 text-slate-500" size={20} />
                                      <p className="text-xs font-bold text-primary mb-1">Admin Reply:</p>
                                      {complaint.reply}
                                  </div>
                              ) : (
                                  <div className="flex gap-2 mt-4">
                                      <input 
                                        type="text" 
                                        placeholder="Type your reply here..."
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
                                        value={replyText[complaint.id] || ''}
                                        onChange={(e) => setReplyText({...replyText, [complaint.id]: e.target.value})}
                                      />
                                      <Button onClick={() => handleReply(complaint.id)}>Reply</Button>
                                  </div>
                              )}
                          </div>
                      ))
                  )}
              </div>
          </div>
      )}

      {/* History Modal */}
      {selectedUserHistory && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-surface border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                  <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                      <h3 className="font-bold text-white text-lg">User Usage History</h3>
                      <button onClick={() => setSelectedUserHistory(null)} className="text-slate-400 hover:text-white">
                          <X size={24} />
                      </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    {selectedUserHistory.length === 0 ? (
                        <p className="text-center text-slate-500 py-8">No history found.</p>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-400 text-xs uppercase">
                                    <th className="pb-3">Action</th>
                                    <th className="pb-3">Cost</th>
                                    <th className="pb-3">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {selectedUserHistory.map((h) => (
                                    <tr key={h.id}>
                                        <td className="py-3 text-sm text-white">{h.action_type}</td>
                                        <td className="py-3 text-sm text-red-400">-{h.credits_deducted}</td>
                                        <td className="py-3 text-xs text-slate-500">{new Date(h.timestamp).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminPanel;
