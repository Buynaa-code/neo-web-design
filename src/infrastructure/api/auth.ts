import {
  authTokenResponseSchema,
  customerEnvelopeSchema,
  type AuthTokenResponse,
  type Customer,
  type LoginRequest,
  type RegisterRequest,
  type UpdatePasswordRequest,
  type UpdateProfileRequest,
} from "@/domain/schemas/api";
import { apiFetch } from "./http";
import { clearToken, setToken } from "./token";

/** POST /auth/register — creates a customer and stores the returned token. */
export async function register(
  input: RegisterRequest
): Promise<AuthTokenResponse> {
  const res = authTokenResponseSchema.parse(
    await apiFetch("/auth/register", { method: "POST", body: input, skipAuth: true })
  );
  setToken(res.token);
  return res;
}

/** POST /auth/login — authenticates and stores the returned token. */
export async function login(input: LoginRequest): Promise<AuthTokenResponse> {
  const res = authTokenResponseSchema.parse(
    await apiFetch("/auth/login", { method: "POST", body: input, skipAuth: true })
  );
  setToken(res.token);
  return res;
}

/** GET /auth/user — current authenticated customer. */
export async function fetchCurrentUser(): Promise<Customer> {
  return customerEnvelopeSchema.parse(await apiFetch("/auth/user")).data;
}

/** PUT /auth/profile */
export async function updateProfile(
  input: UpdateProfileRequest
): Promise<Customer> {
  return customerEnvelopeSchema.parse(
    await apiFetch("/auth/profile", { method: "PUT", body: input })
  ).data;
}

/** PUT /auth/password */
export async function updatePassword(
  input: UpdatePasswordRequest
): Promise<void> {
  await apiFetch("/auth/password", { method: "PUT", body: input });
}

/** POST /auth/logout — invalidates the current token. */
export async function logout(): Promise<void> {
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } finally {
    clearToken();
  }
}

/** POST /auth/logout-all — invalidates tokens on all devices. */
export async function logoutAll(): Promise<void> {
  try {
    await apiFetch("/auth/logout-all", { method: "POST" });
  } finally {
    clearToken();
  }
}
