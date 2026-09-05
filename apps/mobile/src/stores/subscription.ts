/**
 * Subscription store — §43: Gainly Pro subscription tiers.
 * Free, Pro Monthly, Pro Annual.
 * §94: feature flags for pro features.
 */

import { create } from 'zustand';
import { generateUUID } from '@/utils/uuid';

export type SubscriptionPlan = 'free' | 'pro_monthly' | 'pro_annual';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';

interface SubscriptionState {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

interface SubscriptionActions {
  /** Check if user has a specific feature unlocked. */
  hasFeature: (feature: ProFeature) => boolean;

  /** Get current plan info. */
  getPlanInfo: () => { name: string; price: string; features: string[] };

  /** Start a trial (demo). */
  startTrial: () => void;

  /** Subscribe to a plan (demo). */
  subscribe: (plan: SubscriptionPlan) => void;

  /** Cancel subscription. */
  cancelSubscription: () => void;

  /** Check if user is Pro. */
  isPro: () => boolean;
}

export type ProFeature =
  | 'advanced_analytics'
  | 'unlimited_templates'
  | 'ai_coach'
  | 'advanced_programs'
  | 'detailed_reports'
  | 'health_integrations'
  | 'custom_analytics';

const PRO_FEATURES: ProFeature[] = [
  'advanced_analytics',
  'unlimited_templates',
  'ai_coach',
  'advanced_programs',
  'detailed_reports',
  'health_integrations',
  'custom_analytics',
];

const PLAN_INFO: Record<SubscriptionPlan, { name: string; price: string; features: string[] }> = {
  free: {
    name: 'Free',
    price: '$0',
    features: ['Basic workout tracking', '5 templates', 'Progress overview', 'Body metrics'],
  },
  pro_monthly: {
    name: 'Pro Monthly',
    price: '$9.99/mo',
    features: ['Everything in Free', 'Unlimited templates', 'Advanced analytics', 'AI Coach', 'Detailed reports', 'Health integrations'],
  },
  pro_annual: {
    name: 'Pro Annual',
    price: '$79.99/yr',
    features: ['Everything in Pro Monthly', 'Save 33%', 'Priority support'],
  },
};

export const useSubscription = create<SubscriptionState & SubscriptionActions>((set, get) => ({
  plan: 'free',
  status: 'active',
  currentPeriodStart: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,

  hasFeature: (feature) => {
    const { plan, status } = get();
    if (status !== 'active' && status !== 'trialing') return false;
    if (plan === 'free') return false;
    return PRO_FEATURES.includes(feature);
  },

  getPlanInfo: () => PLAN_INFO[get().plan],

  startTrial: () => {
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + 14);
    set({
      plan: 'pro_monthly',
      status: 'trialing',
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: end.toISOString(),
    });
  },

  subscribe: (plan) => {
    const now = new Date();
    const end = new Date(now);
    if (plan === 'pro_annual') end.setFullYear(end.getFullYear() + 1);
    else end.setMonth(end.getMonth() + 1);
    set({
      plan,
      status: 'active',
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: end.toISOString(),
      cancelAtPeriodEnd: false,
    });
  },

  cancelSubscription: () => {
    set({ cancelAtPeriodEnd: true });
  },

  isPro: () => {
    const { plan, status } = get();
    return (plan === 'pro_monthly' || plan === 'pro_annual') && (status === 'active' || status === 'trialing');
  },
}));
