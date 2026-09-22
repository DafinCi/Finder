import ProfileView from "@/features/profile/views/ProfileView";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Professional Profile | Finder",
  description: "Your comprehensive professional profile extracted via AI.",
};

export default function ProfilePage() {
  return <ProfileView />;
}
