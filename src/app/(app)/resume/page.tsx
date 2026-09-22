import ResumePageView from "@/features/resume/views/ResumePageView";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resume Intelligence | Finder",
  description:
    "Upload and analyze your professional resume using AI Intelligence.",
};

export default function ResumePage() {
  return <ResumePageView />;
}
