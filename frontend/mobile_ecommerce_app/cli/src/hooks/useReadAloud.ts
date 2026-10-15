import {useCallback, useEffect, useState} from 'react';
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
 * Android (Google TTS) ids look like "en-us-x-sfg-local"; iOS ids like "com.apple.voice.enhanced.en-US.Ava".
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
  'female',
];

/** Picks the nicest installed female voice for the language (falls back to any English one). */
function pickVoice(voices: Voice[], locale: string): Voice | undefined {
  const usable = voices.filter(v => !v.notInstalled);
  const lang = locale.toLowerCase().replace('_', '-');
  const english = usable.filter(v => v.language.toLowerCase().startsWith('en'));
  const score = (v: Voice) => {
    const id = `${v.id} ${v.name}`.toLowerCase();
    const rank = FEMALE_VOICES.findIndex(name => id.includes(name.toLowerCase()));
    if (rank < 0) return -1;
    let points = 1000 - rank * 10;
    if (/premium|enhanced|neural|natural/.test(id)) points += 300; // higher-quality versions
    if (v.language.toLowerCase().replace('_', '-') === lang) points += 50; // the user's accent
    if (!v.networkConnectionRequired) points += 20; // works offline, starts faster
    return points + (v.quality ?? 0) / 100;
  };
  return english
    .map(v => ({v, s: score(v)}))
    .filter(x => x.s >= 0)
    .sort((a, b) => b.s - a.s)[0]?.v;
}

/**
 * Text-to-speech with the phone's built-in voice (a natural female voice when one is installed).
 * `speak(text)` reads it (stopping anything already playing); `stop()` silences it.
 */
export function useReadAloud() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Tts.getInitStatus()
      .then(async () => {
        const locale = deviceLocale();
        await Tts.setDefaultLanguage(locale).catch(() =>
          Tts.setDefaultLanguage('en-US').catch(() => undefined),
        );
        const voice = pickVoice(await Tts.voices().catch(() => []), locale);
        if (voice) {
          await Tts.setDefaultLanguage(voice.language).catch(() => undefined);
          await Tts.setDefaultVoice(voice.id).catch(() => undefined);
        } else {
          await Tts.setDefaultPitch(1.15).catch(() => undefined); // softer, higher tone if no female voice
        }
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
    (text: string) => {
      const clean = forSpeech(text);
      if (!ready || !clean) return;
      Tts.stop()
        .catch(() => undefined)
        .finally(() => Tts.speak(clean));
    },
    [ready],
  );

  const stop = useCallback(() => {
    Tts.stop().catch(() => undefined);
  }, []);

  return {ready, speak, stop};
}
