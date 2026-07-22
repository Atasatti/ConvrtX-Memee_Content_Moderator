import type { Metadata } from "next";
import { TextModerationView } from "@/views/screens/TextModerationView";

export const metadata: Metadata = { title: "Text moderation" };

export default function TextPage() {
  return <TextModerationView />;
}
