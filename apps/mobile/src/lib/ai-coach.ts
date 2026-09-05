/**
 * AI Coach — §62: Gainly Coach, future module.
 * §63: AI safety — never present as doctor/dietitian/PT.
 * §93: AIService, structured fitness context.
 *
 * This module defines the interface and types for the AI coach.
 * The actual LLM integration is deferred until Phase 13 implementation.
 */

export type CoachMessageType = 'user' | 'assistant';

export interface CoachMessage {
  id: string;
  type: CoachMessageType;
  content: string;
  timestamp: string;
}

export type CoachTopic =
  | 'what_to_train_today'
  | 'progress_analysis'
  | 'workout_recommendation'
  | 'plateau_analysis'
  | 'calorie_check'
  | 'weekly_summary'
  | 'general';

/**
 * Structured fitness context for the AI coach.
 * §62: "AI must never invent user fitness information."
 * Use structured, minimal relevant context.
 */
export interface FitnessContext {
  recentWorkouts: {
    name: string;
    date: string;
    exercises: { name: string; sets: number; reps: number; weight: number }[];
    duration: number;
    volume: number;
  }[];
  personalRecords: {
    exercise: string;
    type: string;
    value: number;
    achievedAt: string;
  }[];
  bodyMetrics: {
    weight: number | null;
    bodyFat: number | null;
    lastUpdated: string;
  };
  nutritionGoals: {
    calories: number | null;
    protein: number | null;
  };
  goals: {
    title: string;
    progress: number;
    target: number;
  }[];
}

/**
 * AI Safety disclaimer — §63.
 * Must be shown with every AI response.
 */
export const AI_SAFETY_DISCLAIMER = `Gainly Coach is an AI fitness assistant, not a medical professional. 
Always consult a healthcare provider before making significant changes to your diet or exercise routine.`;

/**
 * Build the system prompt for the AI coach.
 * §62: "AI must never invent user fitness information."
 */
export function buildSystemPrompt(context: FitnessContext): string {
  return `You are Gainly Coach, an AI fitness assistant integrated into the Gainly fitness app.

IMPORTANT RULES:
1. Never invent fitness information not provided in the context below.
2. Never present yourself as a doctor, dietitian, physical therapist, or medical professional.
3. If a user reports dangerous symptoms or medical concerns, advise them to seek professional help.
4. Base all recommendations on the user's actual data provided below.
5. Be encouraging but realistic.
6. Keep responses concise and actionable.

USER FITNESS DATA:
${JSON.stringify(context, null, 2)}

RESPONSE STYLE:
- Short, actionable advice
- Reference specific numbers from their data
- Motivating but honest
- If data is insufficient, say so rather than guessing`;
}

/**
 * Get suggested prompts for the AI coach.
 */
export function getSuggestedPrompts(): { topic: CoachTopic; prompt: string }[] {
  return [
    { topic: 'what_to_train_today', prompt: 'What should I train today?' },
    { topic: 'progress_analysis', prompt: 'How has my bench press improved?' },
    { topic: 'workout_recommendation', prompt: 'Create me a 4-day workout split' },
    { topic: 'plateau_analysis', prompt: 'Why has my squat plateaued?' },
    { topic: 'calorie_check', prompt: 'How many calories do I have remaining?' },
    { topic: 'weekly_summary', prompt: 'Summarize my training week' },
  ];
}
