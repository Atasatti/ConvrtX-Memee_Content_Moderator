"use client";

import { Loader2, Music, ScanLine } from "lucide-react";
import { useAudioModerationViewModel } from "@/viewmodels/useAudioModerationViewModel";
import { AnalysisProgress } from "../components/AnalysisProgress";
import { Button } from "../components/Button";
import { Card, CardBody, CardHeader } from "../components/Card";
import { CategoryScoreList } from "../components/CategoryScoreList";
import { DetectedNumbers } from "../components/DetectedNumbers";
import { Dropzone } from "../components/Dropzone";
import { EmptyState } from "../components/EmptyState";
import { ErrorAlert } from "../components/ErrorAlert";
import { PageHeader } from "../components/PageHeader";
import { VerdictBanner } from "../components/VerdictBanner";

export function AudioModerationView() {
  const vm = useAudioModerationViewModel();
  const verdict = vm.verdict;

  return (
    <>
      <PageHeader
        title="Audio moderation"
        description="Transcribe spoken content and evaluate the resulting text for policy risk and exposed phone numbers."
        endpoint={
          vm.isVideoSource ? "POST /audio/transcribe_video" : "POST /audio/transcribe"
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="self-start">
          <CardHeader
            title="Upload"
            description="MP3, WAV, M4A, WebM, OGG — or a video file."
          />

          <CardBody>
            <Dropzone
              file={vm.file}
              onSelect={vm.selectFile}
              accept="audio/*,video/*"
              label="Drop audio or video, or click to browse"
              hint="Up to 100 MB"
              disabled={vm.isRunning}
            />

            {vm.previewUrl && vm.file && !vm.isVideoSource ? (
              <audio
                controls
                src={vm.previewUrl}
                className="mt-4 w-full"
                aria-label="Preview of the selected audio"
              />
            ) : null}

            {vm.isVideoSource ? (
              <p className="mt-3 rounded-lg border border-line bg-raised px-3 py-2 text-[11px] text-muted">
                This is a video file — Aegis will extract its audio track before
                transcribing.
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button variant="primary" onClick={vm.submit} disabled={!vm.canSubmit}>
                {vm.isRunning ? (
                  <>
                    <Loader2 size={15} className="animate-spin" aria-hidden />
                    Transcribing…
                  </>
                ) : (
                  <>
                    <ScanLine size={15} aria-hidden />
                    Transcribe & moderate
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
          </CardBody>
        </Card>

        <div className="flex flex-col gap-4">
          {vm.error ? <ErrorAlert error={vm.error} onRetry={vm.submit} /> : null}

          {vm.isRunning ? (
            <AnalysisProgress
              progress={vm.progress}
              elapsedMs={vm.elapsedMs}
              processingLabel="Transcribing with Whisper and moderating the transcript…"
            />
          ) : null}

          {verdict ? (
            <>
              <VerdictBanner
                flagged={verdict.flagged}
                risk={verdict.risk}
                headline={
                  verdict.dominantLabel
                    ? `Highest category: ${verdict.dominantLabel}`
                    : "No categories scored above zero."
                }
                detail="Scores describe the transcribed speech, not the audio signal itself."
                elapsedMs={vm.elapsedMs}
              />

              <DetectedNumbers numbers={verdict.detectedNumbers} />

              <Card>
                <CardHeader
                  title="Transcript moderation"
                  description="Policy scores for the speech Whisper transcribed."
                />
                <CardBody>
                  <CategoryScoreList
                    categories={verdict.categories}
                    dominantCategory={verdict.dominantCategory}
                  />
                </CardBody>
              </Card>
            </>
          ) : null}

          {vm.status === "idle" && !vm.error && !vm.isRunning ? (
            <Card className="flex-1">
              <EmptyState
                icon={<Music size={26} />}
                title="No audio scanned yet"
                description="Upload an audio or video file to transcribe its speech and moderate the resulting text."
              />
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
