"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listViews, recordView } from "@/infrastructure/api/views";
import {
  createConversation,
  listConversations,
  listMessages,
  markConversationRead,
  sendMessage,
  type NewConversationInput,
} from "@/infrastructure/api/conversations";
import { toListing } from "@/infrastructure/api/listings";
import type { Message } from "@/domain/schemas/api";
import { queryKeys } from "@/infrastructure/query/keys";

/* -------------------------------------------------------------------------- */
/* Recently-viewed                                                            */
/* -------------------------------------------------------------------------- */

export function useViews() {
  return useQuery({
    queryKey: queryKeys.views,
    queryFn: listViews,
    select: (res) => ({ ...res, listings: res.items.map(toListing) }),
  });
}

export function useRecordView() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (listingId: number) => recordView(listingId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.views }),
  });
}

/* -------------------------------------------------------------------------- */
/* Conversations / messages                                                   */
/* -------------------------------------------------------------------------- */

export function useConversations() {
  return useQuery({ queryKey: queryKeys.conversations, queryFn: listConversations });
}

export function useMessages(conversationId: number | null | undefined) {
  return useQuery({
    queryKey: queryKeys.messages(conversationId ?? 0),
    queryFn: () => listMessages(conversationId as number),
    enabled: conversationId != null,
  });
}

export function useConversationMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.conversations });

  const start = useMutation({
    mutationFn: (input: NewConversationInput) => createConversation(input),
    onSuccess: invalidate,
  });
  const send = useMutation({
    mutationFn: ({ conversationId, body }: { conversationId: number; body: string }) =>
      sendMessage(conversationId, body),
    // Optimistically append the sent bubble so it shows instantly instead of
    // waiting for the server refetch; rolled back on error.
    onMutate: async ({ conversationId, body }) => {
      const key = queryKeys.messages(conversationId);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Message[]>(key);
      const optimistic: Message = {
        id: -Date.now(),
        conversationId,
        sender: "customer",
        body,
        readAt: null,
        createdAt: new Date().toISOString(),
      };
      qc.setQueryData<Message[]>(key, [...(previous ?? []), optimistic]);
      return { key, previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(ctx.key, ctx.previous);
    },
    onSuccess: (_data, { conversationId }) => {
      invalidate();
      qc.invalidateQueries({ queryKey: queryKeys.messages(conversationId) });
    },
  });
  const markRead = useMutation({
    mutationFn: (conversationId: number) => markConversationRead(conversationId),
    onSuccess: invalidate,
  });

  return { start, send, markRead };
}
