import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, Square, Languages, Radio } from 'lucide-react';
import type { SiteRow, SiteMetricsRow } from '../../lib/database.types';
import { generateMultilingualSummary, type SupportedLanguage } from '../../features/insights/multilingualSummary';

interface MultilingualAudioSummaryProps {
  site: SiteRow;
  metrics?: SiteMetricsRow | null;
}

export const MultilingualAudioSummary: React.FC<MultilingualAudioSummaryProps> = ({ site, metrics }) => {
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('en');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const summaries = generateMultilingualSummary(site, metrics);
  const currentSummary = summaries[selectedLang];

  // Load browser speech synthesis voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Stop audio on unmount or language change
  const stopAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
  };

  useEffect(() => {
    stopAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLang]);

  const speakSummary = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech Synthesis is not supported in your browser. You can read the text summary below.');
      return;
    }

    const synth = window.speechSynthesis;

    if (isPaused) {
      synth.resume();
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    synth.cancel();

    const fullText = `${currentSummary.title}. ${currentSummary.summaryText} Key Points: ${currentSummary.bulletPoints.join('. ')}`;
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.rate = speechRate;
    utterance.lang = currentSummary.bcp47Tag;

    // Try finding exact language voice (mr-IN, hi-IN, en-IN) or best fallback
    const targetLangCode = currentSummary.lang === 'mr' ? 'mr' : currentSummary.lang === 'hi' ? 'hi' : 'en';
    const matchedVoice = availableVoices.find(
      (v) => v.lang.toLowerCase().startsWith(targetLangCode) || v.lang.toLowerCase().includes(targetLangCode)
    );

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    synth.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const pauseAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      setIsPaused(true);
    }
  };

  return (
    <div className="bg-white rounded-[28px] p-6 border border-slate-200/70 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-50 rounded-2xl text-purple-700">
            <Volume2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-slate-900 flex items-center gap-2">
              Multilingual AI Voice Summary
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                <Radio className="w-3 h-3 text-purple-600 animate-pulse" />
                Text-to-Speech Engine
              </span>
            </h3>
            <p className="text-sm text-slate-500">
              Listen to AI executive findings in regional languages (English, Marathi &amp; Hindi)
            </p>
          </div>
        </div>

        {/* Language Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-semibold">
          {(['en', 'mr', 'hi'] as SupportedLanguage[]).map((langKey) => (
            <button
              key={langKey}
              type="button"
              onClick={() => setSelectedLang(langKey)}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                selectedLang === langKey
                  ? 'bg-purple-700 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 bg-white/50'
              }`}
            >
              <span>{summaries[langKey].flag}</span>
              <span>{summaries[langKey].langLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Control Bar & Equalizer */}
      <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {isPlaying ? (
            <button
              type="button"
              onClick={pauseAudio}
              className="p-3 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Pause className="w-5 h-5 fill-current" />
              Pause Audio
            </button>
          ) : (
            <button
              type="button"
              onClick={speakSummary}
              className="p-3 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Play className="w-5 h-5 fill-current" />
              {isPaused ? 'Resume Audio' : `Play in ${currentSummary.langLabel}`}
            </button>
          )}

          {(isPlaying || isPaused) && (
            <button
              type="button"
              onClick={stopAudio}
              className="p-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-semibold transition-colors"
              title="Stop Audio"
            >
              <Square className="w-5 h-5 fill-current" />
            </button>
          )}

          {/* Equalizer animation */}
          {isPlaying && (
            <div className="flex items-end gap-1 h-6 px-2">
              <span className="w-1 bg-purple-600 rounded-full animate-[bounce_1s_infinite_100ms] h-4" />
              <span className="w-1 bg-purple-600 rounded-full animate-[bounce_1s_infinite_300ms] h-6" />
              <span className="w-1 bg-purple-600 rounded-full animate-[bounce_1s_infinite_200ms] h-3" />
              <span className="w-1 bg-purple-600 rounded-full animate-[bounce_1s_infinite_400ms] h-5" />
            </div>
          )}
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <Languages className="w-4 h-4 text-purple-600" />
          <span>Speech Speed:</span>
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-purple-200">
            {[0.85, 1.0, 1.25].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => setSpeechRate(rate)}
                className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                  speechRate === rate ? 'bg-purple-700 text-white' : 'text-slate-600 hover:bg-purple-50'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Script & Findings Transcript */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <span>Audio Narration Transcript ({currentSummary.langLabel})</span>
          {isPlaying ? (
            <span className="text-purple-700 font-bold flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5 animate-pulse" /> Speaking...
            </span>
          ) : (
            <span className="text-slate-400 flex items-center gap-1">
              <VolumeX className="w-3.5 h-3.5" /> Idle
            </span>
          )}
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-sm text-slate-800 leading-relaxed font-sans">
          <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <span>{currentSummary.flag}</span>
            {currentSummary.title}
          </h4>

          <p className="text-slate-700">{currentSummary.summaryText}</p>

          <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Key Action Points:
            </span>
            <ul className="space-y-1">
              {currentSummary.bulletPoints.map((pt, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs font-medium text-slate-800">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
