import {
  articleEnvelopeSchema,
  articleSchema,
  paginatedSchema,
  type Article,
  type PaginatorMeta,
} from "@/domain/schemas/api";
import { apiFetch } from "./http";

const articlePaginatedSchema = paginatedSchema(articleSchema);

export interface ListArticlesParams {
  category?: string;
  q?: string;
  perPage?: number;
}

/** GET /articles — public news/articles feed (paginated). */
export async function listArticles(
  params: ListArticlesParams = {}
): Promise<{ items: Article[]; meta: PaginatorMeta }> {
  const res = articlePaginatedSchema.parse(
    await apiFetch("/articles", {
      skipAuth: true,
      query: { category: params.category, q: params.q, per_page: params.perPage },
    })
  );
  return { items: res.data, meta: res.meta };
}

/** GET /articles/{slug} — a single article. */
export async function getArticle(slug: string): Promise<Article> {
  return articleEnvelopeSchema.parse(
    await apiFetch(`/articles/${slug}`, { skipAuth: true })
  ).data;
}
