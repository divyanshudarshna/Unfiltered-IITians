"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRef, useState } from "react";
import { updateUserProfile } from "@/lib/api/user";
import { toast } from "sonner";
import Image from "next/image";
import { PencilIcon } from "lucide-react";
import { useUserProfileContext } from "@/contexts/UserProfileContext";
import { profileUpdateEmitter } from "@/lib/profileUpdateEmitter";

export function UserProfileForm({ open, setOpen, user, onSave }) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { refreshProfile } = useUserProfileContext();

  const [form, setForm] = useState({
    name: user.name || "",
    phoneNumber: user.phoneNumber || "",
    dob: user.dob ? new Date(user.dob).toISOString().split("T")[0] : "",
    fieldOfStudy: user.fieldOfStudy || "",
    profileImageUrl: user.profileImageUrl || user.imageUrl || "/default-avatar.png",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    toast("Uploading image...");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setForm({ ...form, profileImageUrl: data.url });
      toast.success("Uploaded!");
    } catch (error) {
      // console.error("Image upload error:", error);
      toast.error("Image upload failed.");
    }
  };

const handleSubmit = async () => {
  setLoading(true);
  try {
    // console.log('🔄 Updating profile with:', form);
    
    const res = await updateUserProfile({
      clerkUserId: user.clerkUserId,
      ...form,
    });
    
    // console.log('✅ Profile update response:', res.user);
    
    toast.success("Profile updated!");
    setOpen(false);
    
    // Update local dashboard state immediately
    onSave(res.user);
    
    // Emit global update event to trigger all profile components to refresh
    // console.log('📡 Emitting profile update event...');
    setTimeout(() => {
      profileUpdateEmitter.emit();
    }, 100);
    
    // Also manually refresh context as backup
    // console.log('🔄 Refreshing global context...');
    setTimeout(async () => {
      await refreshProfile();
      // console.log('✅ All updates completed');
    }, 200);
    
  } catch (error) {
    // console.error("❌ Profile update error:", error);
    toast.error("Failed to update.");
  } finally {
    setLoading(false);
  }
};
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        {/* Profile Image */}
        <div className="flex justify-center mb-4">
          <button
            type="button"
            className="relative w-24 h-24 rounded-full overflow-hidden group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Image
              src={form.profileImageUrl || "/default-avatar.png"}
              alt="Profile"
              fill
              className="object-cover"
            />
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <PencilIcon className="h-6 w-6 text-white" />
            </div>
          </button>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
        </div>

        {/* Input Fields */}
        <div className="grid gap-4 py-2">
          <div>
            <Label>Name</Label>
            <Input name="name" value={form.name} onChange={handleChange} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} />
          </div>
          <div>
            <Label>DOB</Label>
            <Input type="date" name="dob" value={form.dob} onChange={handleChange} />
          </div>
          <div>
            <Label>Field of Study</Label>
            <Input name="fieldOfStudy" value={form.fieldOfStudy} onChange={handleChange} />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
