"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PencilIcon } from "lucide-react";
import { UserProfileForm } from "./UserProfileForm";
import { UserAvatar } from "@/components/UserAvatar";

interface ProfileCardProps {
  user: {
    name?: string | null
    email?: string
    phoneNumber?: string | null
    dob?: Date | string | null
    fieldOfStudy?: string | null
    profileImageUrl?: string | null
    imageUrl?: string | null
    clerkUserId?: string
  }
  onProfileUpdate: (updatedUser: unknown) => void
}

export function ProfileCard({ user, onProfileUpdate }: Readonly<ProfileCardProps>) {
  const [open, setOpen] = useState(false);

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
          <div className="relative w-20 h-20">
            <UserAvatar 
              key={user.profileImageUrl || user.imageUrl || user.name} 
              size={80} 
              className="border-2 border-gray-200 dark:border-gray-700" 
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
