"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatSessionExpiryDate } from "@/lib/guidance-session-expiry";
import { getYoutubeEmbedUrl, type GuidanceTestimonialStatus, type GuidanceTestimonialType } from "@/lib/guidance-testimonials";
import { Edit2, Loader2, MessageSquare, PlayCircle, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

type AdminSession = {
  id: string;
  title: string;
  status: string;
  expiryDate: string | null;
};

type GuidanceTestimonial = {
  id: string;
  sessionId: string;
  type: GuidanceTestimonialType;
  status: GuidanceTestimonialStatus;
  youtubeUrl?: string | null;
  youtubeVideoId?: string | null;
  name?: string | null;
  sessionAttended?: string | null;
  description?: string | null;
  rating: number;
  createdAt: string;
  session?: AdminSession;
};

type FormState = {
  sessionId: string;
  type: GuidanceTestimonialType;
  status: GuidanceTestimonialStatus;
  youtubeUrl: string;
  name: string;
  sessionAttended: string;
  description: string;
  rating: number;
};

const defaultForm: FormState = {
  sessionId: "",
  type: "YOUTUBE",
  status: "ACTIVE",
  youtubeUrl: "",
  name: "",
  sessionAttended: "",
  description: "",
  rating: 5,
};

const statusLabels: Record<GuidanceTestimonialStatus, string> = {
  ACTIVE: "Active",
  DRAFT: "Draft",
  ARCHIVED: "Archived",
};

export default function AdminGuidanceTestimonialsPage() {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [testimonials, setTestimonials] = useState<GuidanceTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GuidanceTestimonial | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);

  const selectedSession = sessions.find((session) => session.id === form.sessionId);

  const fetchData = async () => {
    setLoading(true);

    try {
      const [sessionsRes, testimonialsRes] = await Promise.all([
        fetch("/api/admin/sessions?limit=1000"),
        fetch("/api/admin/session-testimonials"),
      ]);

      if (!sessionsRes.ok) throw new Error("Failed to fetch sessions");
      if (!testimonialsRes.ok) throw new Error("Failed to fetch testimonials");

      const sessionsData = await sessionsRes.json();
      const testimonialsData = await testimonialsRes.json();

      setSessions(Array.isArray(sessionsData.sessions) ? sessionsData.sessions : []);
      setTestimonials(Array.isArray(testimonialsData) ? testimonialsData : []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load guidance testimonials");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditing(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const openEditModal = (testimonial: GuidanceTestimonial) => {
    setEditing(testimonial);
    setForm({
      sessionId: testimonial.sessionId,
      type: testimonial.type,
      status: testimonial.status,
      youtubeUrl: testimonial.youtubeUrl || "",
      name: testimonial.name || "",
      sessionAttended: testimonial.sessionAttended || testimonial.session?.title || "",
      description: testimonial.description || "",
      rating: testimonial.rating || 5,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(defaultForm);
  };

  const updateSession = (sessionId: string) => {
    const session = sessions.find((item) => item.id === sessionId);

    setForm((prev) => ({
      ...prev,
      sessionId,
      sessionAttended: prev.sessionAttended || session?.title || "",
    }));
  };

  const saveTestimonial = async () => {
    if (!form.sessionId) {
      toast.error("Please select a guidance session");
      return;
    }

    if (form.type === "YOUTUBE" && !getYoutubeEmbedUrl(form.youtubeUrl)) {
      toast.error("Please enter a valid YouTube link");
      return;
    }

    if (form.type === "TESTIMONIAL" && (!form.name.trim() || !form.description.trim())) {
      toast.error("Name and testimonial description are required");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        editing ? `/api/admin/session-testimonials/${editing.id}` : "/api/admin/session-testimonials",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to save testimonial");
      }

      toast.success(editing ? "Testimonial updated" : "Testimonial added");
      closeModal();
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to save testimonial");
    } finally {
      setSaving(false);
    }
  };

  const deleteTestimonial = async (testimonial: GuidanceTestimonial) => {
    if (!confirm("Delete this guidance testimonial?")) return;

    try {
      const response = await fetch(`/api/admin/session-testimonials/${testimonial.id}`, { method: "DELETE" });

      if (!response.ok) throw new Error("Failed to delete testimonial");

      setTestimonials((current) => current.filter((item) => item.id !== testimonial.id));
      toast.success("Testimonial deleted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete testimonial");
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Guidance Testimonials</h1>
          <p className="text-sm text-muted-foreground">
            Add YouTube and written testimonials to specific guidance sessions.
          </p>
        </div>
        <Button onClick={openCreateModal}>Add Testimonial</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{testimonials.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">YouTube</p>
            <p className="text-2xl font-bold">{testimonials.filter((item) => item.type === "YOUTUBE").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold">{testimonials.filter((item) => item.status === "ACTIVE").length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">All Guidance Testimonials</h2>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading testimonials...
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Record</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testimonials.length > 0 ? (
                    testimonials.map((testimonial) => (
                      <TableRow key={testimonial.id}>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            {testimonial.type === "YOUTUBE" ? <PlayCircle className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                            {testimonial.type === "YOUTUBE" ? "YouTube" : "Testimonial"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{testimonial.session?.title || "Unknown session"}</div>
                          <div className="text-xs text-muted-foreground">
                            Expiry: {formatSessionExpiryDate(testimonial.session?.expiryDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {testimonial.type === "YOUTUBE" ? (
                            <a className="text-sm text-blue-600 hover:underline" href={testimonial.youtubeUrl || "#"} target="_blank" rel="noreferrer">
                              {testimonial.youtubeVideoId || "YouTube video"}
                            </a>
                          ) : (
                            <div>
                              <div className="font-medium">{testimonial.name}</div>
                              <div className="flex items-center gap-1 text-xs text-amber-600">
                                {Array.from({ length: 5 }).map((_, index) => (
                                  <Star key={index} className={`h-3 w-3 ${index < Math.round(testimonial.rating) ? "fill-amber-400" : ""}`} />
                                ))}
                                <span>{testimonial.rating}/5</span>
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={testimonial.status === "ACTIVE" ? "default" : "secondary"}>
                            {statusLabels[testimonial.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(testimonial.createdAt).toLocaleDateString("en-IN")}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditModal(testimonial)}>
                              <Edit2 className="h-4 w-4" /> Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => deleteTestimonial(testimonial)}>
                              <Trash2 className="h-4 w-4" /> Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No guidance testimonials added yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={(open) => (open ? setModalOpen(true) : closeModal())}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Guidance Testimonial" : "Add Guidance Testimonial"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Guidance Session *</Label>
              <Select value={form.sessionId} onValueChange={updateSession}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.title} ({session.status}, {formatSessionExpiryDate(session.expiryDate)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                This list includes active and expired guidance sessions.
              </p>
            </div>

            <Tabs
              value={form.type}
              onValueChange={(value) => setForm((prev) => ({ ...prev, type: value as GuidanceTestimonialType }))}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="YOUTUBE">YouTube</TabsTrigger>
                <TabsTrigger value="TESTIMONIAL">Testimonial</TabsTrigger>
              </TabsList>

              <TabsContent value="YOUTUBE" className="space-y-4 pt-3">
                <div className="space-y-2">
                  <Label>YouTube Video Link *</Label>
                  <Input
                    value={form.youtubeUrl}
                    onChange={(event) => setForm((prev) => ({ ...prev, youtubeUrl: event.target.value }))}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  {getYoutubeEmbedUrl(form.youtubeUrl) && (
                    <div className="overflow-hidden rounded-xl border bg-black">
                      <iframe
                        src={getYoutubeEmbedUrl(form.youtubeUrl) || undefined}
                        title="YouTube testimonial preview"
                        className="aspect-video w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="TESTIMONIAL" className="space-y-4 pt-3">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={form.name}
                      onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                      placeholder="Student name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Session Attended</Label>
                    <Input
                      value={form.sessionAttended || selectedSession?.title || ""}
                      onChange={(event) => setForm((prev) => ({ ...prev, sessionAttended: event.target.value }))}
                      placeholder="Session name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Textarea
                    value={form.description}
                    onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder="Write the testimonial text"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Star Rating</Label>
                  <Input
                    type="number"
                    min="0"
                    max="5"
                    step="0.5"
                    value={form.rating}
                    onChange={(event) => setForm((prev) => ({ ...prev, rating: Number(event.target.value) || 5 }))}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => setForm((prev) => ({ ...prev, status: value as GuidanceTestimonialStatus }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="ARCHIVED">Archive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal} disabled={saving}>Cancel</Button>
            <Button onClick={saveTestimonial} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
