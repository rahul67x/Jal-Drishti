import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Spoken narration for the guided tour, using the browser's own speech
 * synthesis. No network, no API key, no audio files to record or keep in step
 * with the script — the text the reader sees is the text that is spoken.
 *
 * Four things make this fiddly in practice, and each is handled below:
 *
 *   1. Voices load asynchronously. On a cold page `getVoices()` returns an
 *      empty array and only fills in later, announced by `voiceschanged`.
 *   2. Chrome stops speaking after roughly 15 seconds unless it is nudged.
 *      A periodic pause/resume keeps longer passages alive.
 *   3. `cancel()` fires `onend` on the utterance it just killed. Without a
 *      generation counter, cancelling would look identical to finishing — and
 *      since the tour advances when speech finishes, every manual skip would
 *      advance twice.
 *   4. Speech continues after the component unmounts unless explicitly
 *      cancelled, which is how a tour ends up narrating over the next page.
 */

const PREFERRED_LOCALES = ['en-IN', 'en-GB', 'en-AU', 'en-US'];

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;

  // Prefer an Indian English voice — this is an Indian watershed project, and
  // the place names read far better. Falls back through other English locales.
  for (const locale of PREFERRED_LOCALES) {
    const exact = voices.find((v) => v.lang === locale || v.lang === locale.replace('-', '_'));
    if (exact) return exact;
  }
  return voices.find((v) => v.lang.startsWith('en')) ?? voices[0];
}

export function useNarration() {
  const supported =
    typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined';

  const [enabled, setEnabled] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);

  const keepAliveRef = useRef<number | null>(null);
  /** Bumped whenever speech is cancelled, so a stale `onend` is ignored. */
  const generationRef = useRef(0);
  /** Distinguishes a deliberate pause from the keep-alive's pause/resume. */
  const userPausedRef = useRef(false);

  // Voices arrive late on a cold load, so take them both ways.
  useEffect(() => {
    if (!supported) return;
    const load = () => setVoice(pickVoice(window.speechSynthesis.getVoices()));
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, [supported]);

  const stopKeepAlive = useCallback(() => {
    if (keepAliveRef.current !== null) {
      window.clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    if (!supported) return;
    // Invalidate anything in flight before killing it, so its onend is ignored.
    generationRef.current++;
    userPausedRef.current = false;
    stopKeepAlive();
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported, stopKeepAlive]);

  /**
   * Speaks `text`, calling `onDone` only when it genuinely finishes.
   *
   * `onDone` also fires on error, deliberately: a speech failure must not leave
   * the tour waiting forever for an utterance that will never end.
   */
  const speak = useCallback(
    (text: string, onDone?: () => void) => {
      if (!supported || !enabled || !text.trim()) return;

      const generation = ++generationRef.current;
      userPausedRef.current = false;

      // Always clear the queue first. Without this, stepping quickly through
      // the tour stacks utterances and they play long after the reader moved on.
      window.speechSynthesis.cancel();
      stopKeepAlive();

      const utterance = new SpeechSynthesisUtterance(text);
      if (voice) utterance.voice = voice;
      utterance.lang = voice?.lang ?? 'en-IN';
      // Slightly under default: this is explanatory material, not a menu prompt.
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;

      const finish = () => {
        stopKeepAlive();
        setSpeaking(false);
        // Only the current utterance may advance the tour. A cancelled one
        // bumped the generation, so this comparison fails and it stays quiet.
        if (generation === generationRef.current) onDone?.();
      };

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = finish;
      utterance.onerror = finish;

      window.speechSynthesis.speak(utterance);

      // Chrome's ~15 second cutoff. Pausing and immediately resuming resets its
      // internal timer with no audible break — but must not fight a pause the
      // user asked for.
      keepAliveRef.current = window.setInterval(() => {
        if (userPausedRef.current) return;
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        } else {
          stopKeepAlive();
        }
      }, 10_000);
    },
    [supported, enabled, voice, stopKeepAlive]
  );

  const pause = useCallback(() => {
    if (!supported || !window.speechSynthesis.speaking) return;
    userPausedRef.current = true;
    window.speechSynthesis.pause();
    setSpeaking(false);
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported) return;
    userPausedRef.current = false;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setSpeaking(true);
    }
  }, [supported]);

  const toggle = useCallback(() => {
    setEnabled((was) => {
      if (was) cancel();
      return !was;
    });
  }, [cancel]);

  // Never let narration outlive the tour.
  useEffect(() => cancel, [cancel]);

  return {
    supported,
    enabled,
    speaking,
    voiceName: voice?.name ?? null,
    speak,
    cancel,
    pause,
    resume,
    toggle,
  };
}
