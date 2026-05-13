type AvatarProps = {
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  title?: string;
};

const initials = (name?: string | null) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
};

export const Avatar = ({ name, size = "md", title }: AvatarProps) => {
  const cls = ["avatar", size !== "md" && `avatar--${size}`].filter(Boolean).join(" ");
  return (
    <span className={cls} title={title ?? name ?? undefined} aria-hidden="true">
      {initials(name)}
    </span>
  );
};
