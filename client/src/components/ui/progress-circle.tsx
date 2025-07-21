import { cn } from "@/lib/utils";

interface ProgressCircleProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  showValue?: boolean;
}

export function ProgressCircle({ 
  value, 
  max = 100, 
  size = "md", 
  className,
  showValue = true 
}: ProgressCircleProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-32 h-32", 
    lg: "w-40 h-40"
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-2xl",
    lg: "text-3xl"
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <svg 
        className="w-full h-full transform -rotate-90" 
        viewBox="0 0 120 120"
      >
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="8"
        />
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-bold text-slate-800", textSizeClasses[size])}>
            {Math.round(value)}
          </span>
          <span className="text-xs text-slate-500 font-medium">/ {max}</span>
        </div>
      )}
    </div>
  );
}
