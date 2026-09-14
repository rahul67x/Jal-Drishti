import { useCallback, useEffect, useState, type RefObject } from 'react';

/**
 * Expands an element to fill the screen, with two strategies.
 *
 * 1. The native Fullscreen API, which also hides the browser chrome.
 * 2. A CSS fallback that pins the element over the viewport.
 *
 * The fallback is not decoration. The native API is refused in more situations
 * than people expect — inside an iframe without `allow="fullscreen"`, in some
 * embedded webviews, under certain kiosk or enterprise policies, and on iOS
 * Safari for non-video elements. In those cases `document.fullscreenEnabled`
 * can still report true while the request rejects with a permissions error.
 * Without a fallback the button would simply do nothing, which is a bad thing
 * to discover mid-demo.
 *
 * Both modes exit on Escape and report through the same `isFullscreen` flag,
 * so callers do not care which one is active.
 */

interface FullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
}

interface FullscreenDocument extends Document {
  webkitExitFullscreen?: () => Promise<void>;
  webkitFullscreenElement?: Element | null;
}

export function useFullscreen(ref: RefObject<HTMLElement | null>) {
  const [nativeActive, setNativeActive] = useState(false);
  const [cssActive, setCssActive] = useState(false);

  const isFullscreen = nativeActive || cssActive;

  // Track the native state from the browser's own event, not from our click
  // handler — the user can leave via Escape or the browser's exit control.
  useEffect(() => {
    const doc = document as FullscreenDocument;
    const handleChange = () => {
      const active = doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
      setNativeActive(active !== null && active === ref.current);
    };
    document.addEventListener('fullscreenchange', handleChange);
    document.addEventListener('webkitfullscreenchange', handleChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
      document.removeEventListener('webkitfullscreenchange', handleChange);
    };
  }, [ref]);

  // The native API handles Escape itself; the CSS fallback has to.
  useEffect(() => {
    if (!cssActive) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCssActive(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [cssActive]);

  // Stop the page scrolling behind an expanded map.
  useEffect(() => {
    if (!cssActive) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [cssActive]);

  const toggle = useCallback(async () => {
    const element = ref.current as FullscreenElement | null;
    const doc = document as FullscreenDocument;
    if (!element) return;

    if (nativeActive) {
      try {
        await (doc.exitFullscreen?.() ?? doc.webkitExitFullscreen?.());
      } catch {
        setNativeActive(false);
      }
      return;
    }

    if (cssActive) {
      setCssActive(false);
      return;
    }

    // Expand with CSS straight away so the button always does something
    // visible, then try to upgrade to real fullscreen. Attempting native first
    // and falling back on rejection left a window where a refused request
    // produced no feedback at all.
    setCssActive(true);

    const request = element.requestFullscreen ?? element.webkitRequestFullscreen;
    if (!request) return;

    try {
      await request.call(element);
      // Native took over, so the CSS pin is no longer needed.
      setCssActive(false);
    } catch {
      // Refused. Keep the CSS expansion.
    }
  }, [ref, nativeActive, cssActive]);

  return { isFullscreen, usingFallback: cssActive, toggle };
}
