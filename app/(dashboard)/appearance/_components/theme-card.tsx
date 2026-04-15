import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeCardProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  variant: "light" | "dark";
}

export function ThemeCard({ label, isSelected, onClick, variant }: ThemeCardProps) {
  const isLight = variant === "light";

  return (
    <div className="relative cursor-pointer" onClick={onClick}>
      <div
        className={cn(
          "items-center rounded-md border-2 border-muted p-1",
          isLight ? "hover:border-accent" : "hover:bg-accent hover:text-accent-foreground bg-popover",
          isSelected && "border-primary"
        )}
      >
        <div
          className={cn(
            "space-y-2 rounded-sm p-2",
            isLight ? "bg-[#ecedef]" : "bg-slate-950"
          )}
        >
          <div
            className={cn(
              "space-y-2 rounded-md p-2 shadow-sm",
              isLight ? "bg-white" : "bg-slate-800"
            )}
          >
            <div
              className={cn(
                "h-2 w-[80px] rounded-lg",
                isLight ? "bg-[#ecedef]" : "bg-slate-400"
              )}
            />
            <div
              className={cn(
                "h-2 w-[100px] rounded-lg",
                isLight ? "bg-[#ecedef]" : "bg-slate-400"
              )}
            />
          </div>
          {[1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "flex items-center space-x-2 rounded-md p-2 shadow-sm",
                isLight ? "bg-white" : "bg-slate-800"
              )}
            >
              <div
                className={cn(
                  "h-4 w-4 rounded-full",
                  isLight ? "bg-[#ecedef]" : "bg-slate-400"
                )}
              />
              <div
                className={cn(
                  "h-2 w-[100px] rounded-lg",
                  isLight ? "bg-[#ecedef]" : "bg-slate-400"
                )}
              />
            </div>
          ))}
        </div>
      </div>
      <span className="block w-full p-2 text-center font-normal">{label}</span>
      {isSelected && (
        <div className="absolute top-2 right-2 rounded-full bg-primary p-1 text-primary-foreground">
          <Check className="h-3 w-3" />
        </div>
      )}
    </div>
  );
}
