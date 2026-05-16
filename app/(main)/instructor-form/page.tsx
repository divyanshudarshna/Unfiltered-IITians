"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Loader2,
  GraduationCap,
  FlaskConical,
  Globe,
  Linkedin,
  BookOpen,
  X,
  Upload,
  Camera,
  CheckCircle2,
  ChevronRight,
  Users,
  Star,
  Shield,
  ArrowLeft,
} from "lucide-react";

// ── Institution Suggestions ──────────────────────────────────────────────────
const INSTITUTION_SUGGESTIONS: { name: string; domain: string }[] = [
  { name: "IIT Bombay", domain: "iitb.ac.in" },
  { name: "IIT Delhi", domain: "iitd.ac.in" },
  { name: "IIT Madras", domain: "iitm.ac.in" },
  { name: "IIT Roorkee", domain: "iitr.ac.in" },
  { name: "IIT Kanpur", domain: "iitk.ac.in" },
  { name: "IIT Kharagpur", domain: "iitkgp.ac.in" },
  { name: "IIT Guwahati", domain: "iitg.ac.in" },
  { name: "IIT Hyderabad", domain: "iith.ac.in" },
  { name: "IIT Gandhinagar", domain: "iitgn.ac.in" },
  { name: "IIT (BHU) Varanasi", domain: "iitbhu.ac.in" },
  { name: "AIIMS Delhi", domain: "aiims.edu" },
  { name: "JNU", domain: "jnu.ac.in" },
  { name: "University of Delhi", domain: "du.ac.in" },
  { name: "BITS Pilani", domain: "bits-pilani.ac.in" },
  { name: "IISc Bangalore", domain: "iisc.ac.in" },
  { name: "TIFR Mumbai", domain: "tifr.res.in" },
  { name: "MIT", domain: "mit.edu" },
  { name: "Harvard University", domain: "harvard.edu" },
  { name: "Stanford University", domain: "stanford.edu" },
  { name: "University of Oxford", domain: "ox.ac.uk" },
  { name: "University of Cambridge", domain: "cam.ac.uk" },
  { name: "ETH Zurich", domain: "ethz.ch" },
  { name: "Imperial College London", domain: "imperial.ac.uk" },
  { name: "UC Berkeley", domain: "berkeley.edu" },
  { name: "Princeton University", domain: "princeton.edu" },
  { name: "Caltech", domain: "caltech.edu" },
  { name: "NIT Trichy", domain: "nitt.edu" },
  { name: "NIT Warangal", domain: "nitw.ac.in" },
];

// ── Types ────────────────────────────────────────────────────────────────────
interface AcademicAffiliation {
  name: string;
  role: string;
  year: string;
  logoUrl: string;
}

interface ResearchAppointment {
  org: string;
  role: string;
  period: string;
}

interface FormData {
  fullName: string;
  email: string;
  title: string;
  bio: string;
  profileImageUrl: string;
  academicAffiliations: AcademicAffiliation[];
  researchAppointments: ResearchAppointment[];
  expertiseAreas: string[];
  awards: string;
  socialLinks: {
    website: string;
    linkedin: string;
    researchgate: string;
    twitter: string;
  };
}

const emptyForm = (): FormData => ({
  fullName: "",
  email: "",
  title: "",
  bio: "",
  profileImageUrl: "",
  academicAffiliations: [],
  researchAppointments: [],
  expertiseAreas: [],
  awards: "",
  socialLinks: { website: "", linkedin: "", researchgate: "", twitter: "" },
});

