import JobsView from "@/features/jobs/views/JobsView";

export const metadata = {
  title: "Recommended Jobs | Finder",
  description: "Jobs matched to your CV by AI.",
};

export default function JobsPage() {
  return <JobsView />;
}
