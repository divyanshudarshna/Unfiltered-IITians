"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Mail, Users, TrendingUp } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  course?: {
    title: string;
  };
  sendEmail: boolean;
  totalRecipients?: number;
  readCount?: number;
  emailDeliveredCount?: number;
  createdAt: string;
}

interface AnnouncementStatsProps {
  announcements: Announcement[];
}

export function AnnouncementStats({ announcements }: AnnouncementStatsProps) {
  const totalAnnouncements = announcements.length;
  const emailAnnouncements = announcements.filter(a => a.sendEmail).length;
  const totalRecipients = announcements.reduce((sum, a) => sum + (a.totalRecipients || 0), 0);
  const totalReads = announcements.reduce((sum, a) => sum + (a.readCount || 0), 0);
  
  const readRate = totalRecipients > 0 ? (totalReads / totalRecipients) * 100 : 0;
  const emailRate = totalAnnouncements > 0 ? (emailAnnouncements / totalAnnouncements) * 100 : 0;

  // Prepare data for charts
  const courseData = announcements.reduce((acc, announcement) => {
    const courseName = announcement.course?.title || "Unknown";
    if (!acc[courseName]) {
      acc[courseName] = { name: courseName, announcements: 0, reads: 0 };
    }
    acc[courseName].announcements += 1;
    acc[courseName].reads += announcement.readCount || 0;
    return acc;
  }, {} as Record<string, { name: string; announcements: number; reads: number }>);

  const chartData = Object.values(courseData);

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Announcements</CardTitle>
          <Mail className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalAnnouncements}</div>
          <p className="text-xs text-muted-foreground">
            Across all courses
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Email Notifications</CardTitle>
          <Mail className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{emailAnnouncements}</div>
          <p className="text-xs text-muted-foreground">
            {emailRate.toFixed(1)}% of total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalRecipients}</div>
          <p className="text-xs text-muted-foreground">
            All enrolled students
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Read Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{readRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            {totalReads} out of {totalRecipients} reads
          </p>
        </CardContent>
      </Card>

      <Card className="col-span-1 sm:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Announcements by Course</CardTitle>
          <CardDescription className="text-sm">
            Distribution of announcements and read rates across courses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="announcements" fill="#3b82f6" name="Announcements" />
                <Bar dataKey="reads" fill="#10b981" name="Reads" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}