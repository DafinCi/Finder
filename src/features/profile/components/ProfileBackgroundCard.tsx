"use client";

import React from "react";
import {
  GraduationCap,
  Building2,
  FolderGit2,
  ExternalLink,
  Edit3,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackgroundEvidence } from "../types/career-profile.types";

interface ProfileBackgroundCardProps {
  background: BackgroundEvidence | undefined;
  onEdit: () => void;
  className?: string;
}

export function ProfileBackgroundCard({
  background,
  onEdit,
  className = "rounded-sm border border-border bg-card p-5 space-y-6 shadow-2xs",
}: ProfileBackgroundCardProps) {
  const educationList = background?.education || [];
  const experienceList = background?.experience || [];
  const projectList = background?.projects || [];

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-sm bg-secondary border border-border flex items-center justify-center text-muted-foreground shrink-0">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold font-heading text-foreground">
              Work History & Credentials
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Contextual timeline of your professional experience and education.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="text-xs h-9 min-h-[36px] sm:h-8 gap-1.5 border-border hover:bg-secondary/70 focus-visible:ring-2 focus-visible:ring-muted-foreground self-start sm:self-auto rounded-sm"
        >
          <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Edit Background</span>
        </Button>
      </div>

      {/* Experience Section */}
      <div className="space-y-3">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Building2 className="w-3 h-3 text-muted-foreground" />
          Work Experience ({experienceList.length})
        </span>

        {experienceList.length > 0 ? (
          <div className="space-y-2.5">
            {experienceList.map((exp) => (
              <div
                key={exp.id || `${exp.company_name}-${exp.role_title}`}
                className="p-3.5 rounded-sm bg-secondary/30 border border-border/70 space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-foreground">
                      {exp.role_title}
                    </h3>
                    <p className="text-xs text-muted-foreground font-medium">
                      {exp.company_name}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-sans">
                    <Calendar className="w-3 h-3" />
                    {exp.start_date || "N/A"} -{" "}
                    {exp.is_current ? "Present" : exp.end_date || "N/A"}
                  </span>
                </div>

                {exp.description_summary && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {exp.description_summary}
                  </p>
                )}

                {exp.technologies_used && exp.technologies_used.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {exp.technologies_used.map((t) => (
                      <span
                        key={t}
                        className="px-1.5 py-0.5 rounded-sm bg-secondary text-[10px] text-foreground font-mono"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            No work experience listed yet.
          </p>
        )}
      </div>

      {/* Education Section */}
      <div className="space-y-3 pt-2 border-t border-border/60">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <GraduationCap className="w-3 h-3 text-muted-foreground" />
          Education ({educationList.length})
        </span>

        {educationList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {educationList.map((edu) => (
              <div
                key={edu.id || `${edu.institution}-${edu.degree}`}
                className="p-3 rounded-sm bg-secondary/30 border border-border/70 space-y-1"
              >
                <h3 className="text-xs font-bold text-foreground">
                  {edu.institution}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {edu.degree}{" "}
                  {edu.field_of_study ? `• ${edu.field_of_study}` : ""}
                </p>
                {edu.graduation_year && (
                  <span className="text-[10px] text-muted-foreground font-mono block">
                    Graduated: {edu.graduation_year}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            No education listed yet.
          </p>
        )}
      </div>

      {/* Projects Section */}
      <div className="space-y-3 pt-2 border-t border-border/60">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <FolderGit2 className="w-3 h-3 text-muted-foreground" />
          Featured Projects ({projectList.length})
        </span>

        {projectList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {projectList.map((proj) => (
              <div
                key={proj.id || proj.title}
                className="p-3 rounded-sm bg-secondary/30 border border-border/70 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold text-foreground truncate">
                    {proj.title}
                  </h3>
                  {proj.url && (
                    <a
                      href={proj.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline text-[10px] flex items-center gap-0.5"
                    >
                      <span>View</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>

                {proj.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {proj.description}
                  </p>
                )}

                {proj.technologies_used &&
                  proj.technologies_used.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {proj.technologies_used.map((t) => (
                        <span
                          key={t}
                          className="px-1.5 py-0.5 rounded-sm bg-secondary text-[10px] text-foreground font-mono"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            No projects listed yet.
          </p>
        )}
      </div>
    </div>
  );
}
