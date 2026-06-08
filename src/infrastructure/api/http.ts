const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
const SANCTUM_BASE = process.env.NEXT_PUBLIC_SANCTUM_URL ?? "";

let csrfPromise: Promise<void> | null = null;

async function ensureCsrf(): Promise<void> {
  if (!SANCTUM_BASE) return;
  if (!csrfPromise) {
    csrfPromise = fetch(`${SANCTUM_BASE}/sanctum/csrf-cookie`, {
      credentials: "include",
    })
      .then(() => undefined)
      .catch((err) => {
        csrfPromise = null;
        throw err;
      });
  }
  await csrfPromise;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const escaped = name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1");
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${escaped}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message?: string
  ) {
    super(message ?? `API ${status}`);
    this.name = "ApiError";
  }
}

type QueryValue = string | number | boolean | null | undefined;

export interface ApiRequestOptions extends Omit<RequestInit, "body" | "method"> {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, QueryValue>;
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
  const { body, query, headers, method = "GET", ...rest } = options;
  const isMutation = method !== "GET";

  if (isMutation) await ensureCsrf();

  const xsrf = readCookie("XSRF-TOKEN");
  const hasBody = body !== undefined;

  const res = await fetch(buildUrl(path, query), {
    ...rest,
    method,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(xsrf ? { "X-XSRF-TOKEN": xsrf } : {}),
      ...headers,
    },
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errBody = await res
      .json()
      .catch(() => res.text().catch(() => null));
    throw new ApiError(res.status, errBody);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
