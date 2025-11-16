export const getAvatar = ({ picture, email }: { picture: string | null; email: string | null }) => {
  return picture ?? `https://avatar.vercel.sh/${email ?? "user"}`;
};
