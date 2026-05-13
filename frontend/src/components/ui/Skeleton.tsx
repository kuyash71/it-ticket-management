type SkeletonProps = {
  variant?: "text" | "title" | "block" | "circle";
  width?: string | number;
  height?: string | number;
  className?: string;
};

export const Skeleton = ({ variant = "text", width, height, className }: SkeletonProps) => {
  const cls = ["skeleton", `skeleton--${variant}`, className].filter(Boolean).join(" ");
  return <span className={cls} style={{ width, height, display: "block" }} />;
};
