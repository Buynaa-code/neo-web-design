"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getArticle,
  listArticles,
  type ListArticlesParams,
} from "@/infrastructure/api/articles";
import { STALE } from "@/infrastructure/query/client";
import { queryKeys } from "@/infrastructure/query/keys";

/** Articles are public and slow-changing — treated as reference (long staleTime, persisted). */
export function useArticles(params: ListArticlesParams = {}) {
  return useQuery({
    queryKey: queryKeys.articles(params),
    queryFn: () => listArticles(params),
    staleTime: STALE.reference,
  });
}

export function useArticle(slug: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.article(slug ?? ""),
    queryFn: () => getArticle(slug as string),
    enabled: !!slug,
    staleTime: STALE.reference,
  });
}
