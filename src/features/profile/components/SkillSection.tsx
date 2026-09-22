import React from "react";

interface SkillSectionProps {
  skills?: {
    core?: string[];
    supporting?: string[];
  };
}

export default function SkillSection({ skills }: SkillSectionProps) {
  const coreSkills = skills?.core || [];
  const supportingSkills = skills?.supporting || [];

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-3">
        <h2 className="text-[24px] font-heading font-semibold text-foreground">
          Skills & Technologies
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Core Technologies Block */}
        <div className="space-y-3">
          <h3 className="text-[16px] font-sans font-semibold text-foreground tracking-wide uppercase text-muted-foreground/90">
            Core Technologies
          </h3>
          <div className="flex flex-wrap gap-2">
            {coreSkills.length > 0 ? (
              coreSkills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 text-[14px] font-sans font-medium rounded-[6px] bg-primary/10 border border-primary/20 text-primary"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-[14px] text-muted-foreground">
                Tidak ada core skill terdeteksi.
              </span>
            )}
          </div>
        </div>

        {/* Supporting Block */}
        <div className="space-y-3">
          <h3 className="text-[16px] font-sans font-semibold text-foreground tracking-wide uppercase text-muted-foreground/90">
            Supporting Ecosystem
          </h3>
          <div className="flex flex-wrap gap-2">
            {supportingSkills.length > 0 ? (
              supportingSkills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 text-[14px] font-sans font-medium rounded-[6px] bg-secondary border border-border text-foreground"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-[14px] text-muted-foreground">
                Tidak ada supporting skill terdeteksi.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
