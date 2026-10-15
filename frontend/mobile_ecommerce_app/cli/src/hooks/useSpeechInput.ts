import {useCallback, useEffect, useRef, useState} from 'react';
import {PermissionsAndroid, Platform} from 'react-native';
import Voice from '@react-native-voice/voice';

/** Device language (e.g. "en-IN") so accents / Hinglish are recognised; falls back to US English. */
export const deviceLocale = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale || 'en-US';
  } catch {
    return 'en-US';
  }
};

async function ensureMicPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true; // iOS asks automatically (Info.plist usage strings)
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
    title: 'Microphone',
    message: 'Shopvra uses the microphone so you can talk to the shopping assistant.',
    buttonPositive: 'Allow',
  });
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

/**
 * Speech-to-text with the phone's own recogniser (Google on Android, Apple on iOS).
 * `start()` listens; the live transcript is in `partial`; when the user stops talking the final text
 * is passed to `onFinalText` (the chat sends it like a typed message).
 */
export function useSpeechInput(onFinalText: (text: string) => void) {
  const [available, setAvailable] = useState(false);
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState('');
  const [error, setError] = useState<string | null>(null);
  const onFinal = useRef(onFinalText);
  onFinal.current = onFinalText;

  useEffect(() => {
    Voice.isAvailable()
      .then(ok => setAvailable(!!ok))
      .catch(() => setAvailable(false));
    Voice.onSpeechPartialResults = e => setPartial(e.value?.[0] ?? '');
    Voice.onSpeechResults = e => {
      const text = e.value?.[0]?.trim();
      setListening(false);
      setPartial('');
      if (text) onFinal.current(text);
    };
    Voice.onSpeechEnd = () => setListening(false);
    Voice.onSpeechError = e => {
      setListening(false);
      setPartial('');
      // "No match" / "speech timeout" just mean nothing was heard.
      setError(
        e.error?.message?.includes('7') || e.error?.message?.includes('6')
          ? "Didn't catch that - try again"
          : 'Voice input is not available right now',
      );
    };
    return () => {
      Voice.destroy()
        .then(() => Voice.removeAllListeners())
        .catch(() => undefined);
    };
  }, []);

  const start = useCallback(async () => {
    setError(null);
    if (!(await ensureMicPermission())) {
      setError('Microphone permission is needed for voice input');
      return;
    }
    try {
      setPartial('');
      await Voice.start(deviceLocale());
      setListening(true);
    } catch {
      setError('Voice input is not available right now');
    }
  }, []);

  const stop = useCallback(() => {
    Voice.stop().catch(() => undefined);
  }, []);

  return {available, listening, partial, error, start, stop};
}
