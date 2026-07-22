"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AppError } from "@/models/common.model";
import type { UploadKind } from "@/models/upload.model";
import { validateUpload } from "@/models/upload.model";

interface FileSelectionOptions {
  /** Create an object URL for the selected file so the view can preview it. */
  withPreview?: boolean;
}

/**
 * Owns file choice and up-front validation for the upload ViewModels, including
 * the object-URL lifecycle so previews never leak.
 */
export function useFileSelection(kind: UploadKind, options: FileSelectionOptions = {}) {
  const { withPreview = false } = options;

  const [file, setFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<AppError | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);

  const releasePreview = useCallback(() => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
    setPreviewUrl(null);
  }, []);

  useEffect(() => releasePreview, [releasePreview]);

  const select = useCallback(
    (next: File | null) => {
      releasePreview();

      if (!next) {
        setFile(null);
        setValidationError(null);
        return;
      }

      const error = validateUpload(next, kind);
      setValidationError(error);
      // Keep an invalid file selected so the view can name it in the error.
      setFile(next);

      if (!error && withPreview) {
        const url = URL.createObjectURL(next);
        previewRef.current = url;
        setPreviewUrl(url);
      }
    },
    [kind, releasePreview, withPreview],
  );

  const clear = useCallback(() => {
    releasePreview();
    setFile(null);
    setValidationError(null);
  }, [releasePreview]);

  return {
    file,
    previewUrl,
    validationError,
    isValid: file !== null && validationError === null,
    select,
    clear,
  };
}