// ── Institution Combobox ─────────────────────────────────────────────────────
function InstitutionInput({
  value,
  onChange,
  logoUrl,
  onLogoChange,
}: {
  value: string;
  onChange: (val: string) => void;
  logoUrl: string;
  onLogoChange: (url: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [fetchingLogo, setFetchingLogo] = useState(false);
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = value.trim().length > 0
    ? INSTITUTION_SUGGESTIONS.filter((s) =>
        s.name.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8)
    : [];

  const handleSelect = (suggestion: { name: string; domain: string }) => {
    onChange(suggestion.name);
    onLogoChange(`https://logo.clearbit.com/${suggestion.domain}`);
    setOpen(false);
  };

  const handleInputChange = (val: string) => {
    onChange(val);
    setOpen(true);
    onLogoChange("");
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    fetchTimerRef.current = setTimeout(async () => {
      if (!val.trim()) return;
      const matched = INSTITUTION_SUGGESTIONS.find(
        (s) => s.name.toLowerCase() === val.toLowerCase()
      );
      if (!matched) {
        try {
          setFetchingLogo(true);
          const res = await fetch(`/api/institution-logo?name=${encodeURIComponent(val)}`);
          const data = await res.json();
          if (data.logoUrl) onLogoChange(data.logoUrl);
        } catch {
          // silent
        } finally {
          setFetchingLogo(false);
        }
      }
    }, 900);
  };

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <Input
          placeholder="Search institution..."
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => value.trim().length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="h-9 text-sm pr-8"
        />
        {fetchingLogo && (
          <Loader2 className="absolute right-2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
        )}
        {logoUrl && !fetchingLogo && (
          <span className="absolute right-2 text-green-500 text-xs font-bold">✓</span>
        )}
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden max-h-56 overflow-y-auto">
          {filtered.map((s) => (
            <button
              key={s.domain}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(s)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
            >
              <img
                src={`https://logo.clearbit.com/${s.domain}`}
                alt={s.name}
                className="h-5 w-5 object-contain rounded flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <span className="truncate">{s.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function InstructorFormPage() {
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [expertiseInput, setExpertiseInput] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);

  // ── Image upload ─────────────────────────────────────────────────────────
  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setForm((prev) => ({ ...prev, profileImageUrl: data.url }));
      toast.success("Photo uploaded successfully");
    } catch {
      toast.error("Failed to upload image. Try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  // ── Affiliation helpers ──────────────────────────────────────────────────
  const addAffiliation = () =>
    setForm((prev) => ({
      ...prev,
      academicAffiliations: [
        ...prev.academicAffiliations,
        { name: "", role: "", year: "", logoUrl: "" },
      ],
    }));

  const removeAffiliation = (i: number) =>
    setForm((prev) => ({
      ...prev,
      academicAffiliations: prev.academicAffiliations.filter((_, idx) => idx !== i),
    }));

  const updateAffiliation = (i: number, field: keyof AcademicAffiliation, value: string) =>
    setForm((prev) => {
      const affs = [...prev.academicAffiliations];
      affs[i] = { ...affs[i], [field]: value };
      return { ...prev, academicAffiliations: affs };
    });

  // ── Appointment helpers ──────────────────────────────────────────────────
  const addAppointment = () =>
    setForm((prev) => ({
      ...prev,
      researchAppointments: [...prev.researchAppointments, { org: "", role: "", period: "" }],
    }));

  const removeAppointment = (i: number) =>
    setForm((prev) => ({
      ...prev,
      researchAppointments: prev.researchAppointments.filter((_, idx) => idx !== i),
    }));

  const updateAppointment = (i: number, field: keyof ResearchAppointment, value: string) =>
    setForm((prev) => {
      const appts = [...prev.researchAppointments];
      appts[i] = { ...appts[i], [field]: value };
      return { ...prev, researchAppointments: appts };
    });

  // ── Expertise helpers ────────────────────────────────────────────────────
  const addExpertise = () => {
    const trimmed = expertiseInput.trim();
    if (!trimmed || form.expertiseAreas.includes(trimmed)) return;
    setForm((prev) => ({ ...prev, expertiseAreas: [...prev.expertiseAreas, trimmed] }));
    setExpertiseInput("");
  };

  const removeExpertise = (tag: string) =>
    setForm((prev) => ({
      ...prev,
      expertiseAreas: prev.expertiseAreas.filter((t) => t !== tag),
    }));

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.fullName.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!form.email.trim()) {
      toast.error("Email address is required");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/instructor-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          socialLinks: Object.values(form.socialLinks).some((v) => v.trim())
            ? form.socialLinks
            : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit application");
      }

      toast.success("Application submitted successfully!", {
        description: "Our team will review your profile and get back to you via email.",
        duration: 6000,
      });
      setSubmitted(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Submission failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Success Screen ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-gray-950 dark:via-purple-950/20 dark:to-indigo-950/20 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-5">
              <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Application Submitted!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
              Thank you for applying to become an instructor at{" "}
              <span className="font-semibold text-purple-600">Unfiltered IITians</span>. Our academic
              team will review your profile carefully and reach out to you at{" "}
              <span className="font-semibold">{form.email}</span>.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              You will receive a confirmation email once your application is approved, along with the
              courses assigned to you.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-left space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              What happens next?
            </p>
            <div className="space-y-1.5">
              {[
                "Our team reviews your academic credentials and expertise",
                "Admin assigns relevant courses based on your qualifications",
                "You receive an email with your approval and course details",
                "Your profile goes live on the platform",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex-shrink-0 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </div>
              ))}
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => (window.location.href = "/")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-gray-950 dark:via-purple-950/10 dark:to-indigo-950/10">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-4 py-1.5 text-sm font-medium mb-5">
            <Star className="h-3.5 w-3.5" /> Instructor Application
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">
            Join Unfiltered IITians as an Instructor
          </h1>
          <p className="text-purple-100 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Share your expertise with thousands of aspiring IITians. Fill in the form below — our
            team will review your profile and reach out upon approval.
          </p>
          <div className="flex flex-wrap justify-center gap-6 mt-6 text-sm text-purple-100">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" /> Reach thousands of learners
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4" /> Verified instructor badge
            </div>
            <div className="flex items-center gap-1.5">
              <ChevronRight className="h-4 w-4" /> Get assigned to courses
            </div>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          {/* ── Basic Info ── */}
          <div className="p-6 md:p-8 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-0.5">
                Basic Information
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Fields marked with <span className="text-red-500">*</span> are required.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fullName"
                  placeholder="e.g. Prof. Arjun Mehta"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@institution.edu"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title">
                Title / Designation
              </Label>
              <Input
                id="title"
                placeholder="e.g. Principal Investigator | Quantum & Systems Biologist"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <p className="text-xs text-gray-400">Your professional title as it will appear on course pages.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bio">Bio / About You</Label>
              <Textarea
                id="bio"
                placeholder="Write a short biography highlighting your academic background, research interests, and teaching philosophy..."
                rows={5}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
              <p className="text-xs text-gray-400">This will appear on course detail pages. Keep it concise but informative (150–300 words recommended).</p>
            </div>

            {/* Profile Photo */}
            <div className="space-y-2">
              <Label>Profile Photo</Label>
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-gray-800 flex-shrink-0">
                  {form.profileImageUrl ? (
                    <Image
                      src={form.profileImageUrl}
                      alt="Profile preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <Camera className="h-7 w-7 text-muted-foreground" />
                  )}
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                      e.target.value = "";
                    }}
                  />
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingImage}
                      onClick={() => imageInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      {uploadingImage ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      {uploadingImage ? "Uploading..." : "Upload Photo"}
                    </Button>
                    {form.profileImageUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setForm({ ...form, profileImageUrl: "" })}
                      >
                        <X className="h-3.5 w-3.5 mr-1" /> Remove
                      </Button>
                    )}
                  </div>
                  <Input
                    placeholder="Or paste image URL..."
                    value={form.profileImageUrl}
                    onChange={(e) => setForm({ ...form, profileImageUrl: e.target.value })}
                    className="text-xs h-8"
                  />
                  <p className="text-xs text-gray-400">Professional headshot recommended. Max 5 MB.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800" />

          {/* ── Academic Affiliations ── */}
          <div className="p-6 md:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-purple-600" /> Academic Affiliations
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Universities, colleges, or research institutions you are/were associated with.
                </p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={addAffiliation}>
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>

            {form.academicAffiliations.map((aff, i) => (
              <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3 bg-gray-50 dark:bg-gray-800/50 relative">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="absolute top-3 right-3 h-6 w-6 text-destructive"
                  onClick={() => removeAffiliation(i)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>

                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded border bg-white shrink-0 flex items-center justify-center overflow-hidden mt-0.5">
                    {aff.logoUrl ? (
                      <img
                        src={aff.logoUrl}
                        alt={aff.name}
                        className="h-full w-full object-contain p-1"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 pr-8">
                    <div className="sm:col-span-1">
                      <InstitutionInput
                        value={aff.name}
                        onChange={(val) => updateAffiliation(i, "name", val)}
                        logoUrl={aff.logoUrl}
                        onLogoChange={(url) => updateAffiliation(i, "logoUrl", url)}
                      />
                    </div>
                    <Input
                      placeholder="Degree / Role (e.g. M.Tech, PhD)"
                      value={aff.role}
                      onChange={(e) => updateAffiliation(i, "role", e.target.value)}
                      className="h-9 text-sm"
                    />
                    <Input
                      placeholder="Year (e.g. 2010–2014)"
                      value={aff.year}
                      onChange={(e) => updateAffiliation(i, "year", e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}

            {form.academicAffiliations.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-6 text-center">
                <GraduationCap className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No affiliations added yet. Click &ldquo;Add&rdquo; to add your academic institutions.</p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800" />

          {/* ── Research Appointments ── */}
          <div className="p-6 md:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-blue-600" /> Research & Professional Appointments
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Research positions, postdocs, fellowships, or industry roles.
                </p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={addAppointment}>
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>

            {form.researchAppointments.map((appt, i) => (
              <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800/50 relative">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="absolute top-3 right-3 h-6 w-6 text-destructive"
                  onClick={() => removeAppointment(i)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pr-8">
                  <Input
                    placeholder="Organisation / Institute"
                    value={appt.org}
                    onChange={(e) => updateAppointment(i, "org", e.target.value)}
                    className="h-9 text-sm"
                  />
                  <Input
                    placeholder="Role (e.g. Postdoctoral Associate)"
                    value={appt.role}
                    onChange={(e) => updateAppointment(i, "role", e.target.value)}
                    className="h-9 text-sm"
                  />
                  <Input
                    placeholder="Period (e.g. 2015–2018)"
                    value={appt.period}
                    onChange={(e) => updateAppointment(i, "period", e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            ))}

            {form.researchAppointments.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-6 text-center">
                <FlaskConical className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No appointments added yet.</p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800" />

          {/* ── Expertise Areas ── */}
          <div className="p-6 md:p-8 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Areas of Expertise
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Add tags for the subjects and domains you specialise in.
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Quantum Biology, Thermodynamics, JEE Chemistry..."
                value={expertiseInput}
                onChange={(e) => setExpertiseInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addExpertise();
                  }
                }}
                className="flex-1"
              />
              <Button type="button" size="sm" variant="outline" onClick={addExpertise}>
                Add Tag
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.expertiseAreas.map((tag) => (
                <Badge
                  key={tag}
                  className="gap-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 hover:bg-purple-200 transition-colors"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeExpertise(tag)}
                    className="ml-1 hover:text-red-600 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {form.expertiseAreas.length === 0 && (
                <p className="text-sm text-gray-400">No tags added yet. Press Enter or click &ldquo;Add Tag&rdquo;.</p>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800" />

          {/* ── Awards ── */}
          <div className="p-6 md:p-8 space-y-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Awards & Recognition
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Any notable awards, fellowships, or achievements.
              </p>
            </div>
            <Textarea
              placeholder="e.g. Young Investigator Award (Biophysical Society 2020), DST-INSPIRE Faculty Fellow, MIT Technology Review 35 Innovators Under 35..."
              rows={3}
              value={form.awards}
              onChange={(e) => setForm({ ...form, awards: e.target.value })}
            />
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800" />

          {/* ── Social Links ── */}
          <div className="p-6 md:p-8 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Globe className="h-5 w-5 text-green-600" /> Online Presence
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Add your professional links so students can learn more about you.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" /> Personal Website
                </Label>
                <Input
                  placeholder="https://your-website.com"
                  value={form.socialLinks.website}
                  onChange={(e) =>
                    setForm({ ...form, socialLinks: { ...form.socialLinks, website: e.target.value } })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm flex items-center gap-1.5">
                  <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                </Label>
                <Input
                  placeholder="https://linkedin.com/in/your-profile"
                  value={form.socialLinks.linkedin}
                  onChange={(e) =>
                    setForm({ ...form, socialLinks: { ...form.socialLinks, linkedin: e.target.value } })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">ResearchGate</Label>
                <Input
                  placeholder="https://researchgate.net/profile/..."
                  value={form.socialLinks.researchgate}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      socialLinks: { ...form.socialLinks, researchgate: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Twitter / X</Label>
                <Input
                  placeholder="https://twitter.com/your-handle"
                  value={form.socialLinks.twitter}
                  onChange={(e) =>
                    setForm({ ...form, socialLinks: { ...form.socialLinks, twitter: e.target.value } })
                  }
                />
              </div>
            </div>
          </div>

          {/* ── Submit ── */}
          <div className="p-6 md:p-8 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 space-y-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm text-amber-800 dark:text-amber-300">
              <strong>Before submitting:</strong> Please ensure all information is accurate and up
              to date. Your application will be reviewed by our academic team. Once approved, you
              will receive a notification email with the courses assigned to you. Course assignments
              are at the sole discretion of the admin team.
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Submitting Application...
                </>
              ) : (
                <>
                  Submit Application
                  <ChevronRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>

            <p className="text-center text-xs text-gray-400">
              By submitting, you agree that the information provided is accurate. Your data will be
              reviewed solely for the purpose of instructor onboarding at Unfiltered IITians.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
