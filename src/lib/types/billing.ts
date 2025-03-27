
export type Subscription = {
  id: string;
  plan_name: string;
  price: number;
  billing_cycle: string;
  status: string;
  start_date: string;
  end_date: string | null;
  auto_renew: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type PaymentMethod = {
  id: string;
  user_id: string;
  provider: string;
  last_four: string;
  card_type: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type Invoice = {
  id: string;
  user_id: string;
  invoice_number: string | null;
  amount: number;
  currency: string;
  status: string;
  invoice_date: string;
  due_date: string | null;
  payment_date: string | null;
  description: string | null;
  created_at: string;
};

export type SubscriptionTier = 'STARTER' | 'PRO' | 'ENTERPRISE' | 'FREE';

export type SubscriptionLimits = {
  maxMessages: number;
  maxConversations: number;
  maxTeamMembers: number;
  maxLiveBots: number;
  advancedAnalytics: boolean;
  customBranding: boolean;
  showPoweredBy: boolean;
};

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  FREE: {
    maxMessages: 100,
    maxConversations: 20,
    maxTeamMembers: 1,
    maxLiveBots: 1,
    advancedAnalytics: false,
    customBranding: false,
    showPoweredBy: true
  },
  STARTER: {
    maxMessages: 1000,
    maxConversations: 200,
    maxTeamMembers: 1,
    maxLiveBots: 1,
    advancedAnalytics: false,
    customBranding: false,
    showPoweredBy: true
  },
  PRO: {
    maxMessages: 5000,
    maxConversations: 1000,
    maxTeamMembers: 5,
    maxLiveBots: 3,
    advancedAnalytics: true,
    customBranding: true,
    showPoweredBy: false
  },
  ENTERPRISE: {
    maxMessages: 20000,
    maxConversations: 5000,
    maxTeamMembers: 15,
    maxLiveBots: 10,
    advancedAnalytics: true,
    customBranding: true,
    showPoweredBy: false
  }
};
