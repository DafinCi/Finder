import { Suspense } from "react";
import JobsView from "@/features/jobs/views/JobsView";
import JobPageSkeleton from "@/features/jobs/skeletons/JobsPageSkeleton";

export const metadata = {
  title: "Recommended Jobs | Finder",
  description: "Jobs matched to your CV by AI.",
};

export default function JobsPage() {
  return (
    <Suspense fallback={<JobPageSkeleton />}>
      <JobsView />
    </Suspense>
  );
}
