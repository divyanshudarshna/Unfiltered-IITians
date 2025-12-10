import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Get total email count
    const totalEmails = await prisma.emailLog.count();

    // Get emails sent today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const emailsToday = await prisma.emailLog.count({
      where: {
        sentAt: {
          gte: today,
        },
      },
    });

    // Get emails this month
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const emailsThisMonth = await prisma.emailLog.count({
      where: {
        sentAt: {
          gte: firstDayOfMonth,
        },
      },
    });

    // Get total recipients
    const allLogs = await prisma.emailLog.findMany({
      select: {
        recipientCount: true,
      },
    });
    const totalRecipients = allLogs.reduce((sum, log) => sum + log.recipientCount, 0);

    // Get emails by source
    const emailsBySource = await prisma.emailLog.groupBy({
      by: ['source'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    });

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentActivity = await prisma.emailLog.findMany({
      where: {
        sentAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        sentAt: true,
        recipientCount: true,
      },
      orderBy: {
        sentAt: 'asc',
      },
    });

    // Group by day
    const activityByDay = recentActivity.reduce((acc, log) => {
      const day = log.sentAt.toISOString().split('T')[0];
      if (!acc[day]) {
        acc[day] = { count: 0, recipients: 0 };
      }
      acc[day].count += 1;
      acc[day].recipients += log.recipientCount;
      return acc;
    }, {} as Record<string, { count: number; recipients: number }>);

    return NextResponse.json({
      stats: {
        totalEmails,
        emailsToday,
        emailsThisMonth,
        totalRecipients,
      },
      emailsBySource: emailsBySource.map((item) => ({
        source: item.source || 'Unknown',
        count: item._count.id,
      })),
      activityByDay: Object.entries(activityByDay).map(([date, data]) => ({
        date,
        ...data,
      })),
    });
  } catch (error) {
    console.error('Error fetching email stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email statistics' },
      { status: 500 }
    );
  }
}
