"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PencilIcon } from "lucide-react";
import { UserProfileForm } from "./UserProfileForm";
import Image from "next/image";

export function ProfileCard({ user, onProfileUpdate }) {
  const [open, setOpen] = useState(false);

  // Decide the image to show: uploaded → Clerk image → fallback
  const imageSrc =
    user?.profileImageUrl?.trim()
      ? user.profileImageUrl
      : user?.imageUrl?.trim()
      ? user.imageUrl
      : "/default-avatar.png";

  return (
    <>
      <Card className="relative shadow-md group hover:ring-1 hover:ring-primary transition-all">
        <CardHeader className="flex items-start justify-between">
          <CardTitle>Your Profile</CardTitle>
        <button
  onClick={() => setOpen(true)}
  className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
>
  <PencilIcon className="h-5 w-5" />
</button>
        </CardHeader>

        <CardContent className="space-y-3 text-sm">
          <div className="relative w-20 h-20 rounded-full overflow-hidden border">
            <Image
              src={imageSrc}
              alt="Profile"
              width={80}
              height={80}
              className="w-20 h-20 rounded-full object-cover"
            />
          </div>

          {/* Show Name only if present */}
          {user.name && (
            <p>
              <strong>Name:</strong> {user.name}
            </p>
          )}

          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Phone:</strong> {user.phoneNumber || "Not set"}
          </p>
         <p>
  <strong>DOB:</strong>{" "}
  {user.dob
    ? new Date(user.dob).toLocaleDateString("en-GB") // dd/mm/yyyy
    : "Not set"}
</p>

          <p>
            <strong>Field:</strong> {user.fieldOfStudy || "Not set"}
          </p>
        </CardContent>
      </Card>

      <UserProfileForm
        open={open}
        setOpen={setOpen}
        user={user}
        onSave={onProfileUpdate} // Ensures parent updates
      />
    </>
  );
}
