"use client";

import Image from "next/image";
import { ImageIcon, Loader2, ScanLine } from "lucide-react";
import { formatPercent } from "@/lib/utils";
import { useImageModerationViewModel } from "@/viewmodels/useImageModerationViewModel";
import { AnalysisProgress } from "../components/AnalysisProgress";
import { Button } from "../components/Button";
import { Card, CardBody, CardHeader } from "../components/Card";
import { CategoryScoreList } from "../components/CategoryScoreList";
import { DetectedNumbers } from "../components/DetectedNumbers";
import { Dropzone } from "../components/Dropzone";
import { EmptyState } from "../components/EmptyState";
import { ErrorAlert } from "../components/ErrorAlert";
import { ExtractedText } from "../components/ExtractedText";
import { NsfwBreakdown } from "../components/NsfwBreakdown";
import { PageHeader } from "../components/PageHeader";
import { SegmentedControl } from "../components/SegmentedControl";
import { VerdictBanner } from "../components/VerdictBanner";

export function ImageModerationView() {
  const vm = useImageModerationViewModel();
  const analysis = vm.full.result;
  const ocrVerdict = vm.ocr.result;

  return (
    <>
      <PageHeader
        title="Image moderation"
        description="Inspect visual safety signals and moderate any text detected inside an image."
        endpoint={vm.mode === "full" ? "POST /image/predict" : "POST /image/check_text"}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="self-start">
          <CardHeader
            title="Upload"
            description="PNG, JPEG, WebP, GIF, or BMP."
            actions={
              <SegmentedControl
                label="Analysis mode"
                value={vm.mode}
                onChange={vm.changeMode}
                disabled={vm.isRunning}
                options={[
                  { value: "full", label: "Full", hint: "NSFW classification + OCR" },
                  { value: "ocr", label: "OCR only", hint: "Skip the NSFW model" },
                ]}
              />
            }
          />

          <CardBody>
            {vm.previewUrl ? (
              <div className="relative mb-4 overflow-hidden rounded-2xl border border-line bg-canvas/55">
                {/* Object URLs are not known to the image optimizer, so render unoptimized. */}
                <Image
                  src={vm.previewUrl}
                  alt="Selected image preview"
                  width={640}
                  height={360}
                  unoptimized
                  className="max-h-72 w-full object-contain"
                />
              </div>
            ) : null}

            <div className="mb-4">
              <Dropzone
                file={vm.file}
                onSelect={vm.selectFile}
                accept="image/*"
                label="Drop an image or click to browse"
                hint="PNG, JPEG, WebP, GIF, or BMP · up to 15 MB"
                disabled={vm.isRunning}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
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
          </CardBody>
        </Card>

        <div className="flex flex-col gap-4">
          {vm.error ? <ErrorAlert error={vm.error} onRetry={vm.submit} /> : null}

          {vm.isRunning ? (
            <AnalysisProgress
              progress={vm.progress}
              elapsedMs={vm.elapsedMs}
              processingLabel="Classifying pixels and running OCR…"
            />
          ) : null}

          {vm.mode === "full" && analysis ? (
            <>
              <VerdictBanner
                flagged={analysis.flagged}
                risk={analysis.overallRisk}
                headline={`Top class: ${analysis.classification.topLabel} · ${formatPercent(analysis.classification.unsafeScore, 1)} combined unsafe`}
                detail={
                  analysis.textVerdict.extractedText
                    ? "Embedded text was found and moderated separately — see below."
                    : "OCR found no readable text in this image."
                }
                elapsedMs={vm.full.elapsedMs}
              />

              <Card>
                <CardHeader
                  title="Visual classification"
                  description="NSFW model output across the five trained classes."
                />
                <CardBody>
                  <NsfwBreakdown classification={analysis.classification} />
                </CardBody>
              </Card>

              <ExtractedText text={analysis.textVerdict.extractedText} />

              <DetectedNumbers numbers={analysis.textVerdict.detectedNumbers} />

              {analysis.textVerdict.categories.length > 0 ? (
                <Card>
                  <CardHeader
                    title="Embedded text moderation"
                    description="Policy scores for text extracted by OCR."
                  />
                  <CardBody>
                    <CategoryScoreList
                      categories={analysis.textVerdict.categories}
                      dominantCategory={analysis.textVerdict.dominantCategory}
                    />
                  </CardBody>
                </Card>
              ) : null}
            </>
          ) : null}

          {vm.mode === "ocr" && ocrVerdict ? (
            <>
              <VerdictBanner
                flagged={ocrVerdict.flagged}
                risk={ocrVerdict.risk}
                headline={
                  ocrVerdict.extractedText
                    ? `Highest category: ${ocrVerdict.dominantLabel ?? "none"}`
                    : "OCR found no readable text in this image."
                }
                elapsedMs={vm.ocr.elapsedMs}
              />
              <ExtractedText text={ocrVerdict.extractedText} />
              <DetectedNumbers numbers={ocrVerdict.detectedNumbers} />
              <Card>
                <CardHeader
                  title="Extracted text moderation"
                  description="Policy scores for text read out of the image."
                />
                <CardBody>
                  <CategoryScoreList
                    categories={ocrVerdict.categories}
                    dominantCategory={ocrVerdict.dominantCategory}
                  />
                </CardBody>
              </Card>
            </>
          ) : null}

          {vm.status === "idle" && !vm.error && !vm.isRunning ? (
            <Card className="flex-1">
              <EmptyState
                icon={<ImageIcon size={26} />}
                title="No image scanned yet"
                description="Upload an image to classify it against the NSFW model and moderate any text it contains."
              />
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
