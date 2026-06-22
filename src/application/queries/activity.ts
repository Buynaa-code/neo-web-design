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
