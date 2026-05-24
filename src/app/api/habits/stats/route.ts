import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-backend';

function getStreakStats(datesStr: string[]) {
  const uniqueDates = [...new Set(datesStr)];
  if (uniqueDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const hasToday = uniqueDates.includes(todayStr);
  const hasYesterday = uniqueDates.includes(yesterdayStr);

  let currentStreak = 0;
  if (hasToday || hasYesterday) {
    let checkDate = hasToday ? today : yesterday;
    while (true) {
      const checkStr = checkDate.toISOString().split('T')[0];
      if (uniqueDates.includes(checkStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
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
    const currentDate = new Date(dateStr);
    if (!prevDate) {
      currentRun = 1;
    } else {
      const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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

    const todayStr = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date();
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

      // Streak Stats
      const { currentStreak, longestStreak } = getStreakStats(completionDates);
      streaks.push(currentStreak);

      // Completion Rate last 30 days
      const completionsLast30 = habit.completions.filter(
        (c) => new Date(c.date) >= thirtyDaysAgo
      );
      const daysActive = Math.min(
        30,
        Math.ceil(
          (new Date().getTime() - new Date(habit.createdAt).getTime()) /
            (1000 * 60 * 60 * 24)
        ) || 1
      );
      const completionRate = Math.round((completionsLast30.length / daysActive) * 100);

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
    const tempDate = new Date();
    for (let i = 0; i < 90; i++) {
      const dateStr = tempDate.toISOString().split('T')[0];

      // Count completions for all habits on this day
      let dayCompletions = 0;
      let dayActiveHabits = 0;

      for (const habit of habits) {
        // Only count habit if it was created on or before this day
        if (new Date(habit.createdAt).toISOString().split('T')[0] <= dateStr) {
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
