/** Shopping-assistant API types (POST /api/chat). */

export interface ChatProduct {
  id: string;
  name: string;
  price: number;
  comparePrice?: number;
  image?: string;
  category: string;
  rating: number;
}

export type ChatActionName =
  | 'navigate'
  | 'add_to_cart'
  | 'show_address_form'
  | 'confirm_order'
  | 'show_auth_form'
  | 'update_cart_item'
  | 'clear_cart'
  | 'update_wishlist'
  | 'delete_address'
  | 'sign_out'
  | 'delete_account';

/** A step the assistant asks the app to perform; the app reports the outcome back. */
export interface ChatAction {
  id: string;
  name: ChatActionName;
  input: Record<string, any>;
}

export interface ChatActionResult {
  id: string;
  ok: boolean;
  result: string;
}

export interface ChatResponse {
  success: boolean;
  sessionId: string;
  reply: string;
  actions: ChatAction[];
  products: ChatProduct[];
}

export type ActionStatus = 'pending' | 'done' | 'failed' | 'dismissed';

export type ChatItem =
  | {key: string; kind: 'user'; text: string}
  | {key: string; kind: 'assistant'; text: string; products: ChatProduct[]}
  | {key: string; kind: 'action'; action: ChatAction; status: ActionStatus; note?: string}
  | {key: string; kind: 'error'; text: string};
