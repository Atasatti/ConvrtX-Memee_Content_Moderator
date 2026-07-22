"use client";

import { Loader2, ScanLine, TriangleAlert, Video } from "lucide-react";
import { formatPercent } from "@/lib/utils";
import { useVideoModerationViewModel } from "@/viewmodels/useVideoModerationViewModel";
import { AnalysisProgress } from "../components/AnalysisProgress";
import { Button } from "../components/Button";
import { Card, CardBody, CardHeader } from "../components/Card";
import { CategoryScoreList } from "../components/CategoryScoreList";
import { DetectedNumbers } from "../components/DetectedNumbers";
import { Dropzone } from "../components/Dropzone";
import { EmptyState } from "../components/EmptyState";
import { ErrorAlert } from "../components/ErrorAlert";
import { FrameTimeline } from "../components/FrameTimeline";
import { NsfwBreakdown } from "../components/NsfwBreakdown";
import { PageHeader } from "../components/PageHeader";
import { StatTile } from "../components/StatTile";
import { VerdictBanner } from "../components/VerdictBanner";

export function VideoModerationView() {
  const vm = useVideoModerationViewModel();
  const analysis = vm.analysis;

  return (
    <>
      <PageHeader
        title="Video moderation"
        description="Review sampled visual frames and the transcribed audio track in one combined safety analysis."
        endpoint="POST /video/analyze_video"
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <Card className="self-start">
          <CardHeader title="Upload" description="MP4, MOV, AVI, or WMV." />

          <CardBody>
            <Dropzone
              file={vm.file}
              onSelect={vm.selectFile}
              accept="video/mp4,video/quicktime,video/x-msvideo,video/x-ms-wmv,.mp4,.mov,.avi,.wmv"
              label="Drop a video or click to browse"
              hint="Up to 500 MB"
              disabled={vm.isRunning}
            />

            {vm.previewUrl ? (
              <video
                controls
                src={vm.previewUrl}
                className="mt-4 w-full rounded-lg border border-line bg-canvas"
                aria-label="Preview of the selected video"
              />
            ) : null}

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
                <Button variant="ghost" onClick={vm.clear} disabled={!vm.file}>
                  Clear
                </Button>
              )}
            </div>

            <p className="mt-4 rounded-lg border border-line bg-raised px-3 py-2 text-[11px] leading-relaxed text-muted">
              Video scans are the slowest path: every sampled frame runs through the
              NSFW model before the audio is transcribed. Expect minutes, not seconds.
            </p>
          </CardBody>
        </Card>

        <div className="flex min-w-0 flex-col gap-4">
          {vm.error ? <ErrorAlert error={vm.error} onRetry={vm.submit} /> : null}

          {vm.isRunning ? (
            <AnalysisProgress
              progress={vm.progress}
              elapsedMs={vm.elapsedMs}
              processingLabel="Sampling frames and transcribing the audio track…"
            />
          ) : null}

          {analysis ? (
            <>
              <VerdictBanner
                flagged={analysis.flagged}
                risk={analysis.overallRisk}
                headline={`${analysis.frameCount} frames sampled · ${analysis.unsafeFrameCount} above the flag threshold`}
                detail={
                  analysis.audioVerdict.flagged
                    ? "The audio track was also flagged — see the transcript scores below."
                    : "The audio track passed moderation."
                }
                elapsedMs={vm.elapsedMs}
              />

              <div className="grid gap-3 sm:grid-cols-3">
                <StatTile
                  label="Frames sampled"
                  value={String(analysis.frameCount)}
                  hint="~1 per second"
                />
                <StatTile
                  label="Unsafe frames"
                  value={String(analysis.unsafeFrameCount)}
                  hint="At or above 75%"
                  tone={analysis.unsafeFrameCount > 0 ? "critical" : "good"}
                />
                <StatTile
                  label="Peak unsafe"
                  value={
                    analysis.worstFrameIndex >= 0
                      ? formatPercent(
                          analysis.frames[analysis.worstFrameIndex].unsafeScore,
                          0,
                        )
                      : "—"
                  }
                  hint={
                    analysis.worstFrameIndex >= 0
                      ? `at ~${analysis.worstFrameIndex}s`
                      : undefined
                  }
                />
              </div>

              <Card>
                <CardHeader
                  title="Frame timeline"
                  description="Unsafe probability per sampled frame. Hover or click a column to inspect it."
                  actions={
                    analysis.unsafeFrameCount > 0 ? (
                      <Button size="sm" onClick={vm.jumpToWorstFrame}>
                        <TriangleAlert size={13} aria-hidden />
                        Worst frame
                      </Button>
                    ) : null
                  }
                />
                <CardBody>
                  <FrameTimeline
                    frames={analysis.frames}
                    selectedIndex={vm.selectedFrame}
                    onSelect={vm.setSelectedFrame}
                  />
                </CardBody>
              </Card>

              <div className="grid gap-4 xl:grid-cols-2">
                <Card>
                  <CardHeader
                    title={`Frame at ~${vm.selectedFrame}s`}
                    description="Class scores for the selected frame."
                  />
                  <CardBody>
                    {vm.focusedFrame ? (
                      <NsfwBreakdown classification={vm.focusedFrame} />
                    ) : (
                      <p className="text-xs text-muted">No frame selected.</p>
                    )}
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader
                    title="Whole-video average"
                    description="Mean class scores across every sampled frame."
                  />
                  <CardBody>
                    <NsfwBreakdown classification={analysis.aggregate} />
                  </CardBody>
                </Card>
              </div>

              <DetectedNumbers numbers={analysis.audioVerdict.detectedNumbers} />

              <Card>
                <CardHeader
                  title="Audio track moderation"
                  description="Policy scores for the transcribed audio."
                />
                <CardBody>
                  <CategoryScoreList
                    categories={analysis.audioVerdict.categories}
                    dominantCategory={analysis.audioVerdict.dominantCategory}
                  />
                </CardBody>
              </Card>
            </>
          ) : null}

          {vm.status === "idle" && !vm.error && !vm.isRunning ? (
            <Card className="flex-1">
              <EmptyState
                icon={<Video size={26} />}
                title="No video scanned yet"
                description="Upload a video to sample its frames against the NSFW model and moderate its audio track."
              />
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
