"use client";

import React from "react";
import { GraduationCap, Calendar, School, Award } from "lucide-react";
import { CardTitle } from "@/components/ui/card";

interface EducationItem {
  school?: string;
  institution?: string;
  major?: string;
  degree?: string;
  field_of_study?: string;
  year?: string;
  start_date?: string;
  end_date?: string;
  gpa?: string;
  grade?: string;
}

interface EducationSectionProps {
  education?: EducationItem[];
}

const defaultEducation: EducationItem[] = [
  {
    school: "Universitas Negeri Jakarta",
    major: "Bachelor of Informatics",
    year: "2023 - Present",
    gpa: "3.85 / 4.00",
  },
  {
    school: "SMK Negeri 4 Jakarta",
    major: "Software Engineering",
    year: "2020 - 2023",
    gpa: "Graduated",
  },
];

export default function EducationSection({ education }: EducationSectionProps) {
  const displayItems =
    education && education.length > 0 ? education : defaultEducation;

  return (
    <section className="rounded-[6px] border border-sidebar-border bg-card/50 p-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-[6px] bg-primary p-3 text-primary-foreground">
          <GraduationCap size={22} />
        </div>

        <div>
          <h2 className="text-2xl font-bold">Education</h2>
          <p className="text-sm text-muted-foreground">Academic Background</p>
        </div>
      </div>

      <div className="space-y-8">
        {displayItems.map((item, index) => {
          const schoolName =
            item.school || item.institution || "Unknown Institution";
          const majorName =
            item.major ||
            [item.degree, item.field_of_study].filter(Boolean).join(" in ") ||
            "Computer Science & Engineering";
          const yearText =
            item.year ||
            (item.start_date || item.end_date
              ? `${item.start_date || ""} - ${item.end_date || "Present"}`
              : "Completed");
          const gpaText = item.gpa || item.grade || "Verified";

          return (
            <div
              key={index}
              className="relative border-l-2 border-primary pl-8"
            >
              <span className="absolute -left-[9px] top-2 h-4 w-4 rounded-full bg-primary" />
              <CardTitle className="rounded-[6px] border border-sidebar-border bg-secondary p-6 transition-all duration-300 hover:border-primary">
                <div className="flex items-center gap-3">
                  <School className="text-primary" />
                  <h3 className="text-lg font-semibold">{schoolName}</h3>
                </div>

                <p className="mt-3 text-muted-foreground">{majorName}</p>

                <div className="mt-5 flex flex-wrap gap-6">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={16} />
                    {yearText}
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Award size={16} />
                    {gpaText}
                  </div>
                </div>
              </CardTitle>
            </div>
          );
        })}
      </div>
    </section>
  );
}
