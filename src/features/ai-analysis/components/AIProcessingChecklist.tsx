"use client";

import React from "react";
import { Check, Sparkles } from "lucide-react";

export type ProcessingStep =
  | "uploading"
  | "extracting"
  | "analyzing"
  | "matching"
  | "success";

interface StepItem {
  id: ProcessingStep;
  title: string;
  description: string;
}

export default function AIProcessingChecklist({
  currentStep,
}: {
  currentStep: ProcessingStep;
}) {
  const steps: StepItem[] = [
    {
      id: "uploading",
      title: "Uploading resume",
      description: "Storing your PDF securely in our cloud storage",
    },
    {
      id: "extracting",
      title: "Extracting text",
      description: "Parsing document layout and reading professional history",
    },
    {
      id: "analyzing",
      title: "Analyzing profile",
      description: "Identifying technical skills, soft skills, and experiences",
    },
    {
      id: "matching",
      title: "Matching career path",
      description: "Aligning your profile with market opportunities",
    },
  ];

  const getStepStatus = (stepId: ProcessingStep) => {
    const stepOrder: ProcessingStep[] = [
      "uploading",
      "extracting",
      "analyzing",
      "matching",
      "success",
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(stepId);

    if (currentIndex > stepIndex) return "completed";
    if (currentIndex === stepIndex) return "active";
    return "pending";
  };

  const getProgressPercentage = () => {
    switch (currentStep) {
      case "uploading":
        return 25;
      case "extracting":
        return 50;
      case "analyzing":
        return 75;
      case "matching":
        return 90;
      case "success":
        return 100;
      default:
        return 0;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto border border-border bg-card/50 rounded-[6px] overflow-hidden transition-all duration-200">
      <div className="w-full h-1 bg-secondary">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>

      <div className="p-6">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="p-1.5 rounded-[6px] bg-primary/10 text-primary">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-[20px] font-semibold font-heading text-foreground tracking-tight">
            AI Career Analysis
          </h3>
        </div>

        <div className="space-y-6">
          {steps.map((step) => {
            const status = getStepStatus(step.id);

            return (
              <div
                key={step.id}
                className={`flex gap-4 transition-all duration-200 ${
                  status === "pending" ? "opacity-40" : "opacity-100"
                }`}
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-6 h-6 rounded-[6px] flex items-center justify-center border text-[12px] font-medium
                      ${
                        status === "completed"
                          ? "bg-primary text-primary-foreground border-primary"
                          : status === "active"
                            ? "bg-secondary border-primary text-primary"
                            : "bg-transparent border-border text-muted-foreground"
                      }
                    `}
                  >
                    {status === "completed" ? (
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    ) : status === "active" ? (
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <h4
                    className={`text-[14px] font-medium leading-none ${
                      status === "active"
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.title}
                  </h4>
                  <p className="text-[12px] text-muted-foreground/80 mt-1 font-sans">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
