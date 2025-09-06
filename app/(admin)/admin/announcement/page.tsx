"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Bell, BarChart3, Settings, RefreshCw } from "lucide-react";
import { AnnouncementForm } from "./AnnouncementForm";
import { AnnouncementTable } from "./AnnouncementTable";
import { AnnouncementStats } from "./AnnouncementStats";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  courseId: string;
  course?: {
    id: string;
    title: string;
  };
  sendEmail: boolean;
  createdAt: string;
  updatedAt: string;
  totalRecipients?: number;
  readCount?: number;
  emailDeliveredCount?: number;
}

export default function CourseAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [activeTab, setActiveTab] = useState("announcements");
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch("/api/admin/course-announcement");
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.announcements || data || []);
      } else {
        throw new Error("Failed to fetch announcements");
      }
    } catch (err) {
      console.error("Failed to fetch announcements", err);
      toast.error("Failed to load announcements");
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/admin/courses");
      if (response.ok) {
        const data = await response.json();
        // Handle both response formats
        const coursesData = data.courses || data;
        setCourses(Array.isArray(coursesData) ? coursesData : []);
      } else {
        throw new Error("Failed to fetch courses");
      }
    } catch (err) {
      console.error("Failed to fetch courses", err);
      toast.error("Failed to load courses");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      await Promise.all([fetchAnnouncements(), fetchCourses()]);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    toast.success("Data has been refreshed");
  };

  const handleEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setOpenForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement? This action cannot be undone.")) return;
    
    try {
      const response = await fetch(`/api/admin/course-announcement?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Announcement deleted successfully");
        fetchAnnouncements();
      } else {
        throw new Error("Delete failed");
      }
    } catch (err) {
      console.error("Delete failed", err);
      toast.error("Failed to delete announcement");
    }
  };

  const handleFormSuccess = () => {
    fetchAnnouncements();
    setOpenForm(false);
    setSelectedAnnouncement(null);
    toast.success(
      selectedAnnouncement 
        ? "Announcement updated successfully" 
        : "Announcement created successfully"
    );
  };

  const handleFormCancel = () => {
    setOpenForm(false);
    setSelectedAnnouncement(null);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Course Announcements</h1>
          <p className="text-muted-foreground">
            Manage and track all course announcements
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setOpenForm(true)}
            className="gap-2"
            disabled={courses.length === 0}
          >
            <Plus className="h-4 w-4" />
            New Announcement
          </Button>
        </div>
      </div>

      {courses.length === 0 && (
        <Card className="bg-destructive/10 border-destructive">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="font-semibold text-destructive mb-2">No Courses Available</h3>
              <p className="text-muted-foreground">
                You need to create courses first before making announcements.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="announcements" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Announcements
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="announcements">
          <Card>
            <CardHeader>
              <CardTitle>All Announcements</CardTitle>
              <CardDescription>
                View and manage all course announcements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnnouncementTable
                data={announcements}
                loading={loading}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <AnnouncementStats announcements={announcements} />
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Announcement Settings</CardTitle>
              <CardDescription>
                Configure announcement preferences and templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Email Templates</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure default email templates for announcements
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Notification Preferences</h3>
                  <p className="text-sm text-muted-foreground">
                    Set up notification rules and delivery schedules
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AnnouncementForm
        open={openForm}
        courses={courses}
        announcement={selectedAnnouncement}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    </div>
  );
}