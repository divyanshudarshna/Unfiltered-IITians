"use client";

import Image from "next/image";

export function UserWelcome({ user }) {
  const imageSrc =
    user?.profileImageUrl?.trim() !== ""
      ? user.profileImageUrl
      : "/default-avatar.png";

  // ✅ Consistent date formatting to avoid hydration issues
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return (
    <div className="flex flex-col items-center text-center mb-8">
      {/* Profile Image */}
      <div className="relative w-30 h-30 rounded-full overflow-hidden border-2 border-primary">
        <Image
          src={imageSrc}
          alt={user?.name || "User"}
          fill
          className="object-cover"
        />
      </div>

      {/* Name */}
      {user?.name && (
        <h2 className="mt-4 text-2xl dark:text-white text-black font-semibold">{user.name}</h2>
      )}

      {/* Email */}
      <p className="text-muted-foreground">{user.email}</p>

      {/* Registered Date */}
      {user?.createdAt && (
        <p className="text-sm text-gray-500 mt-1">
          Registered on: {formatDate(user.createdAt)}
        </p>
      )}
    </div>
  );
}
