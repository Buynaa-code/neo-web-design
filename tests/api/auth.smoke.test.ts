import { describe, expect, it } from "vitest";
import { fetchCurrentUser, login } from "@/infrastructure/api/auth";
import { ApiError } from "@/infrastructure/api/http";

/**
 * Live auth smoke tests. These are intentionally *negative* so they never
 * create real users or mutate server state — they only assert that the auth
 * contract rejects unauthenticated / invalid requests as documented.
 */
describe("auth endpoints (live, read-only)", () => {
  it("rejects unauthenticated /auth/user with 401", async () => {
    await expect(fetchCurrentUser()).rejects.toMatchObject({ status: 401 });
  });

  it("rejects invalid credentials (422 or 401)", async () => {
    try {
      await login({
        email: "definitely-not-a-real-user@example.invalid",
        password: "wrong-password",
      });
      throw new Error("login should have failed");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect([401, 422]).toContain((err as ApiError).status);
    }
  });
});
