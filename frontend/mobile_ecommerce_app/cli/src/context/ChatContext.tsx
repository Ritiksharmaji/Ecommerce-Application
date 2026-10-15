import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {useAuth} from '@/context/AuthContext';
import {useReadAloud} from '@/hooks/useReadAloud';
import {chatApi, type ChatRequest} from '@/services/api';
import type {ChatActionResult, ChatItem, ChatResponse} from '@/types/chat';
import {getErrorMessage} from '@/utils/errors';

interface ChatContextValue {
  items: ChatItem[];
  loading: boolean;
  sendMessage: (text: string) => void;
  /** Report what the app did for an assistant action; the turn resumes once every action has a result. */
  resolveAction: (id: string, ok: boolean, result: string) => void;
  resetChat: () => void;
  /** Read assistant replies aloud (off by default - typing/reading is the default mode). */
  readAloud: boolean;
  toggleReadAloud: () => void;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

let keySeq = 0;
const nextKey = () => `c${Date.now()}-${keySeq++}`;

/**
 * Shopping-assistant conversation, kept app-wide so it survives navigation (the assistant can open
 * product pages and the user comes back to the chat). History itself lives on the server.
 */
export function ChatProvider({children}: {children: ReactNode}) {
  const {token} = useAuth();
  const [items, setItems] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [readAloud, setReadAloud] = useState(false);
  const readAloudRef = useRef(readAloud);
  readAloudRef.current = readAloud;
  const {speak, stop: stopSpeaking} = useReadAloud();
  const sessionId = useRef<string | undefined>(undefined);
  /** Results for the current batch of actions (null = still waiting). */
  const batch = useRef<Map<string, ChatActionResult | null>>(new Map());

  const resetChat = useCallback(() => {
    sessionId.current = undefined;
    batch.current = new Map();
    setItems([]);
    setLoading(false);
    stopSpeaking();
  }, [stopSpeaking]);

  const toggleReadAloud = useCallback(() => {
    setReadAloud(on => {
      if (on) stopSpeaking();
      return !on;
    });
  }, [stopSpeaking]);

  // A conversation belongs to one account: start fresh on sign-out / account switch.
  const prevToken = useRef(token);
  useEffect(() => {
    if (prevToken.current && prevToken.current !== token) resetChat();
    prevToken.current = token;
  }, [token, resetChat]);

  const handleResponse = useCallback(
    (res: ChatResponse) => {
      sessionId.current = res.sessionId;
      if (readAloudRef.current && res.reply) speak(res.reply);
      const added: ChatItem[] = [];
      if (res.reply || res.products.length) {
        added.push({key: nextKey(), kind: 'assistant', text: res.reply, products: res.products});
      }
      batch.current = new Map(res.actions.map(a => [a.id, null]));
      for (const action of res.actions) {
        added.push({key: nextKey(), kind: 'action', action, status: 'pending'});
      }
      setItems(prev => [...prev, ...added]);
    },
    [speak],
  );

  const post = useCallback(
    async (body: ChatRequest) => {
      setLoading(true);
      try {
        handleResponse(await chatApi.send({...body, sessionId: sessionId.current}));
      } catch (error) {
        setItems(prev => [
          ...prev,
          {
            key: nextKey(),
            kind: 'error',
            text: getErrorMessage(error, 'Could not reach the assistant'),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [handleResponse],
  );

  const sendMessage = useCallback(
    (text: string) => {
      const message = text.trim();
      if (!message || loading) return;
      stopSpeaking();
      // Unfinished actions are reported as not completed by the server.
      batch.current = new Map();
      setItems(prev => [
        ...prev.map(item =>
          item.kind === 'action' && item.status === 'pending'
            ? {...item, status: 'dismissed' as const}
            : item,
        ),
        {key: nextKey(), kind: 'user', text: message},
      ]);
      post({message});
    },
    [loading, post, stopSpeaking],
  );

  const resolveAction = useCallback(
    (id: string, ok: boolean, result: string) => {
      if (!batch.current.has(id) || batch.current.get(id)) return;
      batch.current.set(id, {id, ok, result});
      setItems(prev =>
        prev.map(item =>
          item.kind === 'action' && item.action.id === id
            ? {...item, status: ok ? 'done' : 'failed', note: result}
            : item,
        ),
      );
      const results = [...batch.current.values()];
      if (results.every(Boolean)) {
        batch.current = new Map();
        post({actionResults: results as ChatActionResult[]});
      }
    },
    [post],
  );

  const value = useMemo(
    () => ({items, loading, sendMessage, resolveAction, resetChat, readAloud, toggleReadAloud}),
    [items, loading, sendMessage, resolveAction, resetChat, readAloud, toggleReadAloud],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
