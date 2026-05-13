type SpinnerProps = { size?: "sm" | "lg"; className?: string };

export const Spinner = ({ size = "sm", className }: SpinnerProps) => {
  const cls = ["spinner", size === "lg" && "spinner--lg", className].filter(Boolean).join(" ");
  return <span className={cls} role="status" aria-label="Loading" />;
};

export const LoadingState = ({ text }: { text?: string }) => (
  <div className="loading-state">
    <Spinner size="lg" />
    {text && <span>{text}</span>}
  </div>
);
