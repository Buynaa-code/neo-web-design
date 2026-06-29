import { getToken, notifyUnauthorized } from "./token";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message?: string
  ) {
    super(message ?? `API ${status}`);
    this.name = "ApiError";
  }

  /** Laravel validation errors: `{ message, errors: { field: string[] } }`. */
  get validationErrors(): Record<string, string[]> | null {
    if (
      this.status === 422 &&
      this.body &&
      typeof this.body === "object" &&
      "errors" in this.body
    ) {
      return (this.body as { errors: Record<string, string[]> }).errors;
    }
    return null;
  }
}

type QueryValue = string | number | boolean | null | undefined;

export interface ApiRequestOptions extends Omit<RequestInit, "body" | "method"> {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, QueryValue>;
  /** Skip attaching the bearer token (e.g. public endpoints). Default false. */
  skipAuth?: boolean;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const base = path.startsWith("http") ? "" : API_BASE;
  let url = `${base}${path}`;
  if (query) {
    const search = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") {
        search.set(k, String(v));
      }
    }
    const qs = search.toString();
    if (qs) url += `?${qs}`;
  }
  return url;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { body, query, headers, method = "GET", skipAuth = false, ...rest } =
    options;
  const hasBody = body !== undefined;
  // FormData (file upload) must be sent raw — the browser sets the multipart
  // boundary in Content-Type itself; serializing or overriding it breaks it.
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;
  const token = skipAuth ? null : getToken();

  const res = await fetch(buildUrl(path, query), {
    ...rest,
    method,
    headers: {
      Accept: "application/json",
      ...(hasBody && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: hasBody
      ? isFormData
        ? (body as FormData)
        : JSON.stringify(body)
      : undefined,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => res.text().catch(() => null));
    // A 401 means the token is gone/expired — clear it and notify the app so
    // it can drop to a signed-out state instead of looping on failed calls.
    if (res.status === 401 && !skipAuth) notifyUnauthorized();
    throw new ApiError(res.status, errBody);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
