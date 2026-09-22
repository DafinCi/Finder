"use client";

import React from "react";
import { CardContent } from "@/components/ui/card";
import { CheckCircle2, FileText, Sparkles } from "lucide-react";

interface ResumeStatusProps {
  score?: number;
}

export default function ResumeStatus({ score = 91 }: ResumeStatusProps) {
  return (
    <CardContent>
      <div className="flex items-center gap-3">
        <div className="rounded-[6px] bg-blue-600 p-3">
          <FileText className="text-white" />
        </div>

        <div>
          <h3 className="text-xl font-semibold text-white">Resume Status</h3>
          <p className="text-sm text-slate-400">AI Resume Analysis</p>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">ATS Score</span>
          <span className="font-bold text-blue-400">{score}%</span>
        </div>

        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
            style={{
              width: `${score}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="text-green-500" />
          <span className="text-slate-300">Resume Uploaded</span>
        </div>

        <div className="flex items-center gap-3">
          <Sparkles className="text-blue-400" />
          <span className="text-slate-300">AI Analysis Completed</span>
        </div>
      </div>
    </CardContent>
  );
}
