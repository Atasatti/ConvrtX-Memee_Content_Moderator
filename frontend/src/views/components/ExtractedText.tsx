"use client";

import { useState } from "react";
import { Check, Copy, ScanText } from "lucide-react";
import { Card, CardBody, CardHeader } from "./Card";

interface ExtractedTextProps {
  text: string;
  /** Shown when OCR returned nothing, to distinguish "no text" from "not run". */
  emptyHint?: string;
}

/**
 * The text OCR actually read. Shown verbatim so the operator can judge whether
 * the moderation verdict was based on a good read or on garbled output — an
 * unreadable image and a clean image both score "safe", and only the raw text
 * tells them apart.
 */
export function ExtractedText({
  text,
  emptyHint = "OCR found no readable text in this image.",
}: ExtractedTextProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard is unavailable on insecure origins; the text is selectable anyway.
    }
  };

  const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;

  return (
    <Card>
      <CardHeader
        title="Extracted text"
        description={
          text
            ? `${wordCount} word${wordCount === 1 ? "" : "s"} read by OCR — this is what was moderated.`
            : "What OCR read from the image."
        }
        icon={<ScanText size={15} />}
        actions={
          text ? (
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded border border-line px-2 py-1 text-[11px] text-muted transition-colors hover:border-brand/60 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {copied ? (
                <>
                  <Check size={12} aria-hidden />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={12} aria-hidden />
                  Copy
                </>
              )}
            </button>
          ) : null
        }
      />

      <CardBody>
        {text ? (
          <p className="max-h-56 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm leading-relaxed text-ink-2">
            {text}
          </p>
        ) : (
          <p className="text-xs text-muted">{emptyHint}</p>
        )}
      </CardBody>
    </Card>
  );
}
