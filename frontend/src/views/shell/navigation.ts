import {
  FileText,
  History,
  Image as ImageIcon,
  LayoutDashboard,
  Music,
  Video,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Overview",
    icon: LayoutDashboard,
    description: "Scan activity and API status",
  },
  {
    href: "/text",
    label: "Text",
    icon: FileText,
    description: "Moderate comments and captions",
  },
  {
    href: "/image",
    label: "Image",
    icon: ImageIcon,
    description: "NSFW classification and OCR",
  },
  {
    href: "/audio",
    label: "Audio",
    icon: Music,
    description: "Transcribe and moderate speech",
  },
  {
    href: "/video",
    label: "Video",
    icon: Video,
    description: "Frame sampling and audio track",
  },
  {
    href: "/history",
    label: "History",
    icon: History,
    description: "Persistent audit trail",
  },
];
