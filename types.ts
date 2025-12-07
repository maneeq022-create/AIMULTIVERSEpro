
export type PlanType = 'free' | 'premium_3_month' | 'premium_6_month' | 'premium_year' | 'premium_2year';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // For simulation purposes
  plan_type: PlanType;
  credits: number | 'unlimited';
  plan_purchase_date?: string;
  plan_expiry_date?: string;
  free_reset_date: string;
  created_at: string;
  is_admin?: boolean;
  is_banned?: boolean;
  chatbot_msg_count?: number; // Track messages for billing 1 credit per 5 messages
}

export interface UsageHistory {
  id: string;
  user_id: string;
  action_type: 'VOICE_CLONE' | 'TRANSLATE' | 'TTS' | 'IMAGE_TO_VIDEO' | 'CHATBOT' | 'DOC_AI' | 'TEXT_TO_IMAGE' | 'VIDEO_ANALYSIS' | 'LIVE_INTERACTION';
  credits_deducted: number;
  timestamp: string;
  details?: string;
}

export interface Complaint {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  plan_type: PlanType;
  type: 'issue' | 'suggestion'; // Added to distinguish type
  message: string;
  reply?: string;
  status: 'pending' | 'resolved';
  timestamp: string;
}

export interface PaymentRequest {
  id: string;
  user_id: string;
  user_name: string;
  plan_type: PlanType;
  amount: number;
  duration_months: number;
  method: 'bank' | 'jazzcash' | 'easypaisa';
  transaction_id?: string; // Optional now if direct flow is assumed
  sender_name: string;
  sender_bank_name?: string; // New field
  sender_account_number?: string; // New field
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
}

export interface SavedFile {
  id: string;
  user_id: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string; 
  name: string;
  created_at: string;
}

export const CREDIT_COSTS = {
  TTS: 100,
  TRANSLATION: 1,
  VOICE_CLONE: 100,
  IMAGE_TO_VIDEO: 150,
  TEXT_TO_IMAGE: 50,
  CHATBOT_BATCH: 1, // 1 Credit per 5 messages
  DOC_AI_PER_PAGE: 20,
  VIDEO_ANALYSIS: 30,
  LIVE_INTERACTION: 5, // Per minute or session
};

export const VOICE_CLONE_CONFIG = {
    COST_PER_SECOND: 5,
    MODELS: [
        { id: 'v1_standard', name: 'Standard Clone', multiplier: 1, description: 'Balanced speed and quality.' },
        { id: 'v2_hd', name: 'High Fidelity', multiplier: 2.5, description: 'Studio quality capturing subtle nuances.' },
        { id: 'v2_expressive', name: 'Expressive AI', multiplier: 1.5, description: 'Enhanced emotional range.' }
    ]
};

// Updated PLAN_DETAILS with specific premium limits as requested
export const PLAN_DETAILS = {
  free: {
    label: 'Free Plan',
    credits: 1000,
    features: ['AI Chatbot (Flash)', 'Document AI', 'Translator', 'Fast Responses', '1 Trial Use of Premium Features'],
    blocked: [], // Removed hard blocks to allow limited usage
    premium_limit: 1, // 1 time use of premium features
    voice_clone_word_limit: 500
  },
  premium_3_month: {
    label: '3-Month Plan',
    credits: 5000,
    features: ['All Free Features', 'Voice Cloning (1 Use)', 'Text-to-Speech (1 Use)', 'Image-to-Video (1 Use)'],
    blocked: ['Live API'], // Still limiting Live API on lower tiers if desired, or let limit handle it
    premium_limit: 1, // 1 time use of premium features
    voice_clone_word_limit: 500
  },
  premium_6_month: {
    label: '6-Month Plan',
    credits: 10000,
    features: ['All 3-Month Features', 'Premium Features (2 Uses)', 'Thinking Mode', 'Video Analysis'], 
    blocked: [],
    premium_limit: 2, // 2 times use of premium features
    voice_clone_word_limit: 600
  },
  premium_year: {
    label: '1-Year Plan',
    credits: 35000,
    features: ['All Features', 'Image-to-Video (10 min max)', 'High Priority', 'Live API', '4K Image Gen', 'High Limits'],
    blocked: [],
    premium_limit: 100, // High limit
    voice_clone_word_limit: 1000
  },
  premium_2year: {
    label: '2-Year Plan',
    credits: 'unlimited',
    features: ['All Features', 'Image-to-Video (10 min max)', 'Unlimited Credits', 'Priority Queue', 'Bonus Support', 'Unlimited Usage'],
    blocked: [],
    premium_limit: 999999, // Unlimited
    voice_clone_word_limit: 2000
  }
};

export const PRICING_USD = {
  PREMIUM_3_MONTH: 39,
  PREMIUM_6_MONTH: 79,
  YEARLY: 149,
  TWO_YEAR: 249,
};

export const PRICING_PKR = { // Deprecated but kept for compatibility if needed, though we will switch to USD
    PREMIUM_3_MONTH: 12000,
    PREMIUM_6_MONTH: 25000,
    YEARLY: 45000,
    TWO_YEAR: 80000,
};

// --- OWNER BANK DETAILS (HBL & JazzCash) ---
export const ADMIN_PAYMENT_INFO = {
  BANK: {
    enabled: true,
    bank_name: "HBL (Habib Bank Limited)", 
    account_title: "AI Multiverse Admin", 
    account_number: "0000-0000-0000-0000", 
  },
  JAZZCASH: {
    enabled: true,
    title: "Maneeq Boss",
    number: "AI Multiverse Pro" 
  },
  EASYPAISA: {
    enabled: false, 
    title: "Maneeq Boss",
    number: "0312-9876543" 
  }
};

export interface VideoGenerationConfig {
  prompt: string;
  imageUrls?: string[];
}
