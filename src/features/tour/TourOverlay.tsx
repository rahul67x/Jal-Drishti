import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  X, Play, Pause, ChevronLeft, ChevronRight, Volume2, VolumeX, Loader2,
} from 'lucide-react';
import { TOUR_STEPS, spokenText, type TourStep } from './steps';
import { useNarration } from './useNarration';

/**
 * The guided tour overlay.
 *
 * Spotlights the anchored element, shows a caption beside it, and calls back
 * with each step so the host can drive the dashboard.
 *
 * Two things matter for how this feels:
 *
 *   The spotlight is never cleared between steps. It animates from the old
 *   rectangle to the new one, so the screen does not flash to full dim and back.
 *
 *   The new rectangle is only committed once it has stopped moving. A tab
 *   switch remounts panels and the map resizes asynchronously, so measuring on
 *   a fixed timer catches the layout mid-flight and produces a visible
 *   double-jump.
 */

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const CARD_WIDTH = 400;
const CARD_ESTIMATED_HEIGHT = 250;

function measure(anchor: string | undefined): Rect | null {
  if (!anchor) return null;
  const el = document.querySelector(`[data-tour="${anchor}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

const same = (a: Rect | null, b: Rect | null) =>
  a !== null &&
  b !== null &&
  Math.abs(a.top - b.top) < 1 &&
  Math.abs(a.left - b.left) < 1 &&
  Math.abs(a.width - b.width) < 1 &&
  Math.abs(a.height - b.height) < 1;

/**
 * Resolves once the element's box has been identical for a few frames, or
 * gives up. Returns whatever it last saw, so a slow-settling element still
 * gets spotlighted rather than being skipped.
 */
function waitForStableRect(
  anchor: string | undefined,
  signal: { cancelled: boolean }
): Promise<Rect | null> {
  return new Promise((resolve) => {
    if (!anchor) return resolve(null);

    let previous: Rect | null = null;
    let stableFrames = 0;
    let settled = false;

    const finish = (r: Rect | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(deadline);
      resolve(r);
    };

    /**
     * A wall-clock backstop, independent of requestAnimationFrame.
     *
     * rAF does not fire in a background tab. Without this the promise would
     * never settle there, leaving the caller's `settling` flag stuck true —
     * which silently disables both narration and auto-advance, so the tour
     * freezes on one step with no visible error. Switching tabs mid-demo is
     * enough to trigger it.
     */
    const deadline = window.setTimeout(() => finish(measure(anchor)), 1800);

    const tick = () => {
      if (signal.cancelled || settled) return finish(null);

      const current = measure(anchor);

      if (current && same(current, previous)) {
        stableFrames++;
        // Three consecutive identical frames is enough to call it settled
        // without waiting long enough to feel sluggish.
        if (stableFrames >= 3) return finish(current);
      } else {
        stableFrames = 0;
      }

      previous = current;
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  });
}

export const TourOverlay: React.FC<{
  onApply: (step: TourStep) => void;
  onClose: () => void;
}> = ({ onApply, onClose }) => {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  /**
   * Which step has finished settling, by id — not a boolean.
   *
   * A boolean races. When the step changes, the step effect and the narration
   * effect run in the same commit, and the narration effect sees the *previous*
   * render's `settling === false` alongside the *new* step. It then speaks
   * immediately, before the layout has moved, and speaks again once the flag
   * has actually cycled — two utterances per step, the first cancelled
   * mid-sentence by the second.
   *
   * Comparing ids cannot be stale in that way: the new step's id is simply not
   * the settled one yet.
   */
  const [settledStepId, setSettledStepId] = useState<string | null>(null);

  /**
   * The spotlight persists across steps on purpose — it animates from where it
   * was to where it now belongs. `hasAnchor` says whether the current step
   * wants one at all, which is what drives the fade to full dim.
   */
  const [rect, setRect] = useState<Rect | null>(null);
  const [hasAnchor, setHasAnchor] = useState(false);

  const step = TOUR_STEPS[index];
  const isLast = index === TOUR_STEPS.length - 1;
  const settling = settledStepId !== step.id;

  const narration = useNarration();

  const onApplyRef = useRef(onApply);
  useEffect(() => {
    onApplyRef.current = onApply;
  });

  // Apply the step, let the layout settle, then move the spotlight once.
  useEffect(() => {
    const signal = { cancelled: false };
    setSettledStepId(null);
    onApplyRef.current(step);

    (async () => {
      // One frame's worth of time for React to commit the state change.
      //
      // Deliberately a timeout rather than requestAnimationFrame: rAF does not
      // fire in a hidden tab, and awaiting it here would stall before the
      // deadline inside waitForStableRect is ever armed. The whole settle path
      // has to be able to make progress on wall-clock time alone, or switching
      // browser tabs mid-tour freezes it on one step.
      await new Promise((resolve) => window.setTimeout(resolve, 16));
      if (signal.cancelled) return;

      const el = step.anchor ? document.querySelector(`[data-tour="${step.anchor}"]`) : null;
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });

      const stable = await waitForStableRect(step.anchor, signal);
      if (signal.cancelled) return;

      setHasAnchor(Boolean(stable));
      if (stable) setRect(stable);
      setSettledStepId(step.id);
    })();

    return () => {
      signal.cancelled = true;
    };
  }, [step]);

  /**
   * What to do when the narrator finishes a step.
   *
   * Held in a ref and refreshed every render so the closure handed to
   * `speak()` always sees the current `playing` and `isLast`, without the
   * narration effect having to re-run — re-running it would restart the
   * sentence from the top.
   */
  const afterSpeechRef = useRef<() => void>(() => {});
  useEffect(() => {
    afterSpeechRef.current = () => {
      if (playing && index < TOUR_STEPS.length - 1) go(index + 1);
    };
  });

  // Narrate the step once it is on screen, so the words match the picture.
  useEffect(() => {
    if (settledStepId !== step.id || !narration.enabled) return;
    narration.speak(spokenText(step), () => afterSpeechRef.current());
    // Re-running on `narration` identity would restart speech on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, settledStepId, narration.enabled]);

  // Pause and resume the voice along with the tour, rather than letting it
  // carry on talking over a paused screen.
  useEffect(() => {
    if (!narration.enabled) return;
    if (playing) narration.resume();
    else narration.pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, narration.enabled]);

  // Track the spotlight while the page scrolls or resizes.
  useEffect(() => {
    const track = () => {
      const r = measure(step.anchor);
      if (r) setRect(r);
    };
    window.addEventListener('scroll', track, true);
    window.addEventListener('resize', track);
    return () => {
      window.removeEventListener('scroll', track, true);
      window.removeEventListener('resize', track);
    };
  }, [step.anchor]);

  const go = useCallback((to: number) => {
    setIndex(Math.max(0, Math.min(TOUR_STEPS.length - 1, to)));
  }, []);

  const next = useCallback(() => go(index + 1), [go, index]);

  /**
   * Auto-advance.
   *
   * Without narration the dwell time is the whole story.
   *
   * With narration the step ends when the sentence ends, because how long a
   * passage takes to read depends on the voice, the rate and the platform — a
   * fixed timer would cut the speech off mid-word. The long timer here is
   * purely a backstop for speech that never reports completion at all: a
   * blocked autoplay policy, a missing voice, or an engine that simply goes
   * quiet. Without it a single silent failure strands the tour on one step
   * with nothing on screen to explain why.
   *
   * Either way the timer starts only once the step has settled, so a slow
   * panel does not eat its own reading time.
   */
  useEffect(() => {
    if (!playing || isLast || settling) return;
    const dwell = step.dwell ?? 9000;
    const delay = narration.enabled ? dwell + 20000 : dwell;
    const id = window.setTimeout(next, delay);
    return () => window.clearTimeout(id);
  }, [playing, isLast, settling, step, next, narration.enabled]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') { setPlaying(false); next(); }
      if (e.key === 'ArrowLeft') { setPlaying(false); go(index - 1); }
      if (e.key === ' ') { e.preventDefault(); setPlaying((p) => !p); }
      if (e.key.toLowerCase() === 'v') narration.toggle();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [next, go, index, onClose, narration]);

  const pad = 10;
  const hole =
    hasAnchor && rect
      ? {
          top: rect.top - pad,
          left: rect.left - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
        }
      : null;

  // Sit the caption below the spotlight, or above when there is no room.
  const cardStyle: React.CSSProperties = (() => {
    if (!hole) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    const below = hole.top + hole.height + 18;
    const fitsBelow = below + CARD_ESTIMATED_HEIGHT < window.innerHeight;
    const left = Math.min(Math.max(16, hole.left), Math.max(16, window.innerWidth - CARD_WIDTH - 16));
    return fitsBelow
      ? { top: below, left }
      : { top: Math.max(16, hole.top - CARD_ESTIMATED_HEIGHT - 18), left };
  })();

  const easing = 'cubic-bezier(0.32, 0.72, 0, 1)';

  return (
    <div className="fixed inset-0 z-[5000]" role="dialog" aria-modal="true" aria-label="Guided tour">
      {/* A viewport-sized box-shadow dims everything but the cut-out. Far
          cheaper to animate than four separate panels. */}
      <div
        className="absolute rounded-2xl pointer-events-none"
        style={{
          top: hole?.top ?? window.innerHeight / 2,
          left: hole?.left ?? window.innerWidth / 2,
          width: hole?.width ?? 0,
          height: hole?.height ?? 0,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.70)',
          outline: hole ? '2px solid rgba(168,197,160,0.85)' : 'none',
          outlineOffset: 0,
          opacity: 1,
          transition: `top 700ms ${easing}, left 700ms ${easing}, width 700ms ${easing}, height 700ms ${easing}, outline-color 300ms linear`,
        }}
      />

      {/* Click anywhere outside the caption to leave. */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        key={step.id}
        className="tour-card absolute w-[min(400px,calc(100vw-2rem))] bg-white rounded-2xl shadow-2xl border border-black/10 overflow-hidden"
        style={{ ...cardStyle, transition: `top 700ms ${easing}, left 700ms ${easing}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/*
          Progress. Restarts with the step because the card is keyed by step id.

          With narration on there is no known duration — the step ends when the
          sentence does — so a filling bar would be a lie. An indeterminate
          shimmer says "in progress" without claiming to know how long.
        */}
        {playing && !isLast && !settling && (
          narration.enabled ? (
            <div className="h-0.5 bg-[#35624B]/15 overflow-hidden">
              <div className="h-full w-1/3 bg-[#35624B]/80 tour-indeterminate" />
            </div>
          ) : (
            <div
              className="h-0.5 bg-[#35624B]/80 origin-left"
              style={{ animation: `tour-dwell ${step.dwell ?? 9000}ms linear forwards` }}
            />
          )
        )}

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-[#35624B] font-semibold">
                Step {index + 1} of {TOUR_STEPS.length}
              </span>
              {settling && <Loader2 className="w-3 h-3 animate-spin text-neutral-300" />}
            </div>

            <div className="flex items-center gap-1 -mt-1">
              {narration.supported && (
                <button
                  onClick={narration.toggle}
                  aria-label={narration.enabled ? 'Turn narration off' : 'Listen to the guide'}
                  aria-pressed={narration.enabled}
                  title={
                    narration.enabled
                      ? `Narration on${narration.voiceName ? ` · ${narration.voiceName}` : ''} — press V to mute`
                      : 'Listen to the guide (V)'
                  }
                  className={`p-1.5 rounded-full transition-colors ${
                    narration.enabled
                      ? 'bg-[#EEF5EC] text-[#35624B]'
                      : 'text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  {narration.enabled ? (
                    <Volume2 className={`w-4 h-4 ${narration.speaking ? 'animate-pulse' : ''}`} />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                </button>
              )}
              <button
                onClick={onClose}
                aria-label="End tour"
                className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <h3 className="font-serif-display text-lg text-[#111111] mt-0.5">{step.title}</h3>
          <p className="text-xs text-neutral-700 leading-relaxed mt-1.5">{step.body}</p>
          {step.detail && (
            <p className="text-[11px] text-neutral-500 leading-relaxed mt-2 pt-2 border-t border-black/5">
              {step.detail}
            </p>
          )}

          <div className="flex items-center gap-1 mt-3">
            {TOUR_STEPS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => { setPlaying(false); go(i); }}
                aria-label={`Step ${i + 1}: ${s.title}`}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  i === index ? 'bg-[#183A2A]' : i < index ? 'bg-[#35624B]/40' : 'bg-neutral-200'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 mt-3">
            <button
              onClick={() => setPlaying((p) => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-black/10 text-[11px] font-medium text-neutral-700 hover:border-black/30 transition-colors"
            >
              {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {playing ? 'Pause' : 'Play'}
            </button>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => { setPlaying(false); go(index - 1); }}
                disabled={index === 0}
                aria-label="Previous step"
                className="p-1.5 rounded-full border border-black/10 text-neutral-600 disabled:opacity-30 hover:border-black/30 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {isLast ? (
                <button
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-full bg-[#183A2A] text-white text-[11px] font-medium hover:bg-[#35624B] transition-colors"
                >
                  Finish
                </button>
              ) : (
                <button
                  onClick={() => { setPlaying(false); next(); }}
                  aria-label="Next step"
                  className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#183A2A] text-white text-[11px] font-medium hover:bg-[#35624B] transition-colors"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="text-[10px] text-neutral-400 mt-2">
            Space to pause · ← → to step · V for voice · Esc to leave
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourOverlay;
