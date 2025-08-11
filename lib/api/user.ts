// lib/api/user.ts
export async function fetchUserProfile(clerkUserId: string) {
  const res = await fetch(`/api/user/profile?clerkUserId=${clerkUserId}`);
  if (!res.ok) throw new Error('Failed to fetch user');
  const data = await res.json();
  return data.user;
}

export const updateUserProfile = async (data: any) => {
  const res = await fetch(`/api/user/profile/update`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to update user");

  return res.json();
};

