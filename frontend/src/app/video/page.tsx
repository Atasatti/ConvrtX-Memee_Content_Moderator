import type { Metadata } from "next";
import { VideoModerationView } from "@/views/screens/VideoModerationView";

export const metadata: Metadata = { title: "Video moderation" };

export default function VideoPage() {
  return <VideoModerationView />;
}
