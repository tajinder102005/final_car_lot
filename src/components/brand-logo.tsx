import { CarFront } from "lucide-react";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function BrandLogo({ size = "md", showText = true }: BrandLogoProps) {
  const iconSizes = {
    sm: "size-5",
    md: "size-6",
    lg: "size-8",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
  };

  return (
    <div className="flex items-center gap-2 select-none">
      <CarFront className={`${iconSizes[size]} text-primary flex-shrink-0`} />
      {showText && (
        <span className={`font-display ${textSizes[size]} font-bold tracking-tight text-foreground`}>
          Torque <span className="text-primary">Motors</span>
        </span>
      )}
    </div>
  );
}
