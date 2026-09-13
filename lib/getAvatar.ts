export function getAvatar({ picture, email }: { picture?: string | null; email?: string | null }) {
  const normalizedPicture = picture?.trim();
  if (normalizedPicture) return normalizedPicture;

  return `https://avatar.vercel.sh/${email?.trim() || "user"}`;
}
