"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
} from "lucide-react";

// ── Institution suggestions (name + clearbit domain) ──────────────────────────
const INSTITUTION_SUGGESTIONS: { name: string; domain: string }[] = [
  { name: "IIT Bombay", domain: "iitb.ac.in" },
  { name: "IIT Delhi", domain: "iitd.ac.in" },
  { name: "IIT Madras", domain: "iitm.ac.in" },
  { name: "IIT Roorkee", domain: "iitr.ac.in" },
  { name: "IIT Kanpur", domain: "iitk.ac.in" },
  { name: "IIT Kharagpur", domain: "iitkgp.ac.in" },
  { name: "IIT Guwahati", domain: "iitg.ac.in" },
  { name: "IIT Hyderabad", domain: "iith.ac.in" },
  { name: "IIT Bhubaneswar", domain: "iitbbs.ac.in" },
  { name: "IIT Gandhinagar", domain: "iitgn.ac.in" },
  { name: "IIT Jodhpur", domain: "iitj.ac.in" },
  { name: "IIT Mandi", domain: "iitmandi.ac.in" },
  { name: "IIT Patna", domain: "iitp.ac.in" },
  { name: "IIT Ropar", domain: "iitrpr.ac.in" },
  { name: "IIT Indore", domain: "iiti.ac.in" },
  { name: "IIT (BHU) Varanasi", domain: "iitbhu.ac.in" },
  { name: "AIIMS Delhi", domain: "aiims.edu" },
  { name: "JNU (Jawaharlal Nehru University)", domain: "jnu.ac.in" },
  { name: "University of Delhi", domain: "du.ac.in" },
  { name: "BITS Pilani", domain: "bits-pilani.ac.in" },
  { name: "NIT Trichy", domain: "nitt.edu" },
  { name: "NIT Warangal", domain: "nitw.ac.in" },
  { name: "IISc Bangalore", domain: "iisc.ac.in" },
  { name: "TIFR Mumbai", domain: "tifr.res.in" },
  { name: "MIT", domain: "mit.edu" },
  { name: "Harvard University", domain: "harvard.edu" },
  { name: "Stanford University", domain: "stanford.edu" },
  { name: "University of Oxford", domain: "ox.ac.uk" },
  { name: "University of Cambridge", domain: "cam.ac.uk" },
  { name: "Johns Hopkins University", domain: "jhu.edu" },
  { name: "Yale University", domain: "yale.edu" },
  { name: "Caltech", domain: "caltech.edu" },
  { name: "Princeton University", domain: "princeton.edu" },
  { name: "Columbia University", domain: "columbia.edu" },
  { name: "UC Berkeley", domain: "berkeley.edu" },
  { name: "UC San Diego", domain: "ucsd.edu" },
  { name: "UCL (University College London)", domain: "ucl.ac.uk" },
  { name: "Imperial College London", domain: "imperial.ac.uk" },
  { name: "ETH Zurich", domain: "ethz.ch" },
  { name: "EMBL Heidelberg", domain: "embl.org" },
  { name: "Johns Hopkins Medicine", domain: "hopkinsmedicine.org" },
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

interface InstructorFormData {
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
  isActive: boolean;
  order: number;
}

const emptyForm = (): InstructorFormData => ({
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
  isActive: true,
  order: 0,
});

interface InstructorFormProps {
  initial?: Partial<InstructorFormData> & { id?: string };
  onSuccess: (instructor: Record<string, unknown>) => void;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = value.trim().length > 0
    ? INSTITUTION_SUGGESTIONS.filter((s) =>
        s.name.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8)
    : [];

  const handleSelect = (suggestion: { name: string; domain: string }) => {
    onChange(suggestion.name);
    // Immediately set Clearbit logo URL (no network call needed)
    onLogoChange(`https://logo.clearbit.com/${suggestion.domain}`);
    setOpen(false);
  };

  const handleInputChange = (val: string) => {
    onChange(val);
    setOpen(true);
    onLogoChange(""); // clear logo when typing manually

    // Debounce fallback logo fetch for custom (non-suggestion) institutions
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    fetchTimerRef.current = setTimeout(async () => {
      if (!val.trim()) return;
      // Only fetch if no suggestion matched
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
    <div ref={containerRef} className="relative">
      <div className="relative flex items-center">
        <Input
          placeholder="Search institution..."
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => value.trim().length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="h-8 text-sm pr-8"
        />
        {fetchingLogo && (
          <Loader2 className="absolute right-2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
        )}
        {logoUrl && !fetchingLogo && (
          <span className="absolute right-2 text-green-500 text-xs font-bold">✓</span>
        )}
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {filtered.map((s) => (
            <button
              key={s.domain}
              type="button"
              onMouseDown={(e) => e.preventDefault()} // prevent blur before click
              onClick={() => handleSelect(s)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
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

// ── Main Form ─────────────────────────────────────────────────────────────────
export default function InstructorForm({ initial, onSuccess }: InstructorFormProps) {
  const [form, setForm] = useState<InstructorFormData>(() => ({
    ...emptyForm(),
    ...(initial ?? {}),
    academicAffiliations: (initial?.academicAffiliations as AcademicAffiliation[]) ?? [],
    researchAppointments: (initial?.researchAppointments as ResearchAppointment[]) ?? [],
    expertiseAreas: initial?.expertiseAreas ?? [],
    socialLinks: {
      website: "",
      linkedin: "",
      researchgate: "",
      twitter: "",
      ...((initial?.socialLinks as Record<string, string>) ?? {}),
    },
  }));

  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [expertiseInput, setExpertiseInput] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);

  // ── Profile Image Upload ──────────────────────────────────────────────────
  const handleImageUpload = async (file: File) => {
    if (!file) return;
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
      toast.success("Profile photo uploaded");
    } catch {
      toast.error("Failed to upload image. Try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  // ── Affiliation helpers ───────────────────────────────────────────────────
  const addAffiliation = () => {
    setForm((prev) => ({
      ...prev,
      academicAffiliations: [
        ...prev.academicAffiliations,
        { name: "", role: "", year: "", logoUrl: "" },
      ],
    }));
  };

  const removeAffiliation = (i: number) => {
    setForm((prev) => ({
      ...prev,
      academicAffiliations: prev.academicAffiliations.filter((_, idx) => idx !== i),
    }));
  };

  const updateAffiliation = (i: number, field: keyof AcademicAffiliation, value: string) => {
    setForm((prev) => {
      const affiliations = [...prev.academicAffiliations];
      affiliations[i] = { ...affiliations[i], [field]: value };
      return { ...prev, academicAffiliations: affiliations };
    });
  };

  // ── Research helpers ──────────────────────────────────────────────────────
  const addAppointment = () => {
    setForm((prev) => ({
      ...prev,
      researchAppointments: [...prev.researchAppointments, { org: "", role: "", period: "" }],
    }));
  };

  const removeAppointment = (i: number) => {
    setForm((prev) => ({
      ...prev,
      researchAppointments: prev.researchAppointments.filter((_, idx) => idx !== i),
    }));
  };

  const updateAppointment = (
    i: number,
    field: keyof ResearchAppointment,
    value: string
  ) => {
    setForm((prev) => {
      const appts = [...prev.researchAppointments];
      appts[i] = { ...appts[i], [field]: value };
      return { ...prev, researchAppointments: appts };
    });
  };

  // ── Expertise helpers ─────────────────────────────────────────────────────
  const addExpertise = () => {
    const trimmed = expertiseInput.trim();
    if (!trimmed || form.expertiseAreas.includes(trimmed)) return;
    setForm((prev) => ({ ...prev, expertiseAreas: [...prev.expertiseAreas, trimmed] }));
    setExpertiseInput("");
  };

  const removeExpertise = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      expertiseAreas: prev.expertiseAreas.filter((t) => t !== tag),
    }));
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      toast.error("Full name is required");
      return;
    }

    setSaving(true);
    try {
      const isEdit = !!initial?.id;
      const url = isEdit
        ? `/api/admin/instructors/${initial!.id}`
        : "/api/admin/instructors";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          socialLinks: Object.values(form.socialLinks).some((v) => v.trim())
            ? form.socialLinks
            : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      const saved = await res.json();
      toast.success(`Instructor ${isEdit ? "updated" : "created"} successfully`);
      onSuccess(saved);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save instructor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
      {/* ── Basic Info ── */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Basic Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="fullName">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fullName"
              placeholder="e.g. Prof. Arjun Mehta"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="instructor@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="title">Title / Designation</Label>
          <Input
            id="title"
            placeholder="e.g. Principal Investigator | Quantum & Systems Biologist"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            placeholder="Short biography shown on the course page..."
            rows={4}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </div>

        {/* ── Profile Image Upload ── */}
        <div className="space-y-2">
          <Label>Profile Photo</Label>
          <div className="flex items-center gap-4">
            {/* Avatar preview */}
            <div className="relative h-16 w-16 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-gray-800 flex-shrink-0">
              {form.profileImageUrl ? (
                <Image
                  src={form.profileImageUrl}
                  alt="Profile preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <Camera className="h-6 w-6 text-muted-foreground" />
              )}
              {uploadingImage && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2">
              {/* Hidden file input */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                  e.target.value = ""; // reset so same file can be re-selected
                }}
              />

              <div className="flex gap-2">
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

              {/* Optional: paste URL directly */}
              <Input
                placeholder="Or paste image URL directly..."
                value={form.profileImageUrl}
                onChange={(e) => setForm({ ...form, profileImageUrl: e.target.value })}
                className="text-xs h-8"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            checked={form.isActive}
            onCheckedChange={(v) => setForm({ ...form, isActive: v })}
          />
          <Label>Active</Label>
        </div>
      </div>

      {/* ── Academic Affiliations ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <GraduationCap className="h-4 w-4" /> Academic Affiliations
          </h3>
          <Button type="button" size="sm" variant="outline" onClick={addAffiliation}>
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>

        {form.academicAffiliations.map((aff, i) => (
          <div key={i} className="border rounded-lg p-3 space-y-2 bg-muted/30 relative">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2 h-6 w-6 text-destructive"
              onClick={() => removeAffiliation(i)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>

            <div className="flex items-start gap-3">
              {/* Logo preview */}
              <div className="relative h-10 w-10 rounded border bg-white shrink-0 flex items-center justify-center overflow-hidden mt-0.5">
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
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 pr-8">
                {/* Institution name with autocomplete */}
                <InstitutionInput
                  value={aff.name}
                  onChange={(val) => updateAffiliation(i, "name", val)}
                  logoUrl={aff.logoUrl}
                  onLogoChange={(url) => updateAffiliation(i, "logoUrl", url)}
                />
                <Input
                  placeholder="Role (e.g. M.Tech, PhD)"
                  value={aff.role}
                  onChange={(e) => updateAffiliation(i, "role", e.target.value)}
                  className="h-8 text-sm"
                />
                <Input
                  placeholder="Year (e.g. 2010–2014)"
                  value={aff.year}
                  onChange={(e) => updateAffiliation(i, "year", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>
        ))}

        {form.academicAffiliations.length === 0 && (
          <p className="text-xs text-muted-foreground italic">
            No affiliations yet. Click &quot;Add&quot; to add institutions.
          </p>
        )}
      </div>

      {/* ── Research Appointments ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <FlaskConical className="h-4 w-4" /> Research Appointments
          </h3>
          <Button type="button" size="sm" variant="outline" onClick={addAppointment}>
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>

        {form.researchAppointments.map((appt, i) => (
          <div key={i} className="border rounded-lg p-3 bg-muted/30 relative">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2 h-6 w-6 text-destructive"
              onClick={() => removeAppointment(i)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pr-8">
              <Input
                placeholder="Organisation"
                value={appt.org}
                onChange={(e) => updateAppointment(i, "org", e.target.value)}
                className="h-8 text-sm"
              />
              <Input
                placeholder="Role (e.g. Postdoctoral Associate)"
                value={appt.role}
                onChange={(e) => updateAppointment(i, "role", e.target.value)}
                className="h-8 text-sm"
              />
              <Input
                placeholder="Period (e.g. 2015–2018)"
                value={appt.period}
                onChange={(e) => updateAppointment(i, "period", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>
        ))}

        {form.researchAppointments.length === 0 && (
          <p className="text-xs text-muted-foreground italic">No appointments yet.</p>
        )}
      </div>

      {/* ── Expertise Areas ── */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Expertise Areas
        </h3>
        <div className="flex gap-2">
          <Input
            placeholder="e.g. Quantum Biology"
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
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-1">
          {form.expertiseAreas.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                type="button"
                onClick={() => removeExpertise(tag)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      {/* ── Awards ── */}
      <div className="space-y-1">
        <Label htmlFor="awards">Awards &amp; Recognition</Label>
        <Textarea
          id="awards"
          placeholder="e.g. Young Investigator Award (Biophysical Society 2020), MIT Technology Review Innovator..."
          rows={2}
          value={form.awards}
          onChange={(e) => setForm({ ...form, awards: e.target.value })}
        />
      </div>

      {/* ── Social Links ── */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Globe className="h-4 w-4" /> Social Links
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Website</Label>
            <Input
              placeholder="https://..."
              value={form.socialLinks.website}
              onChange={(e) =>
                setForm({ ...form, socialLinks: { ...form.socialLinks, website: e.target.value } })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="flex items-center gap-1 text-xs">
              <Linkedin className="h-3 w-3" /> LinkedIn
            </Label>
            <Input
              placeholder="https://linkedin.com/in/..."
              value={form.socialLinks.linkedin}
              onChange={(e) =>
                setForm({ ...form, socialLinks: { ...form.socialLinks, linkedin: e.target.value } })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">ResearchGate</Label>
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
          <div className="space-y-1">
            <Label className="text-xs">Twitter / X</Label>
            <Input
              placeholder="https://twitter.com/..."
              value={form.socialLinks.twitter}
              onChange={(e) =>
                setForm({ ...form, socialLinks: { ...form.socialLinks, twitter: e.target.value } })
              }
            />
          </div>
        </div>
      </div>

      {/* ── Submit ── */}
      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : initial?.id ? (
          "Update Instructor"
        ) : (
          "Create Instructor"
        )}
      </Button>
    </form>
  );
}
