import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAIResponse } from '@/lib/ai';
import { getAuthenticatedUser } from '@/lib/auth-backend';

interface CachedInsightData {
  data: any;
  timestamp: number;
}

const insightsCache = new Map<string, CachedInsightData>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = Date.now();
    const cached = insightsCache.get(user.id);
    if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
      return NextResponse.json(cached.data);
    }

    const habits = await prisma.habit.findMany({
      where: { 
        userId: user.id,
        archived: false 
      },
      include: { completions: true },
    });

    if (habits.length === 0) {
      return NextResponse.json({
        insights: [],
        weeklyReflection: 'Start tracking habits to receive your AI reflection.',
        focusScore: 0,
      });
    }

    // Prepare habit history context (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const habitSummary = habits
      .map((habit) => {
        const completionsLast30 = habit.completions.filter(
          (c) => new Date(c.date) >= thirtyDaysAgo
        );
        const completionRate = Math.round(
          (completionsLast30.length / Math.min(30, Math.ceil((new Date().getTime() - new Date(habit.createdAt).getTime()) / (1000 * 60 * 60 * 24)) || 1)) * 100
        );
        const dates = completionDates(habit.completions);
        return `- Habit: "${habit.name}" (${habit.priority} priority, ${habit.frequency} frequency). 30-day Completion Rate: ${completionRate}%. Completed dates: ${dates.join(', ') || 'none'}`;
      })
      .join('\n');

    // Retrieve user settings to personalize the AI coach behavior
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
    });
    const userName = userRecord?.name || 'User';
    const motivationTone = userRecord?.motivationTone || 'supportive';
    const aggressiveness = userRecord?.aggressiveness || 'balanced';

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      // Local fallback behavior analysis
      const localInsights = generateLocalInsights(habits);
      insightsCache.set(user.id, { data: localInsights, timestamp: Date.now() });
      return NextResponse.json(localInsights);
    }

    const prompt = `
You are RISA, a calm, emotionally intelligent, and minimal behavioral coach.
Analyze the user's habit data over the last 30 days and generate behavioral insights.
Current User Name: ${userName}.
Motivation Tone Preference: ${motivationTone}.
Aggressiveness Modifier Preference: ${aggressiveness}.

User Habit Data:
${habitSummary}

Analyze patterns, check for drops on certain days, find correlations with priority levels, and identify habits at risk of breaking streaks.
Provide a JSON object strictly matching the schema:
{
  "insights": [
    { "type": "observation" | "warning" | "encouragement" | "tip", "message": "string", "habitName": "string" }
  ],
  "weeklyReflection": "string",
  "focusScore": number
}

Focus score should be an integer between 0 and 100 representing how well the user is focusing on high priority habits.
Insights messages should be quiet, encouraging, emotionally intelligent, supportive, and 1 sentence long. Adjust your response tone according to the user's Motivation Tone ("${motivationTone}") and Aggressiveness Modifier ("${aggressiveness}"). Avoid corporate, robotic, or hyper-enthusiastic language.
`;

    const resultText = await generateAIResponse({
      prompt,
      isJson: true,
    });

    if (!resultText) {
      throw new Error('OpenRouter returned an empty response');
    }

    const parsedInsights = JSON.parse(resultText);
    insightsCache.set(user.id, { data: parsedInsights, timestamp: Date.now() });
    return NextResponse.json(parsedInsights);
  } catch (error) {
    console.error('Error generating AI insights:', error);
    // Return fallback insights on any error
    try {
      const user = await getAuthenticatedUser(request);
      if (user) {
        const habits = await prisma.habit.findMany({
          where: { userId: user.id, archived: false },
          include: { completions: true },
        });
        const localInsights = generateLocalInsights(habits);
        insightsCache.set(user.id, { data: localInsights, timestamp: Date.now() });
        return NextResponse.json(localInsights);
      }
      throw new Error('User context unavailable');
    } catch {
      const defaultInsights = {
        insights: [{ type: 'tip', message: 'Focus on completing your most important habits first today.' }],
        weeklyReflection: 'Your journey to building consistency is starting. Keep moving forward.',
        focusScore: 50,
      };
      return NextResponse.json(defaultInsights);
    }
  }
}

function completionDates(completions: { date: string }[]): string[] {
  return completions.map((c) => c.date).sort();
}

function generateLocalInsights(habits: any[]) {
  const insights: any[] = [];
  let highPriorityTotal = 0;
  let highPriorityCompleted = 0;
  const todayStr = new Date().toISOString().split('T')[0];

  habits.forEach((h) => {
    const completions = h.completions.map((c: any) => c.date);
    const completedLast30 = completions.filter((d: string) => {
      const diff = new Date().getTime() - new Date(d).getTime();
      return diff <= 1000 * 60 * 60 * 24 * 30;
    }).length;

    const rate = Math.round((completedLast30 / 30) * 100);

    if (h.priority === 'high') {
      highPriorityTotal++;
      if (completions.includes(todayStr)) {
        highPriorityCompleted++;
      }
    }

    if (rate > 80) {
      insights.push({
        type: 'encouragement',
        message: `Outstanding consistency with ${h.name}. Your discipline is building strong momentum.`,
        habitName: h.name,
      });
    } else if (rate < 30 && completions.length > 0) {
      insights.push({
        type: 'warning',
        message: `Consistency with ${h.name} has dropped recently. Try adjusting its timing.`,
        habitName: h.name,
      });
    }
  });

  if (insights.length === 0) {
    insights.push({
      type: 'tip',
      message: 'Establish a fixed time block for your most challenging habits to reduce resistance.',
    });
  }

  const focusScore = highPriorityTotal > 0 ? Math.round((highPriorityCompleted / highPriorityTotal) * 100) : 70;

  return {
    insights: insights.slice(0, 3),
    weeklyReflection: 'Your habits are stabilizing. Focus on keeping your high priority routines consistent.',
    focusScore,
  };
}
