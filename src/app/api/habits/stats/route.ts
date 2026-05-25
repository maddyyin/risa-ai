import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-backend';

function getStreakStats(datesStr: string[], todayStr: string) {
  const uniqueDates = [...new Set(datesStr)];
  if (uniqueDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const today = new Date(todayStr + "T12:00:00");
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  const hasToday = uniqueDates.includes(todayStr);
  const hasYesterday = uniqueDates.includes(yesterdayStr);

  let currentStreak = 0;
  if (hasToday || hasYesterday) {
    let currentCheckStr = hasToday ? todayStr : yesterdayStr;
    while (true) {
      if (uniqueDates.includes(currentCheckStr)) {
        currentStreak++;
        const d = new Date(currentCheckStr + "T12:00:00");
        d.setDate(d.getDate() - 1);
        currentCheckStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      } else {
        break;
      }
    }
  }

  // Longest streak
  const sortedDatesStr = [...uniqueDates].sort();
  let longestStreak = 0;
  let currentRun = 0;
  let prevDate: Date | null = null;

  for (const dateStr of sortedDatesStr) {
    const currentDate = new Date(dateStr + "T12:00:00");
    if (!prevDate) {
      currentRun = 1;
    } else {
      const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentRun++;
      } else if (diffDays > 1) {
        if (currentRun > longestStreak) longestStreak = currentRun;
        currentRun = 1;
      }
    }
    prevDate = currentDate;
  }
  if (currentRun > longestStreak) longestStreak = currentRun;

  return { currentStreak, longestStreak };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const todayParam = url.searchParams.get('today');
    const fallbackToday = new Date();
    const todayStr = todayParam || `${fallbackToday.getFullYear()}-${String(fallbackToday.getMonth() + 1).padStart(2, '0')}-${String(fallbackToday.getDate()).padStart(2, '0')}`;

    const habits = await prisma.habit.findMany({
      where: { 
        userId: user.id,
        archived: false 
      },
      include: { completions: true },
    });

    if (habits.length === 0) {
      return NextResponse.json({
        consistencyScore: 0,
        currentStreak: 0,
        todayCompletionPercent: 0,
        focusScore: 0,
        totalHabits: 0,
        completedToday: 0,
        habitStats: [],
        heatmapData: [],
      });
    }

    const thirtyDaysAgo = new Date(todayStr + "T12:00:00");
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let completedTodayCount = 0;
    let totalConsistencySum = 0;
    let totalWeight = 0;
    let weightedCompletionSum = 0;
    const streaks: number[] = [];

    const habitStats = habits.map((habit) => {
      const completionDates = habit.completions.map((c) => c.date);
      const isCompletedToday = completionDates.includes(todayStr);
      if (isCompletedToday) completedTodayCount++;

      // Find true start date (in case they retroactively completed days before createdAt)
      let startDateStr = new Date(habit.createdAt).toISOString().split('T')[0];
      if (completionDates.length > 0) {
        const earliest = [...completionDates].sort()[0];
        if (earliest < startDateStr) startDateStr = earliest;
      }
      
      // We will attach startDateStr to the habit object for the heatmap loop
      (habit as any).trueStartDateStr = startDateStr;

      // Streak Stats
      const { currentStreak, longestStreak } = getStreakStats(completionDates, todayStr);
      streaks.push(currentStreak);

      // Completion Rate all-time
      const createdDate = new Date(startDateStr + "T12:00:00");
      createdDate.setHours(0,0,0,0);
      const now = new Date(todayStr + "T12:00:00");
      now.setHours(23,59,59,999);
      
      const daysActive = Math.max(1, Math.ceil(
        (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      ));
      
      // Cap at 100% just in case of any weird bounds, but with true start date it shouldn't exceed
      const completionRate = Math.min(100, Math.round((habit.completions.length / daysActive) * 100));

      totalConsistencySum += completionRate;

      // Weighted score for focusScore
      let weight = 2; // medium
      if (habit.priority === 'high') weight = 3;
      if (habit.priority === 'low') weight = 1;
      totalWeight += weight;
      weightedCompletionSum += completionRate * weight;

      return {
        habitId: habit.id,
        habitName: habit.name,
        completionRate,
        currentStreak,
        longestStreak,
      };
    });

    const consistencyScore = Math.round(totalConsistencySum / habits.length);
    const todayCompletionPercent = Math.round((completedTodayCount / habits.length) * 100);
    const focusScore = totalWeight > 0 ? Math.round(weightedCompletionSum / totalWeight) : 0;
    const currentStreak = streaks.length > 0 ? Math.min(...streaks) : 0;

    // Heatmap data last 90 days
    const heatmapData: { date: string; count: number; total: number; level: number }[] = [];
    const tempDate = new Date(todayStr + "T12:00:00");
    for (let i = 0; i < 90; i++) {
      const dateStr = `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, '0')}-${String(tempDate.getDate()).padStart(2, '0')}`;

      // Count completions for all habits on this day
      let dayCompletions = 0;
      let dayActiveHabits = 0;

      for (const habit of habits) {
        // Only count habit if it was active on or before this day based on true start date
        if ((habit as any).trueStartDateStr <= dateStr) {
          dayActiveHabits++;
          if (habit.completions.some((c) => c.date === dateStr)) {
            dayCompletions++;
          }
        }
      }

      let level = 0;
      if (dayActiveHabits > 0 && dayCompletions > 0) {
        const ratio = dayCompletions / dayActiveHabits;
        if (ratio === 0) level = 0;
        else if (ratio <= 0.25) level = 1;
        else if (ratio <= 0.50) level = 2;
        else if (ratio <= 0.75) level = 3;
        else level = 4;
      }

      heatmapData.push({
        date: dateStr,
        count: dayCompletions,
        total: dayActiveHabits,
        level,
      });

      tempDate.setDate(tempDate.getDate() - 1);
    }
    // Reverse so it's chronologically ordered (oldest to newest)
    heatmapData.reverse();

    return NextResponse.json({
      consistencyScore,
      currentStreak,
      todayCompletionPercent,
      focusScore,
      totalHabits: habits.length,
      completedToday: completedTodayCount,
      habitStats,
      heatmapData,
    });
  } catch (error) {
    console.error('Error fetching habit stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
