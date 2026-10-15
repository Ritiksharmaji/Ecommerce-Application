/**
 * Languages the shopping assistant can listen in. Replies follow whatever language the user writes or speaks;
 * this choice tells the phone which language to listen for (speech recognition can't auto-detect) and is sent
 * to the server as a hint.
 */
export interface ChatLanguage {
  /** BCP-47 code used for speech recognition / text-to-speech. */
  code: string;
  /** English name sent to the server. */
  name: string;
  /** Shown in the picker, in the language itself. */
  label: string;
}

export const CHAT_LANGUAGES: ChatLanguage[] = [
  {code: 'en-IN', name: 'English', label: 'English'},
  {code: 'hi-IN', name: 'Hindi', label: 'हिन्दी'},
  {code: 'mr-IN', name: 'Marathi', label: 'मराठी'},
  {code: 'bn-IN', name: 'Bengali', label: 'বাংলা'},
  {code: 'ta-IN', name: 'Tamil', label: 'தமிழ்'},
  {code: 'te-IN', name: 'Telugu', label: 'తెలుగు'},
  {code: 'kn-IN', name: 'Kannada', label: 'ಕನ್ನಡ'},
  {code: 'ml-IN', name: 'Malayalam', label: 'മലയാളം'},
  {code: 'gu-IN', name: 'Gujarati', label: 'ગુજરાતી'},
  {code: 'pa-IN', name: 'Punjabi', label: 'ਪੰਜਾਬੀ'},
  {code: 'or-IN', name: 'Odia', label: 'ଓଡ଼ିଆ'},
  {code: 'ur-IN', name: 'Urdu', label: 'اردو'},
  {code: 'es-ES', name: 'Spanish', label: 'Español'},
  {code: 'fr-FR', name: 'French', label: 'Français'},
  {code: 'de-DE', name: 'German', label: 'Deutsch'},
  {code: 'ar-SA', name: 'Arabic', label: 'العربية'},
];

const base = (code: string) => code.split(/[-_]/)[0].toLowerCase();

/** The picker's starting value: the phone's language if we support it, else English. */
export function defaultChatLanguage(deviceLocale: string): string {
  return CHAT_LANGUAGES.find(l => base(l.code) === base(deviceLocale))?.code ?? 'en-IN';
}

export const chatLanguageName = (code: string) =>
  CHAT_LANGUAGES.find(l => l.code === code)?.name ?? 'English';

const SCRIPTS: [RegExp, string][] = [
  [/[ঀ-৿]/, 'bn-IN'],
  [/[਀-੿]/, 'pa-IN'],
  [/[઀-૿]/, 'gu-IN'],
  [/[଀-୿]/, 'or-IN'],
  [/[஀-௿]/, 'ta-IN'],
  [/[ఀ-౿]/, 'te-IN'],
  [/[ಀ-೿]/, 'kn-IN'],
  [/[ഀ-ൿ]/, 'ml-IN'],
];

/** Which language a reply is written in, from its script - so a Hindi reply is read with a Hindi voice. */
export function replyLanguage(text: string, selected: string): string {
  const sel = base(selected);
  if (/[ऀ-ॿ]/.test(text)) return ['hi', 'mr'].includes(sel) ? selected : 'hi-IN';
  if (/[؀-ۿ]/.test(text)) return ['ur', 'ar'].includes(sel) ? selected : 'ur-IN';
  for (const [pattern, code] of SCRIPTS) if (pattern.test(text)) return code;
  return ['es', 'fr', 'de'].includes(sel) ? selected : 'en-IN'; // Latin letters (incl. Hinglish)
}
