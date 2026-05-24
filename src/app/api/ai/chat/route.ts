import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAIResponse } from '@/lib/ai';
import { getAuthenticatedUser } from '@/lib/auth-backend';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const history = await prisma.aIConversation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let user: any = null;
  try {
    user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // 1. Save user message to database
    const userMessage = await prisma.aIConversation.create({
      data: {
        userId: user.id,
        role: 'user',
        content: message,
      },
    });

    // 2. Fetch habits context
    const habits = await prisma.habit.findMany({
      where: { 
        userId: user.id,
        archived: false 
      },
      include: { completions: true },
    });

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
        return `- Habit: "${habit.name}" (${habit.priority} priority). 30-day Completion Rate: ${completionRate}%.`;
      })
      .join('\n');

    // 3. Fetch past conversation logs
    const history = await prisma.aIConversation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      take: 10, // last 10 messages for context
    });

    const chatHistoryContext = history
      .map((h) => `${h.role === 'user' ? 'Sahil' : 'RISA'}: ${h.content}`)
      .join('\n');

    // Retrieve user settings to personalize the AI coach behavior
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
    });
    const userName = userRecord?.name || 'User';
    const motivationTone = userRecord?.motivationTone || 'supportive';
    const aggressiveness = userRecord?.aggressiveness || 'balanced';

    const apiKey = process.env.OPENROUTER_API_KEY;
    let aiResponseText = '';

    if (!apiKey) {
      aiResponseText = `I'm running locally right now without my core AI processor, but I see your habits and consistency pattern, ${userName}. Keep checking off your daily habits, and let's work on stability together.`;
    } else {
      const prompt = `
You are RISA, a calm, emotionally intelligent, and highly structured behavioral coaching mentor.
You are helping ${userName} build stable routines and long-term consistency.
Speak with quiet confidence, empathy, and absolute minimal noise. No enthusiastic exclamations, no robotic formatting.
Match your motivational tone to: "${motivationTone}" and your aggressiveness level to: "${aggressiveness}".

${userName}'s Habits summary:
${habitSummary}

Recent conversation history:
${chatHistoryContext}

${userName} says: "${message}"

Write a response that helps ${userName} reflect on their behavior. Keep it short (2-3 sentences), highly thoughtful, and tailored to their current habit rates if relevant.
Return a JSON object:
{
  "content": "your response here"
}
`;

      const responseText = await generateAIResponse({
        prompt,
        isJson: true,
      });

      const parsed = JSON.parse(responseText || '{}');
      aiResponseText = parsed.content || "I'm listening. Tell me more about what's getting in your way.";
    }

    // 4. Save AI response to database
    const assistantMessage = await prisma.aIConversation.create({
      data: {
        userId: user.id,
        role: 'assistant',
        content: aiResponseText,
      },
    });

    return NextResponse.json(assistantMessage);
  } catch (error) {
    console.error('Error in AI chat route:', error);
    // Fallback if anything goes wrong
    try {
      if (user) {
        const fallbackMsg = await prisma.aIConversation.create({
          data: {
            userId: user.id,
            role: 'assistant',
            content: "Let's take a deep breath and look at your habits. What specifically is presenting a challenge today?",
          },
        });
        return NextResponse.json(fallbackMsg);
      }
      throw new Error('User context unavailable');
    } catch {
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }
}
