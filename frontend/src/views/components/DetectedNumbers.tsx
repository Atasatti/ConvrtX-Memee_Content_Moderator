import { Phone } from "lucide-react";

interface DetectedNumbersProps {
  numbers: string[];
}

/**
 * Phone numbers are sensitive personal data under the moderation policy, so they
 * are always called out separately from the category scores.
 */
export function DetectedNumbers({ numbers }: DetectedNumbersProps) {
  if (numbers.length === 0) return null;

  return (
    <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3">
      <p className="flex items-center gap-2 text-xs font-medium text-warning">
        <Phone size={13} aria-hidden />
        {numbers.length} phone number{numbers.length === 1 ? "" : "s"} detected
      </p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {numbers.map((number, index) => (
          <li
            key={`${number}-${index}`}
            className="tabular rounded border border-line-strong bg-canvas px-2 py-1 text-xs text-ink-2"
          >
            {number}
          </li>
        ))}
      </ul>
    </div>
  );
}
