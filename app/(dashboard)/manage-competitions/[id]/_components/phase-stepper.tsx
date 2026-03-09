"use client";

import { useTranslation } from "@/lib/i18n";
import { CompetitionPhase } from "@/types/competition";
import { Check, Circle } from "lucide-react";

interface PhaseStepperProps {
  currentPhase: CompetitionPhase;
  onPhaseClick: (phase: CompetitionPhase) => void;
}

const PHASE_ORDER: CompetitionPhase[] = [
  "registration",
  "payment",
  "qualification",
  "group_stage",
  "completed",
];

export function PhaseStepper({ currentPhase, onPhaseClick }: PhaseStepperProps) {
  const { t } = useTranslation();

  const phaseLabels: Record<CompetitionPhase, string> = {
    registration: t("competition.phase_registration"),
    payment: t("competition.phase_payment"),
    qualification: t("competition.phase_qualification"),
    group_stage: t("competition.phase_group_stage"),
    completed: t("competition.phase_completed"),
  };

  const currentIndex = PHASE_ORDER.indexOf(currentPhase);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Background line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-border" />
        {/* Progress line */}
        <div
          className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-500"
          style={{
            width: `${currentIndex >= PHASE_ORDER.length - 1 ? 100 : (currentIndex / (PHASE_ORDER.length - 1)) * 100}%`,
          }}
        />

        {PHASE_ORDER.map((phase, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div
              key={phase}
              className="relative flex flex-col items-center z-10"
            >
              {/* Circle — ALL clickable */}
              <button
                type="button"
                onClick={() => onPhaseClick(phase)}
                className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 cursor-pointer hover:scale-110 ${
                  isCompleted
                    ? "bg-primary border-primary text-primary-foreground"
                    : isCurrent
                    ? "bg-primary/10 border-primary text-primary ring-4 ring-primary/20"
                    : "bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-primary/70"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Circle className={`h-3 w-3 ${isCurrent ? "fill-primary text-primary" : ""}`} />
                )}
              </button>

              {/* Label */}
              <span
                className={`mt-2 text-[11px] font-medium text-center whitespace-nowrap transition-colors ${
                  isCompleted
                    ? "text-primary"
                    : isCurrent
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                {phaseLabels[phase]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
