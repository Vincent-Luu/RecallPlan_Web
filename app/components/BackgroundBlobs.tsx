/**
 * Ambient light — a single directional wash of accent-tinted light
 * that adds material depth without decorative blobs.
 *
 * Replaces the old symmetric "blue blob + slate blob" pattern that
 * read as default AI-generated decoration.
 *
 * Usage: place inside a `relative overflow-hidden` container.
 */
export default function BackgroundBlobs() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Single directional light — top-left, accent-tinted, clean falloff */}
      <div className="absolute -top-[10%] left-0 w-[70%] h-[55%] bg-gradient-to-br from-accent/[0.04] via-accent/[0.015] to-transparent" />
    </div>
  );
}
