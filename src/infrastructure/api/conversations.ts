import {
  conversationEnvelopeSchema,
  conversationListSchema,
  messageEnvelopeSchema,
  messageListSchema,
  type Conversation,
  type Message,
} from "@/domain/schemas/api";
import { apiFetch } from "./http";

export interface NewConversationInput {
  agent_id: number;
  listing_id?: number | null;
  body: string;
}

/** GET /conversations — the user's agent threads. */
export async function listConversations(): Promise<Conversation[]> {
  return conversationListSchema.parse(await apiFetch("/conversations")).data;
}

/** POST /conversations — start a thread with an agent. */
export async function createConversation(
  input: NewConversationInput
): Promise<Conversation> {
  return conversationEnvelopeSchema.parse(
    await apiFetch("/conversations", { method: "POST", body: input })
  ).data;
}

/** GET /conversations/{id}/messages */
export async function listMessages(conversationId: number): Promise<Message[]> {
  return messageListSchema.parse(
    await apiFetch(`/conversations/${conversationId}/messages`)
  ).data;
}

/** POST /conversations/{id}/messages */
export async function sendMessage(conversationId: number, body: string): Promise<Message> {
  return messageEnvelopeSchema.parse(
    await apiFetch(`/conversations/${conversationId}/messages`, {
      method: "POST",
      body: { body },
    })
  ).data;
}

/** PATCH /conversations/{id}/read — mark a thread read. */
export async function markConversationRead(conversationId: number): Promise<void> {
  await apiFetch(`/conversations/${conversationId}/read`, { method: "PATCH" });
}
