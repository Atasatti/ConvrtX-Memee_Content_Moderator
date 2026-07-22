import type { Metadata } from "next";
import { ImageModerationView } from "@/views/screens/ImageModerationView";

export const metadata: Metadata = { title: "Image moderation" };

export default function ImagePage() {
  return <ImageModerationView />;
}
