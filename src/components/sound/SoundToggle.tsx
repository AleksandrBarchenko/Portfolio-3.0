"use client";

import { useSound } from "./SoundProvider";

/* Accessible mute switch for the site's UI sounds. Sound only ever reinforces
   the visual/motion feedback that's already there, so turning it off loses
   nothing but the audio. Mirrors ThemeToggle's shape so it sits naturally in
   the header. */
export function SoundToggle({ className = "" }: { className?: string }) {
  const { enabled, toggle } = useSound();

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={enabled}
      aria-label={enabled ? "Mute interface sounds" : "Unmute interface sounds"}
      title={enabled ? "Sound on" : "Sound off"}
      className={`theme-fade grid h-10 w-10 place-items-center rounded-full border border-line text-sol transition-colors hover:bg-pill ${className}`}
    >
      {enabled ? (
        // Speaker with waves
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M4 9v6h4l5 4V5L8 9H4z" />
          <path d="M16.5 8.5a5 5 0 0 1 0 7" />
          <path d="M19 6a9 9 0 0 1 0 12" />
        </svg>
      ) : (
        // Speaker muted
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M4 9v6h4l5 4V5L8 9H4z" />
          <path d="M22 9l-6 6M16 9l6 6" />
        </svg>
      )}
    </button>
  );
}

export default SoundToggle;
