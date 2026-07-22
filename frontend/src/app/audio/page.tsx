import type { Metadata } from "next";
import { AudioModerationView } from "@/views/screens/AudioModerationView";

export const metadata: Metadata = { title: "Audio moderation" };

export default function AudioPage() {
  return <AudioModerationView />;
}
