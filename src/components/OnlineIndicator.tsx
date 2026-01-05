import { cn } from "@/lib/utils";

interface OnlineIndicatorProps {
  isOnline: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function OnlineIndicator({ 
  isOnline, 
  size = "sm", 
  showLabel = false,
  className 
}: OnlineIndicatorProps) {
  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "rounded-full",
          sizeClasses[size],
          isOnline 
            ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" 
            : "bg-muted-foreground/40"
        )}
      />
      {showLabel && (
        <span className={cn(
          "text-xs",
          isOnline ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
        )}>
          {isOnline ? "Online" : "Offline"}
        </span>
      )}
    </div>
  );
}
