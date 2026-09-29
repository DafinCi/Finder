import ProfileOverviewView from "@/features/profile/views/ProfileOverviewView";

export const metadata = {
  title: "Career Profile | Finder",
  description:
    "Manage the career intent, preferences, and verified skills Finder uses to personalize your recommendations.",
};

export default function ProfilePage() {
  return <ProfileOverviewView />;
}
