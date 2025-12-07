
import { User, UsageHistory, PlanType, Complaint, PLAN_DETAILS, PaymentRequest, SavedFile } from '../types';

// --- Local Storage Keys ---
const USERS_KEY = 'ai_multiverse_users';
const CURRENT_USER_ID_KEY = 'ai_multiverse_current_user_id';
const HISTORY_KEY = 'ai_multiverse_history';
const COMPLAINTS_KEY = 'ai_multiverse_complaints';
const PAYMENTS_KEY = 'ai_multiverse_payments';
const SAVED_FILES_KEY = 'ai_multiverse_saved_files';

// --- Helper Functions ---

const getTodayISO = () => new Date().toISOString();
const addDays = (dateStr: string, days: number) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

const INITIAL_USER: User = {
  id: 'user_123',
  name: 'Demo User',
  email: 'demo@example.com',
  plan_type: 'free',
  credits: PLAN_DETAILS.free.credits,
  free_reset_date: addDays(new Date().toISOString(), 30),
  created_at: new Date().toISOString(),
  is_banned: false,
  chatbot_msg_count: 0
};

// --- Backend Logic ---

export const MockBackend = {
  // Initialize or Fetch User
  getCurrentUser: (): User | null => {
    let usersStr = localStorage.getItem(USERS_KEY);
    let users = usersStr ? JSON.parse(usersStr) : {};
    let currentUserId = localStorage.getItem(CURRENT_USER_ID_KEY);

    if (!currentUserId) {
       return null; 
    }

    let currentUser = users[currentUserId];

    // Fallback if ID exists but user data missing
    if (!currentUser) {
        localStorage.removeItem(CURRENT_USER_ID_KEY);
        return null;
    }

    // --- LOGIC: Free Plan Reset Rule ---
    const today = new Date();
    const resetDate = new Date(currentUser.free_reset_date);
    
    if (currentUser.plan_type === 'free' && today >= resetDate) {
      currentUser.credits = PLAN_DETAILS.free.credits;
      currentUser.free_reset_date = addDays(getTodayISO(), 30);
      users[currentUserId] = currentUser;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    // --- LOGIC: Plan Expiry Rule ---
    if (currentUser.plan_expiry_date) {
      const expiryDate = new Date(currentUser.plan_expiry_date);
      if (today > expiryDate) {
        currentUser.plan_type = 'free';
        currentUser.credits = PLAN_DETAILS.free.credits;
        currentUser.plan_expiry_date = undefined;
        currentUser.free_reset_date = addDays(getTodayISO(), 30);
        users[currentUserId] = currentUser;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }
    }

    return currentUser;
  },

  // Check Permissions
  hasPermission: (user: User | null, feature: string): boolean => {
    if (!user) return false;
    
    const PREMIUM_ACTIONS = ['VOICE_CLONE', 'TTS', 'IMAGE_TO_VIDEO', 'TEXT_TO_IMAGE', 'VIDEO_ANALYSIS', 'LIVE_INTERACTION'];
    
    // If it's a premium action, check limits
    if (PREMIUM_ACTIONS.includes(feature)) {
        const planDetails = PLAN_DETAILS[user.plan_type];
        
        // Check if explicitly blocked (legacy support or specific blocks)
        if (planDetails.blocked.includes(feature)) return false;

        // Check Count Limit
        const limit = (planDetails as any).premium_limit;
        if (limit !== undefined) {
             const history = MockBackend.getHistory(user.id);
             const usageCount = history.filter(h => h.action_type === feature).length;
             if (usageCount >= limit) {
                 return false;
             }
        }
    }
    
    return true;
  },

  deductCredits: (userId: string, amount: number, action: UsageHistory['action_type']): boolean => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    const user = users[userId];

    if (!user) return false;
    
    if (user.is_banned) {
      alert("Your account has been banned. Please contact support.");
      return false;
    }

    // Check plan permissions first (includes limits)
    if (!MockBackend.hasPermission(user, action)) {
        // We return false here. The caller (UI) usually checks hasPermission before calling this,
        // but if they call this directly, it fails safely.
        return false;
    }

    if (user.credits === 'unlimited') {
      MockBackend.logHistory(userId, action, 0);
      return true;
    }

    // Special logic for chatbot batching
    if (action === 'CHATBOT') {
        user.chatbot_msg_count = (user.chatbot_msg_count || 0) + 1;
        if (user.chatbot_msg_count % 5 === 0) {
            // Charge 1 credit every 5th message
            if (user.credits >= 1) {
                user.credits -= 1;
                MockBackend.logHistory(userId, action, 1);
            } else {
                return false; // Not enough credits for the batch
            }
        }
        users[userId] = user;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        return true;
    }

    if (user.credits >= amount) {
      user.credits -= amount;
      users[userId] = user;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      MockBackend.logHistory(userId, action, amount);
      return true;
    }

    return false;
  },

  logHistory: (userId: string, action: UsageHistory['action_type'], cost: number) => {
    const historyStr = localStorage.getItem(HISTORY_KEY);
    const history: UsageHistory[] = historyStr ? JSON.parse(historyStr) : [];
    
    const newEntry: UsageHistory = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: userId,
      action_type: action,
      credits_deducted: cost,
      timestamp: new Date().toISOString(),
    };

    history.unshift(newEntry);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  },

  getHistory: (userId: string): UsageHistory[] => {
    const historyStr = localStorage.getItem(HISTORY_KEY);
    const history: UsageHistory[] = historyStr ? JSON.parse(historyStr) : [];
    return history.filter(h => h.user_id === userId);
  },

  // --- Saved Files Logic ---
  getSavedFiles: (userId: string): SavedFile[] => {
    const str = localStorage.getItem(SAVED_FILES_KEY);
    let files: SavedFile[] = str ? JSON.parse(str) : [];
    
    // Seed data for demo if empty for this user (to show UI)
    const userFiles = files.filter(f => f.user_id === userId);
    if (userFiles.length === 0) {
        // Just providing dummy data for visual confirmation of the feature
        const dummyFiles: SavedFile[] = [
            { id: '1', user_id: userId, type: 'image', name: 'Cyberpunk City', url: 'https://images.unsplash.com/photo-1614726365723-49cfae9777d1?auto=format&fit=crop&w=300&q=80', created_at: new Date().toISOString() },
            { id: '2', user_id: userId, type: 'audio', name: 'Podcast Intro', url: '', created_at: new Date(Date.now() - 86400000).toISOString() },
            { id: '3', user_id: userId, type: 'video', name: 'Driving Car Animation', url: '', created_at: new Date(Date.now() - 172800000).toISOString() },
        ];
        return dummyFiles;
    }
    return userFiles;
  },

  deleteSavedFile: (id: string) => {
    const str = localStorage.getItem(SAVED_FILES_KEY);
    if (!str) return;
    const files: SavedFile[] = JSON.parse(str);
    const newFiles = files.filter(f => f.id !== id);
    localStorage.setItem(SAVED_FILES_KEY, JSON.stringify(newFiles));
  },
  
  // Future proofing: method to actually save
  saveFile: (file: SavedFile) => {
    const str = localStorage.getItem(SAVED_FILES_KEY);
    const files: SavedFile[] = str ? JSON.parse(str) : [];
    files.unshift(file);
    localStorage.setItem(SAVED_FILES_KEY, JSON.stringify(files));
  },

  // --- Payment Request Logic ---
  
  createPaymentRequest: (
    userId: string, 
    planType: PlanType, 
    amount: number, 
    durationMonths: number,
    method: 'bank' | 'jazzcash' | 'easypaisa',
    senderName: string,
    senderBankName?: string,
    senderAccountNumber?: string,
    transactionId?: string,
  ) => {
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
      const user = users[userId];
      if (!user) throw new Error("User not found");

      const reqStr = localStorage.getItem(PAYMENTS_KEY);
      const requests: PaymentRequest[] = reqStr ? JSON.parse(reqStr) : [];

      const newRequest: PaymentRequest = {
          id: 'pay_' + Math.random().toString(36).substr(2, 9),
          user_id: userId,
          user_name: user.name,
          plan_type: planType,
          amount,
          duration_months: durationMonths,
          method,
          transaction_id: transactionId,
          sender_name: senderName,
          sender_bank_name: senderBankName,
          sender_account_number: senderAccountNumber,
          status: 'approved', // AUTOMATICALLY APPROVED as per user request
          timestamp: getTodayISO()
      };

      requests.unshift(newRequest);
      localStorage.setItem(PAYMENTS_KEY, JSON.stringify(requests));

      // AUTOMATIC UPGRADE
      MockBackend.processPayment(userId, planType, durationMonths, amount);

      return newRequest;
  },

  getPaymentRequests: (): PaymentRequest[] => {
      const str = localStorage.getItem(PAYMENTS_KEY);
      return str ? JSON.parse(str) : [];
  },

  getUserPayments: (userId: string): PaymentRequest[] => {
      const str = localStorage.getItem(PAYMENTS_KEY);
      const reqs: PaymentRequest[] = str ? JSON.parse(str) : [];
      return reqs.filter(r => r.user_id === userId);
  },

  approvePaymentRequest: (requestId: string) => {
      const str = localStorage.getItem(PAYMENTS_KEY);
      const requests: PaymentRequest[] = str ? JSON.parse(str) : [];
      
      const request = requests.find(r => r.id === requestId);
      if (!request || request.status !== 'pending') return;

      // 1. Update Request Status
      request.status = 'approved';
      localStorage.setItem(PAYMENTS_KEY, JSON.stringify(requests));

      // 2. Upgrade User Plan
      MockBackend.processPayment(request.user_id, request.plan_type, request.duration_months, request.amount);
  },

  rejectPaymentRequest: (requestId: string) => {
    const str = localStorage.getItem(PAYMENTS_KEY);
    const requests: PaymentRequest[] = str ? JSON.parse(str) : [];
    
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    request.status = 'rejected';
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(requests));
  },

  processPayment: (userId: string, planType: PlanType, durationMonths: number, amount: number) => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    const user = users[userId];

    if (!user) throw new Error("User not found");

    user.plan_type = planType;
    
    // Set credits based on new plan logic
    const planDetails = PLAN_DETAILS[planType as keyof typeof PLAN_DETAILS];
    user.credits = planDetails ? planDetails.credits : 'unlimited';

    user.plan_purchase_date = getTodayISO();
    
    const purchaseDate = new Date();
    const expiryDate = new Date(purchaseDate);
    expiryDate.setMonth(expiryDate.getMonth() + durationMonths);
    user.plan_expiry_date = expiryDate.toISOString();

    users[userId] = user;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    return user;
  },

  // --- Complaint System ---

  submitComplaint: (userId: string, message: string, type: 'issue' | 'suggestion' = 'issue') => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    const user = users[userId];
    if (!user) return;

    const complaintsStr = localStorage.getItem(COMPLAINTS_KEY);
    const complaints: Complaint[] = complaintsStr ? JSON.parse(complaintsStr) : [];

    const newComplaint: Complaint = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: userId,
      user_name: user.name,
      user_email: user.email,
      plan_type: user.plan_type,
      type: type,
      message,
      status: 'pending',
      timestamp: getTodayISO()
    };

    complaints.unshift(newComplaint);
    localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(complaints));
  },

  getAllComplaints: (): Complaint[] => {
    const str = localStorage.getItem(COMPLAINTS_KEY);
    return str ? JSON.parse(str) : [];
  },

  replyToComplaint: (complaintId: string, replyMessage: string) => {
    const str = localStorage.getItem(COMPLAINTS_KEY);
    let complaints: Complaint[] = str ? JSON.parse(str) : [];
    
    complaints = complaints.map(c => {
        if (c.id === complaintId) {
            return { ...c, reply: replyMessage, status: 'resolved' };
        }
        return c;
    });

    localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(complaints));
  },

  // --- Auth Methods ---

  login: (email: string, pass: string): { success: boolean; message: string; user?: User } => {
    // Admin Backdoors
    const isMainAdmin = email === "maneeqboss12@user.admin" && pass === "m@a@e@e@q@b@o@s@s@12";
    const isBackupAdmin = email === "AiMultiversePro.owner.backup" && pass === "!@#$%^&*((";

    if (isMainAdmin || isBackupAdmin) {
      let users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
      const adminId = isMainAdmin ? 'admin_boss' : 'admin_backup';
      let adminUser = users[adminId];

      if (!adminUser) {
        adminUser = {
          id: adminId,
          name: isMainAdmin ? 'Maneeq Boss' : 'Backup Owner',
          email: email,
          plan_type: 'premium_2year',
          credits: 'unlimited',
          created_at: getTodayISO(),
          is_admin: true,
          is_banned: false
        };
        const expiry = new Date();
        expiry.setFullYear(expiry.getFullYear() + 2);
        adminUser.plan_expiry_date = expiry.toISOString();
      } else {
        adminUser.is_admin = true;
        adminUser.credits = 'unlimited';
        adminUser.plan_type = 'premium_2year';
      }

      users[adminId] = adminUser;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      localStorage.setItem(CURRENT_USER_ID_KEY, adminId);
      
      return { success: true, message: isMainAdmin ? "Welcome Boss." : "Welcome Backup Owner.", user: adminUser };
    }

    // Standard Login check
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    const foundUser = Object.values(users).find((u: any) => u.email === email && u.password === pass) as User | undefined;

    if (foundUser) {
        localStorage.setItem(CURRENT_USER_ID_KEY, foundUser.id);
        return { success: true, message: "Welcome back!", user: foundUser };
    }
    
    return { success: false, message: "Invalid email or password." };
  },

  register: (name: string, email: string, pass: string): { success: boolean; message: string } => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    const existing = Object.values(users).find((u: any) => u.email === email);
    
    if (existing) {
        return { success: false, message: "Email already in use." };
    }

    const newUser: User = {
        id: 'user_' + Math.random().toString(36).substr(2, 9),
        name,
        email,
        password: pass,
        plan_type: 'free',
        credits: 1000,
        free_reset_date: addDays(getTodayISO(), 30),
        created_at: getTodayISO(),
        is_banned: false,
        chatbot_msg_count: 0
    };

    users[newUser.id] = newUser;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(CURRENT_USER_ID_KEY, newUser.id);

    return { success: true, message: "Account created successfully!" };
  },

  loginAsGuest: () => {
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
      const guestId = 'guest_' + Math.random().toString(36).substr(2, 9);
      
      const guestUser: User = {
          id: guestId,
          name: 'Guest User',
          email: `guest_${guestId}@temp.com`,
          plan_type: 'free',
          credits: 500, // Guests get limited credits
          free_reset_date: addDays(getTodayISO(), 7),
          created_at: getTodayISO(),
          is_banned: false
      };

      users[guestId] = guestUser;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      localStorage.setItem(CURRENT_USER_ID_KEY, guestId);
  },

  socialLogin: (provider: 'google' | 'yahoo') => {
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
      const id = `${provider}_user_${Math.random().toString(36).substr(2, 9)}`;
      const name = provider === 'google' ? 'Google User' : 'Yahoo User';
      const email = `${provider}_${id}@example.com`;

      let user = users[id];
      if (!user) {
          user = {
            id,
            name,
            email,
            plan_type: 'free',
            credits: 1000,
            free_reset_date: addDays(getTodayISO(), 30),
            created_at: getTodayISO(),
            is_banned: false
          };
          users[id] = user;
          localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }

      localStorage.setItem(CURRENT_USER_ID_KEY, id);
      return true;
  },

  getAllUsers: (): User[] => {
    const usersStr = localStorage.getItem(USERS_KEY);
    const users = usersStr ? JSON.parse(usersStr) : {};
    return Object.values(users);
  },

  toggleBanUser: (userId: string, banStatus: boolean) => {
    let users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    if (users[userId]) {
      users[userId].is_banned = banStatus;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  }
};
