"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Sparkles,
  Award,
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

type ApprovalStatus = "pending" | "approved" | "rejected" | string;

interface ExistingApplicationResponse {
  id: string;
  fullName: string;
  email: string;
  title: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  academicAffiliations: AcademicAffiliation[];
  researchAppointments: ResearchAppointment[];
  expertiseAreas: string[];
  awards: string | null;
  socialLinks: {
    website?: string;
    linkedin?: string;
    researchgate?: string;
    twitter?: string;
  } | null;
  approvalStatus: ApprovalStatus;
  approvalNotes: string | null;
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

// ── Section wrapper ──────────────────────────────────────────────────────────
function Section({
  number,
  icon,
  title,
  subtitle,
  children,
  action,
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="p-6 md:p-8 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center">
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{number}</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2">
              {icon}
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

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

  const filtered =
    value.trim().length > 0
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
          const res = await fetch(
            `/api/institution-logo?name=${encodeURIComponent(val)}`
          );
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
          className="h-9 text-sm pr-8 bg-white dark:bg-[#12101e] border-gray-200 dark:border-[#2a2440] focus:border-purple-400 dark:focus:border-purple-500"
        />
        {fetchingLogo && (
          <Loader2 className="absolute right-2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
        )}
        {logoUrl && !fetchingLogo && (
          <span className="absolute right-2 text-green-500 text-xs font-bold">✓</span>
        )}
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-[#12101e] border border-gray-200 dark:border-[#2a2440] rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
          {filtered.map((s) => (
            <button
              key={s.domain}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(s)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors border-b border-gray-50 dark:border-[#1e1a2e] last:border-0"
            >
              <img
                src={`https://logo.clearbit.com/${s.domain}`}
                alt={s.name}
                className="h-5 w-5 object-contain rounded flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <span className="truncate text-gray-700 dark:text-gray-300">{s.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function InstructorFormPage() {
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const isEditMode = searchParams.get("edit") === "1";
  const dashboardPath = user?.firstName
    ? `/${encodeURIComponent(user.firstName)}/dashboard`
    : "/";

  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [expertiseInput, setExpertiseInput] = useState("");
  const [loadingExisting, setLoadingExisting] = useState(isEditMode);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<ApprovalStatus>("pending");
  const [approvalNotes, setApprovalNotes] = useState<string | null>(null);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [lastSubmissionWasEdit, setLastSubmissionWasEdit] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditMode) {
      setLoadingExisting(false);
      return;
    }

    if (!isLoaded) return;
    if (!user) {
      setLoadingExisting(false);
      return;
    }

    async function fetchExistingApplication() {
      setLoadingExisting(true);
      try {
        const res = await fetch("/api/instructor-application", { cache: "no-store" });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load your instructor form.");
        }

        const app = data.application as ExistingApplicationResponse | null;
        if (!app) {
          toast.error("No existing instructor application found for your account.");
          setLoadingExisting(false);
          return;
        }

        setApplicationId(app.id);
        setCurrentStatus(app.approvalStatus ?? "pending");
        setApprovalNotes(app.approvalNotes ?? null);
        setForm({
          fullName: app.fullName || "",
          email: app.email || "",
          title: app.title || "",
          bio: app.bio || "",
          profileImageUrl: app.profileImageUrl || "",
          academicAffiliations: app.academicAffiliations ?? [],
          researchAppointments: app.researchAppointments ?? [],
          expertiseAreas: app.expertiseAreas ?? [],
          awards: app.awards || "",
          socialLinks: {
            website: app.socialLinks?.website || "",
            linkedin: app.socialLinks?.linkedin || "",
            researchgate: app.socialLinks?.researchgate || "",
            twitter: app.socialLinks?.twitter || "",
          },
        });
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : "Failed to load instructor application."
        );
      } finally {
        setLoadingExisting(false);
      }
    }

    fetchExistingApplication();
  }, [isEditMode, isLoaded, user]);

  const validateForm = () => {
    if (!form.fullName.trim()) {
      toast.error("Full name is required");
      return false;
    }
    if (!form.email.trim()) {
      toast.error("Email address is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      toast.error("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const submitApplication = async () => {
    setSaving(true);
    try {
      if (isEditMode && !applicationId) {
        throw new Error("No existing instructor application found for this account.");
      }

      const payload = {
        ...form,
        applicationId,
        socialLinks: Object.values(form.socialLinks).some((v) => v.trim())
          ? form.socialLinks
          : null,
      };

      const res = await fetch("/api/instructor-application", {
        method: isEditMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit application");
      }

      if (isEditMode) {
        setCurrentStatus("pending");
        setApprovalNotes(null);
        setLastSubmissionWasEdit(true);
        toast.success("Profile updated and sent for admin approval.", {
          description: "Your status is now pending until the admin approves the latest changes.",
          duration: 7000,
        });
      } else {
        toast.success("Application submitted successfully!", {
          description:
            "Our team will review your profile and get back to you via email.",
          duration: 6000,
        });
      }

      setSubmitted(true);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Submission failed. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

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

  const updateAffiliation = (
    i: number,
    field: keyof AcademicAffiliation,
    value: string
  ) =>
    setForm((prev) => {
      const affs = [...prev.academicAffiliations];
      affs[i] = { ...affs[i], [field]: value };
      return { ...prev, academicAffiliations: affs };
    });

  // ── Appointment helpers ──────────────────────────────────────────────────
  const addAppointment = () =>
    setForm((prev) => ({
      ...prev,
      researchAppointments: [
        ...prev.researchAppointments,
        { org: "", role: "", period: "" },
      ],
    }));

  const removeAppointment = (i: number) =>
    setForm((prev) => ({
      ...prev,
      researchAppointments: prev.researchAppointments.filter((_, idx) => idx !== i),
    }));

  const updateAppointment = (
    i: number,
    field: keyof ResearchAppointment,
    value: string
  ) =>
    setForm((prev) => {
      const appts = [...prev.researchAppointments];
      appts[i] = { ...appts[i], [field]: value };
      return { ...prev, researchAppointments: appts };
    });

  // ── Expertise helpers ────────────────────────────────────────────────────
  const addExpertise = () => {
    const trimmed = expertiseInput.trim();
    if (!trimmed || form.expertiseAreas.includes(trimmed)) return;
    setForm((prev) => ({
      ...prev,
      expertiseAreas: [...prev.expertiseAreas, trimmed],
    }));
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

    if (!validateForm()) return;

    if (isEditMode) {
      setSubmitDialogOpen(true);
      return;
    }

    await submitApplication();
  };

  if (loadingExisting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50/70 to-slate-50 dark:from-[#050408] dark:via-[#0b0714] dark:to-[#060a10] flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-3xl border border-violet-100 dark:border-[#1e1a2e] bg-white dark:bg-[#0e0c1a] p-8 text-center shadow-xl">
          <Loader2 className="h-7 w-7 animate-spin mx-auto text-violet-500 mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Loading your instructor application details...
          </p>
        </div>
      </div>
    );
  }

  if (isEditMode && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50/70 to-slate-50 dark:from-[#050408] dark:via-[#0b0714] dark:to-[#060a10] flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-3xl border border-violet-100 dark:border-[#1e1a2e] bg-white dark:bg-[#0e0c1a] p-8 text-center shadow-xl space-y-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Sign in required</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Please sign in to edit your instructor application.
          </p>
          <Button onClick={() => (window.location.href = "/sign-in")}>Go to Sign In</Button>
        </div>
      </div>
    );
  }

  // ── Success Screen ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/40 to-indigo-50/40 dark:from-[#050408] dark:via-[#0b0714] dark:to-[#06090f] flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <div className="bg-white dark:bg-[#0e0c1a] border border-gray-100 dark:border-[#1e1a2e] rounded-3xl shadow-2xl shadow-purple-100/30 dark:shadow-purple-900/20 p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-green-400/20 blur-xl scale-150" />
                <div className="relative rounded-full bg-gradient-to-br from-green-400/20 to-emerald-400/20 dark:from-green-500/10 dark:to-emerald-500/10 border border-green-200 dark:border-green-800/50 p-5">
                  <CheckCircle2 className="h-14 w-14 text-green-500 dark:text-green-400" />
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                {lastSubmissionWasEdit ? "Profile Updated!" : "Application Submitted!"}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                {lastSubmissionWasEdit ? (
                  <>
                    Your instructor profile changes were submitted successfully. The latest
                    update has been sent to admin for review. Status is now{" "}
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      pending approval
                    </span>
                    .
                  </>
                ) : (
                  <>
                    Thank you for applying to teach at{" "}
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      Unfiltered IITians
                    </span>
                    . Our academic team will review your profile and reach out at{" "}
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {form.email}
                    </span>
                    .
                  </>
                )}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-[#0a0817] border border-gray-100 dark:border-[#1e1a2e] rounded-2xl p-5 text-left space-y-3">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                What happens next
              </p>
              <div className="space-y-3">
                {[
                  {
                    text: "Our team reviews your academic credentials",
                    color: "bg-purple-500",
                  },
                  {
                    text: "Admin assigns courses based on your expertise",
                    color: "bg-indigo-500",
                  },
                  {
                    text: "You get an approval email with course details",
                    color: "bg-blue-500",
                  },
                  {
                    text: "Your profile goes live on the platform",
                    color: "bg-emerald-500",
                  },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded-full ${step.color} flex items-center justify-center text-white text-xs font-bold`}
                    >
                      {i + 1}
                    </div>
                    <span className="text-gray-600 dark:text-gray-400">{step.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full border-gray-200 dark:border-[#2a2440] dark:bg-[#12101e] dark:text-gray-300 dark:hover:bg-[#1a1730] hover:bg-gray-50 transition-colors"
              onClick={() => (window.location.href = lastSubmissionWasEdit ? dashboardPath : "/")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {lastSubmissionWasEdit ? "Back to Dashboard" : "Return to Home"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50/70 to-slate-50 dark:from-[#050408] dark:via-[#0b0714] dark:to-[#060a10]">
      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden bg-violet-800 dark:bg-[#130d23]">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(255,255,255,0.1),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(139,92,246,0.15),transparent)]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMCAwdi02aC02djZoNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />

        <div className="relative max-w-4xl mx-auto px-4 py-14 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-4 py-1.5 text-sm font-medium text-white mb-6">
            <Sparkles className="h-3.5 w-3.5" /> {isEditMode ? "Edit Instructor Profile" : "Instructor Application"}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight text-white tracking-tight">
            {isEditMode ? (
              <>
                Update your{" "}
                <span className="text-violet-200 dark:text-purple-400">Instructor Form</span>
              </>
            ) : (
              <>
                Teach at{" "}
                <span className="text-violet-200 dark:text-purple-400">Unfiltered IITians</span>
              </>
            )}
          </h1>
          <p className="text-violet-100 dark:text-white/60 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            {isEditMode
              ? "Your form is prefilled. Update details and save to send the latest version for admin approval."
              : "Share your expertise with thousands of aspiring IITians. Fill in the form below - our team will review your profile and reach out upon approval."}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { icon: <Users className="h-4 w-4" />, text: "Reach thousands of learners" },
              { icon: <Shield className="h-4 w-4" />, text: "Verified instructor badge" },
              { icon: <Star className="h-4 w-4" />, text: "Assigned to relevant courses" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm text-white"
              >
                {item.icon}
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Form Container ── */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        {isEditMode && (
          <div className="mb-5 rounded-2xl border border-violet-200/70 dark:border-violet-700/30 bg-white/90 dark:bg-[#0e0c1a]/90 p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                Current status: <span className="capitalize">{currentStatus}</span>
              </p>
              <Badge
                className={`capitalize ${
                  currentStatus === "approved"
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-300"
                    : currentStatus === "rejected"
                      ? "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/25 dark:text-rose-300"
                      : "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/25 dark:text-amber-300"
                }`}
              >
                {currentStatus}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              Saving edits will reset status to pending and send your latest profile to admin for approval.
            </p>
            {approvalNotes && (
              <p className="mt-2 text-xs text-rose-700 dark:text-rose-300">
                <strong>Admin note:</strong> {approvalNotes}
              </p>
            )}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-[#0e0c1a] rounded-3xl shadow-2xl shadow-violet-200/50 dark:shadow-purple-900/10 border border-violet-100 dark:border-[#1e1a2e] overflow-hidden"
        >
          {/* ── Basic Info ── */}
          <Section
            number={1}
            icon={null}
            title="Basic Information"
            subtitle={
              <>
                Fields marked with{" "}
                <span className="text-red-500">*</span> are required.
              </>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-gray-700 dark:text-gray-300">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fullName"
                  placeholder="e.g. Prof. Arjun Mehta"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  required
                  className="bg-gray-50 dark:bg-[#12101e] border-gray-200 dark:border-[#2a2440] focus:border-purple-400 dark:focus:border-purple-500 dark:text-gray-100 dark:placeholder:text-gray-600"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@institution.edu"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  readOnly={isEditMode}
                  required
                  className="bg-gray-50 dark:bg-[#12101e] border-gray-200 dark:border-[#2a2440] focus:border-purple-400 dark:focus:border-purple-500 dark:text-gray-100 dark:placeholder:text-gray-600"
                />
                {isEditMode && (
                  <p className="text-xs text-gray-400 dark:text-gray-600">
                    Email is locked to your signed-in account for secure ownership.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-gray-700 dark:text-gray-300">
                Title / Designation
              </Label>
              <Input
                id="title"
                placeholder="e.g. Principal Investigator | Quantum & Systems Biologist"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="bg-gray-50 dark:bg-[#12101e] border-gray-200 dark:border-[#2a2440] focus:border-purple-400 dark:focus:border-purple-500 dark:text-gray-100 dark:placeholder:text-gray-600"
              />
              <p className="text-xs text-gray-400 dark:text-gray-600">
                Your professional title as it will appear on course pages.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bio" className="text-gray-700 dark:text-gray-300">
                Bio / About You
              </Label>
              <Textarea
                id="bio"
                placeholder="Write a short biography highlighting your academic background, research interests, and teaching philosophy..."
                rows={5}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="bg-gray-50 dark:bg-[#12101e] border-gray-200 dark:border-[#2a2440] focus:border-purple-400 dark:focus:border-purple-500 dark:text-gray-100 dark:placeholder:text-gray-600 resize-none"
              />
              <p className="text-xs text-gray-400 dark:text-gray-600">
                Appears on course detail pages. 150–300 words recommended.
              </p>
            </div>

            {/* Profile Photo */}
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Profile Photo</Label>
              <div className="flex items-center gap-5 p-4 bg-gray-50 dark:bg-[#12101e] border border-dashed border-gray-200 dark:border-[#2a2440] rounded-xl">
                <div className="relative h-20 w-20 rounded-full border-2 border-purple-200 dark:border-purple-800/50 overflow-hidden flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 flex-shrink-0">
                  {form.profileImageUrl ? (
                    <Image
                      src={form.profileImageUrl}
                      alt="Profile preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <Camera className="h-7 w-7 text-purple-300 dark:text-purple-700" />
                  )}
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full">
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
                      className="border-purple-200 dark:border-purple-800/50 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                    >
                      {uploadingImage ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      ) : (
                        <Upload className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      {uploadingImage ? "Uploading..." : "Upload Photo"}
                    </Button>
                    {form.profileImageUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                        onClick={() => setForm({ ...form, profileImageUrl: "" })}
                      >
                        <X className="h-3.5 w-3.5 mr-1" /> Remove
                      </Button>
                    )}
                  </div>
                  <Input
                    placeholder="Or paste image URL..."
                    value={form.profileImageUrl}
                    onChange={(e) =>
                      setForm({ ...form, profileImageUrl: e.target.value })
                    }
                    className="text-xs h-8 bg-white dark:bg-[#0e0c1a] border-gray-200 dark:border-[#2a2440] dark:text-gray-300"
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-600">
                    Professional headshot recommended. Max 5 MB.
                  </p>
                </div>
              </div>
            </div>
          </Section>

          <div className="border-t border-gray-100 dark:border-[#1a1730]" />

          {/* ── Academic Affiliations ── */}
          <Section
            number={2}
            icon={<GraduationCap className="h-4 w-4 text-purple-500" />}
            title="Academic Affiliations"
            subtitle="Universities, colleges, or research institutions you are/were associated with."
            action={
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addAffiliation}
                className="border-purple-200 dark:border-purple-800/50 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 shrink-0"
              >
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            }
          >
            {form.academicAffiliations.map((aff, i) => (
              <div
                key={i}
                className="border border-gray-100 dark:border-[#2a2440] rounded-2xl p-4 space-y-3 bg-gray-50/80 dark:bg-[#12101e]/80 relative group"
              >
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="absolute top-3 right-3 h-6 w-6 text-gray-400 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeAffiliation(i)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>

                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl border border-gray-200 dark:border-[#2a2440] bg-white dark:bg-[#0e0c1a] shrink-0 flex items-center justify-center overflow-hidden mt-0.5">
                    {aff.logoUrl ? (
                      <img
                        src={aff.logoUrl}
                        alt={aff.name}
                        className="h-full w-full object-contain p-1.5"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <BookOpen className="h-4 w-4 text-gray-300 dark:text-gray-600" />
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
                      className="h-9 text-sm bg-white dark:bg-[#12101e] border-gray-200 dark:border-[#2a2440] dark:text-gray-100 dark:placeholder:text-gray-600"
                    />
                    <Input
                      placeholder="Year (e.g. 2010–2014)"
                      value={aff.year}
                      onChange={(e) => updateAffiliation(i, "year", e.target.value)}
                      className="h-9 text-sm bg-white dark:bg-[#12101e] border-gray-200 dark:border-[#2a2440] dark:text-gray-100 dark:placeholder:text-gray-600"
                    />
                  </div>
                </div>
              </div>
            ))}

            {form.academicAffiliations.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-200 dark:border-[#2a2440] p-8 text-center">
                <GraduationCap className="h-9 w-9 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                <p className="text-sm text-gray-400 dark:text-gray-600">
                  No affiliations added yet.{" "}
                  <button
                    type="button"
                    onClick={addAffiliation}
                    className="text-purple-500 hover:underline"
                  >
                    Add one
                  </button>
                </p>
              </div>
            )}
          </Section>

          <div className="border-t border-gray-100 dark:border-[#1a1730]" />

          {/* ── Research Appointments ── */}
          <Section
            number={3}
            icon={<FlaskConical className="h-4 w-4 text-blue-500" />}
            title="Research & Professional Appointments"
            subtitle="Research positions, postdocs, fellowships, or industry roles."
            action={
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addAppointment}
                className="border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 shrink-0"
              >
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            }
          >
            {form.researchAppointments.map((appt, i) => (
              <div
                key={i}
                className="border border-gray-100 dark:border-[#2a2440] rounded-2xl p-4 bg-gray-50/80 dark:bg-[#12101e]/80 relative group"
              >
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="absolute top-3 right-3 h-6 w-6 text-gray-400 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeAppointment(i)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pr-8">
                  <Input
                    placeholder="Organisation / Institute"
                    value={appt.org}
                    onChange={(e) => updateAppointment(i, "org", e.target.value)}
                    className="h-9 text-sm bg-white dark:bg-[#12101e] border-gray-200 dark:border-[#2a2440] dark:text-gray-100 dark:placeholder:text-gray-600"
                  />
                  <Input
                    placeholder="Role (e.g. Postdoctoral Associate)"
                    value={appt.role}
                    onChange={(e) => updateAppointment(i, "role", e.target.value)}
                    className="h-9 text-sm bg-white dark:bg-[#12101e] border-gray-200 dark:border-[#2a2440] dark:text-gray-100 dark:placeholder:text-gray-600"
                  />
                  <Input
                    placeholder="Period (e.g. 2015–2018)"
                    value={appt.period}
                    onChange={(e) => updateAppointment(i, "period", e.target.value)}
                    className="h-9 text-sm bg-white dark:bg-[#12101e] border-gray-200 dark:border-[#2a2440] dark:text-gray-100 dark:placeholder:text-gray-600"
                  />
                </div>
              </div>
            ))}

            {form.researchAppointments.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-200 dark:border-[#2a2440] p-8 text-center">
                <FlaskConical className="h-9 w-9 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                <p className="text-sm text-gray-400 dark:text-gray-600">
                  No appointments added.{" "}
                  <button
                    type="button"
                    onClick={addAppointment}
                    className="text-blue-500 hover:underline"
                  >
                    Add one
                  </button>
                </p>
              </div>
            )}
          </Section>

          <div className="border-t border-gray-100 dark:border-[#1a1730]" />

          {/* ── Expertise Areas ── */}
          <Section
            number={4}
            icon={<Sparkles className="h-4 w-4 text-amber-500" />}
            title="Areas of Expertise"
            subtitle="Add tags for the subjects and domains you specialise in."
          >
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Quantum Biology, JEE Chemistry, Thermodynamics..."
                value={expertiseInput}
                onChange={(e) => setExpertiseInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addExpertise();
                  }
                }}
                className="flex-1 bg-gray-50 dark:bg-[#12101e] border-gray-200 dark:border-[#2a2440] focus:border-amber-400 dark:focus:border-amber-500 dark:text-gray-100 dark:placeholder:text-gray-600"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addExpertise}
                className="border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 shrink-0"
              >
                Add Tag
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[2rem]">
              {form.expertiseAreas.map((tag) => (
                <Badge
                  key={tag}
                  className="gap-1 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700/40 hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeExpertise(tag)}
                    className="ml-0.5 hover:text-red-500 transition-colors"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
              {form.expertiseAreas.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-600">
                  No tags added. Press Enter or click &ldquo;Add Tag&rdquo;.
                </p>
              )}
            </div>
          </Section>

          <div className="border-t border-gray-100 dark:border-[#1a1730]" />

          {/* ── Awards ── */}
          <Section
            number={5}
            icon={<Award className="h-4 w-4 text-yellow-500" />}
            title="Awards & Recognition"
            subtitle="Notable awards, fellowships, or achievements."
          >
            <Textarea
              placeholder="e.g. Young Investigator Award (Biophysical Society 2020), DST-INSPIRE Faculty Fellow, MIT Technology Review 35 Innovators Under 35..."
              rows={3}
              value={form.awards}
              onChange={(e) => setForm({ ...form, awards: e.target.value })}
              className="bg-gray-50 dark:bg-[#12101e] border-gray-200 dark:border-[#2a2440] focus:border-yellow-400 dark:focus:border-yellow-600 dark:text-gray-100 dark:placeholder:text-gray-600 resize-none"
            />
          </Section>

          <div className="border-t border-gray-100 dark:border-[#1a1730]" />

          {/* ── Social Links ── */}
          <Section
            number={6}
            icon={<Globe className="h-4 w-4 text-green-500" />}
            title="Online Presence"
            subtitle="Add your professional links so students can learn more about you."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-green-500" /> Personal Website
                </Label>
                <Input
                  placeholder="https://your-website.com"
                  value={form.socialLinks.website}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      socialLinks: { ...form.socialLinks, website: e.target.value },
                    })
                  }
                  className="bg-gray-50 dark:bg-[#12101e] border-gray-200 dark:border-[#2a2440] dark:text-gray-100 dark:placeholder:text-gray-600"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                  <Linkedin className="h-3.5 w-3.5 text-blue-500" /> LinkedIn
                </Label>
                <Input
                  placeholder="https://linkedin.com/in/your-profile"
                  value={form.socialLinks.linkedin}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      socialLinks: { ...form.socialLinks, linkedin: e.target.value },
                    })
                  }
                  className="bg-gray-50 dark:bg-[#12101e] border-gray-200 dark:border-[#2a2440] dark:text-gray-100 dark:placeholder:text-gray-600"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-gray-600 dark:text-gray-400">
                  ResearchGate
                </Label>
                <Input
                  placeholder="https://researchgate.net/profile/..."
                  value={form.socialLinks.researchgate}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      socialLinks: {
                        ...form.socialLinks,
                        researchgate: e.target.value,
                      },
                    })
                  }
                  className="bg-gray-50 dark:bg-[#12101e] border-gray-200 dark:border-[#2a2440] dark:text-gray-100 dark:placeholder:text-gray-600"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-gray-600 dark:text-gray-400">
                  Twitter / X
                </Label>
                <Input
                  placeholder="https://twitter.com/your-handle"
                  value={form.socialLinks.twitter}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      socialLinks: { ...form.socialLinks, twitter: e.target.value },
                    })
                  }
                  className="bg-gray-50 dark:bg-[#12101e] border-gray-200 dark:border-[#2a2440] dark:text-gray-100 dark:placeholder:text-gray-600"
                />
              </div>
            </div>
          </Section>

          {/* ── Submit Footer ── */}
          <div className="p-6 md:p-8 bg-gradient-to-b from-gray-50/80 to-gray-100/60 dark:from-[#0a0817] dark:to-[#08061a] border-t border-gray-100 dark:border-[#1a1730] space-y-4">
            <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-500/5 border border-amber-200/70 dark:border-amber-700/20 rounded-xl p-4 text-sm">
              <div className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-amber-400/30 flex items-center justify-center">
                <span className="text-amber-600 dark:text-amber-400 text-[10px] font-bold">!</span>
              </div>
              <p className="text-amber-800 dark:text-amber-400/80 text-xs leading-relaxed">
                <strong className="font-semibold">Before submitting:</strong> Ensure all
                information is accurate and up to date. {isEditMode
                  ? "Any updates will be re-reviewed by admin before your profile becomes approved again."
                  : "Once approved, you will receive an email with the courses assigned to you."} Course assignments are at the sole discretion of the admin team.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 dark:shadow-emerald-900/40 border-0 transition-all duration-200 hover:shadow-emerald-900/30 hover:scale-[1.01]"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  {isEditMode ? "Saving Changes..." : "Submitting Application..."}
                </>
              ) : (
                <>
                  {isEditMode ? "Save Changes" : "Submit Application"}
                  <ChevronRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>

            <p className="text-center text-xs text-gray-400 dark:text-gray-600">
              By submitting, you agree that the information provided is accurate. Your data
              will be reviewed solely for instructor onboarding at Unfiltered IITians.
            </p>
          </div>
        </form>

        <AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Send updated profile for approval?</AlertDialogTitle>
              <AlertDialogDescription>
                Saving these changes will reset your instructor status to pending until admin
                reviews and approves the updated profile.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={saving}
                onClick={(event) => {
                  event.preventDefault();
                  setSubmitDialogOpen(false);
                  void submitApplication();
                }}
              >
                {saving ? "Saving..." : "Yes, submit for approval"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
