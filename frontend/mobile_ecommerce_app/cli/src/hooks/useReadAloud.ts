import {useCallback, useEffect, useRef, useState} from 'react';
import Tts, {type Voice} from 'react-native-tts';
import {deviceLocale} from './useSpeechInput';

/** Removes symbols that sound odd when read aloud. */
const forSpeech = (text: string) =>
  text
    .replace(/[*_#`>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Pleasant female voices, best first. Voices don't report a gender, so we match known names/ids:
 * Android (Google TTS) ids look like "en-us-x-sfg-local" / "hi-in-x-hia-local"; iOS ids like
 * "com.apple.voice.enhanced.en-US.Ava".
 */
const FEMALE_VOICES = [
  // iOS - premium/enhanced (natural) first
  'Ava',
  'Zoe',
  'Samantha',
  'Allison',
  'Susan',
  'Serena',
  'Kate',
  'Karen',
  'Moira',
  'Tessa',
  'Isha',
  'Veena',
  'Lekha',
  'Monica',
  'Paulina',
  'Amelie',
  'Audrey',
  'Anna',
  'Mariam',
  // Android - Google TTS female voices
  'en-us-x-sfg',
  'en-us-x-tpf',
  'en-us-x-iog',
  'en-us-x-iob',
  'en-us-x-tpc',
  'en-in-x-ena',
  'en-in-x-ahp',
  'en-in-x-cxx',
  'en-gb-x-gba',
  'en-gb-x-gbc',
  'en-gb-x-rjs',
  'en-au-x-afc',
  'hi-in-x-hia',
  'hi-in-x-hic',
  'mr-in-x-mrf',
  'bn-in-x-bin',
  'ta-in-x-tag',
  'te-in-x-tef',
  'kn-in-x-knf',
  'ml-in-x-mlf',
  'gu-in-x-guf',
  'pa-in-x-pag',
  'ur-in-x-urb',
  'female',
];

const FALLBACK_LANGUAGE: Record<string, string> = {mr: 'hi-IN', ur: 'hi-IN', pa: 'hi-IN'};

const base = (code: string) => code.split(/[-_]/)[0].toLowerCase();
const norm = (code: string) => code.replace('_', '-').toLowerCase();

/** Picks the nicest installed voice for a language - a known female voice when there is one. */
function pickVoice(voices: Voice[], langCode: string): Voice | undefined {
  const matching = voices.filter(v => !v.notInstalled && base(v.language) === base(langCode));
  const score = (v: Voice) => {
    const id = `${v.id} ${v.name}`.toLowerCase();
    if (/\bmale\b/.test(id)) return -1;
    const rank = FEMALE_VOICES.findIndex(name => id.includes(name.toLowerCase()));
    let points = rank < 0 ? 0 : 1000 - rank * 10;
    if (/premium|enhanced|neural|natural/.test(id)) points += 300; // higher-quality versions
    if (norm(v.language) === norm(langCode)) points += 50; // the right accent
    if (!v.networkConnectionRequired) points += 20; // works offline, starts faster
    return points + (v.quality ?? 0) / 100;
  };
  // English: only voices we know are female; other languages: the best one we have.
  const minimum = base(langCode) === 'en' ? 1 : 0;
  return matching
    .map(v => ({v, s: score(v)}))
    .filter(x => x.s >= minimum)
    .sort((a, b) => b.s - a.s)[0]?.v;
}

/**
 * Text-to-speech with the phone's built-in voices. `speak(text, language)` reads it in that language
 * (a natural female voice when one is installed), stopping anything already playing; `stop()` silences it.
 */
export function useReadAloud() {
  const [ready, setReady] = useState(false);
  const voices = useRef<Voice[]>([]);

  useEffect(() => {
    Tts.getInitStatus()
      .then(async () => {
        voices.current = await Tts.voices().catch(() => []);
        await Tts.setDefaultRate(0.5).catch(() => undefined); // calm, natural pace
        setReady(true);
      })
      .catch(err => {
        // Android without a speech engine: offer to install one.
        if (err?.code === 'no_engine') Tts.requestInstallEngine().catch(() => undefined);
      });
    return () => {
      Tts.stop().catch(() => undefined);
    };
  }, []);

  const speak = useCallback(
    async (text: string, language: string = deviceLocale()) => {
      const clean = forSpeech(text);
      if (!ready || !clean) return;
      await Tts.stop().catch(() => undefined);
      // No voice for a language? Use a related one with the same script (e.g. Marathi -> Hindi voice).
      const fallback = FALLBACK_LANGUAGE[base(language)];
      const voice =
        pickVoice(voices.current, language) ??
        (fallback ? pickVoice(voices.current, fallback) : undefined);
      await Tts.setDefaultLanguage(voice?.language ?? language).catch(() => undefined);
      if (voice) await Tts.setDefaultVoice(voice.id).catch(() => undefined);
      // Softer tone when no known female English voice is installed.
      await Tts.setDefaultPitch(!voice && base(language) === 'en' ? 1.15 : 1).catch(
        () => undefined,
      );
      Tts.speak(clean);
    },
    [ready],
  );

  const stop = useCallback(() => {
    Tts.stop().catch(() => undefined);
  }, []);

  return {ready, speak, stop};
}
