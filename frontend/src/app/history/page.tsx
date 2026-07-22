import type { Metadata } from "next";
import { HistoryView } from "@/views/screens/HistoryView";

export const metadata: Metadata = { title: "Scan history" };

export default function HistoryPage() {
  return <HistoryView />;
}
