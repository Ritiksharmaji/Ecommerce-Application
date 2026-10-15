import {useCallback, useEffect, useState} from 'react';
import Tts from 'react-native-tts';
import {deviceLocale} from './useSpeechInput';

/** Removes symbols that sound odd when read aloud. */
const forSpeech = (text: string) =>
  text
    .replace(/[*_#`>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Text-to-speech with the phone's built-in voice. `speak(text)` reads it (stopping anything already
 * playing); `stop()` silences it.
 */
export function useReadAloud() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Tts.getInitStatus()
      .then(() => {
        Tts.setDefaultLanguage(deviceLocale()).catch(() =>
          Tts.setDefaultLanguage('en-US').catch(() => undefined),
        );
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
