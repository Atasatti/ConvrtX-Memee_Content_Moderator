"use client";

import { Loader2, ScanLine, Trash2 } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { useTextModerationViewModel } from "@/viewmodels/useTextModerationViewModel";
import { Button } from "../components/Button";
import { Card, CardBody, CardHeader } from "../components/Card";
import { CategoryScoreList } from "../components/CategoryScoreList";
import { DetectedNumbers } from "../components/DetectedNumbers";
import { EmptyState } from "../components/EmptyState";
import { ErrorAlert } from "../components/ErrorAlert";
import { PageHeader } from "../components/PageHeader";
import { SegmentedControl } from "../components/SegmentedControl";
import { VerdictBanner } from "../components/VerdictBanner";

const SAMPLES = [
  { label: "Benign", text: "Great video, thanks for putting this together!" },
  {
    label: "Contact info",
    text: "DM me on WhatsApp at +1 415 555 0134 and I'll send you the details.",
  },
  { label: "Harassment", text: "You are completely worthless and everyone despises you." },
];

export function TextModerationView() {
  const vm = useTextModerationViewModel();

  return (
    <>
      <PageHeader
        title="Text moderation"
        description="Review comments, captions, and transcripts for policy risk or exposed phone numbers."
        endpoint={vm.mode === "moderation" ? "POST /text/analyze" : "POST /text/check_number"}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Input"
            description="Paste a comment, caption, or transcript."
            actions={
              <SegmentedControl
                label="Analysis mode"
                value={vm.mode}
                onChange={vm.changeMode}
                disabled={vm.isRunning}
                options={[
                  { value: "moderation", label: "Full", hint: "Policy categories + numbers" },
                  { value: "numbers", label: "Numbers", hint: "Phone-number extraction only" },
                ]}
              />
            }
          />

          <CardBody>
            <label htmlFor="text-input" className="sr-only">
              Text to analyze
            </label>
            <textarea
              id="text-input"
              value={vm.text}
              onChange={(event) => vm.setText(event.target.value)}
              onKeyDown={(event) => {
                // Submit on Cmd/Ctrl+Enter, the usual shortcut for a body of text.
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && vm.canSubmit) {
                  vm.submit();
                }
              }}
              rows={9}
              placeholder="Enter text to analyze…"
              className="w-full resize-y rounded-2xl border border-line bg-canvas/55 px-4 py-3.5 text-sm leading-relaxed text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
            />

            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-muted">⌘/Ctrl + Enter to run</span>
              <span className={vm.isOverLimit ? "tabular text-critical" : "tabular text-muted"}>
                {vm.charCount.toLocaleString()} / {vm.maxLength.toLocaleString()}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button variant="primary" onClick={vm.submit} disabled={!vm.canSubmit}>
                {vm.isRunning ? (
                  <>
                    <Loader2 size={15} className="animate-spin" aria-hidden />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <ScanLine size={15} aria-hidden />
                    Run scan
                  </>
                )}
              </Button>

              {vm.isRunning ? (
                <Button variant="ghost" onClick={vm.cancel}>
                  Cancel
                </Button>
              ) : (
                <Button variant="ghost" onClick={vm.clear} disabled={!vm.text}>
                  <Trash2 size={15} aria-hidden />
                  Clear
                </Button>
              )}
            </div>

            <div className="mt-5 border-t border-line/80 pt-4">
              <p className="mb-2 text-[11px] font-medium text-muted">Load a sample</p>
              <div className="flex flex-wrap gap-2">
                {SAMPLES.map((sample) => (
                  <Button
                    key={sample.label}
                    size="sm"
                    onClick={() => vm.loadSample(sample.text)}
                    disabled={vm.isRunning}
                  >
                    {sample.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="flex flex-col gap-4">
          {vm.error ? <ErrorAlert error={vm.error} onRetry={vm.submit} /> : null}

          {vm.mode === "moderation" && vm.moderation.result ? (
            <>
              <VerdictBanner
                flagged={vm.moderation.result.flagged}
                risk={vm.moderation.result.risk}
                headline={
                  vm.moderation.result.dominantLabel
                    ? `Highest category: ${vm.moderation.result.dominantLabel}`
                    : "No categories scored above zero."
                }
                elapsedMs={vm.moderation.elapsedMs}
              />

              <DetectedNumbers numbers={vm.moderation.result.detectedNumbers} />

              <Card>
                <CardHeader
                  title="Category scores"
                  description="Probability that the text violates each policy category."
                />
                <CardBody>
                  <CategoryScoreList
                    categories={vm.moderation.result.categories}
                    dominantCategory={vm.moderation.result.dominantCategory}
                  />
                </CardBody>
              </Card>
            </>
          ) : null}

          {vm.mode === "numbers" && vm.numbers.result ? (
            <>
              <VerdictBanner
                flagged={vm.numbers.result.flagged}
                risk={vm.numbers.result.flagged ? "elevated" : "safe"}
                headline={
                  vm.numbers.result.flagged
                    ? `${vm.numbers.result.numbers.length} phone number${vm.numbers.result.numbers.length === 1 ? "" : "s"} found in the text.`
                    : "No phone numbers found in the text."
                }
                elapsedMs={vm.numbers.elapsedMs}
              />
              <DetectedNumbers numbers={vm.numbers.result.numbers} />
            </>
          ) : null}

          {vm.status === "idle" && !vm.error ? (
            <Card className="flex-1">
              <EmptyState
                icon={<ScanLine size={26} />}
                title="No scan yet"
                description="Enter text and run a scan to see category scores and any detected phone numbers."
              />
            </Card>
          ) : null}

          {vm.isRunning ? (
            <Card>
              <CardBody className="flex items-center gap-3">
                <Loader2 size={16} className="animate-spin text-brand" aria-hidden />
                <span className="text-sm text-ink-2">Contacting the moderation API…</span>
                <span className="tabular ml-auto text-xs text-muted">
                  {formatDuration(vm.elapsedMs)}
                </span>
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
