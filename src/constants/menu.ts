import {
  MessageSquarePlus,
  BriefcaseBusiness,
  User,
  type LucideIcon,
} from "lucide-react";

export interface MenuItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: number | string;
}

export const MenuItems: MenuItem[] = [
  {
    title: "New Chat",
    href: "/",
    icon: MessageSquarePlus,
  },
  {
    title: "Explore Jobs",
    href: "/jobs",
    icon: BriefcaseBusiness,
  },
  {
    title: "My Profile",
    href: "/profile",
    icon: User,
  },
];
