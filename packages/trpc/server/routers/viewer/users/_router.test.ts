import { createCallerFactory } from "@calcom/trpc/server/trpc";
import { describe, expect, it, vi } from "vitest";
import { userAdminRouter } from "./_router";

vi.mock("@calcom/features/auth/lib/userFromSessionUtils", () => ({
  getUserSession: vi.fn().mockResolvedValue({
    user: { id: 1, role: "ADMIN" },
    session: { user: { id: 1 } },
  }),
}));

const callerFactory = createCallerFactory(userAdminRouter);

const baseInput = {
  name: "Test User",
  email: "test@example.com",
  username: "test-user",
  bio: "bio",
  timeZone: "UTC",
  weekStart: "Monday",
  theme: null,
  defaultScheduleId: null,
  locale: "en",
  timeFormat: 12,
  allowDynamicBooking: true,
  identityProvider: "CAL",
  role: "USER",
  avatarUrl: null,
};

const createCaller = (findUnique: ReturnType<typeof vi.fn>) =>
  callerFactory({
    prisma: {
      user: {
        findUnique,
        create: vi.fn().mockResolvedValue({ id: 1 }),
      },
    },
  } as unknown as Parameters<typeof callerFactory>[0]);

describe("userAdminRouter.add", () => {
  it("returns a field validation error when the email already exists", async () => {
    const caller = createCaller(vi.fn().mockResolvedValue({ id: 2 }));

    await expect(caller.add({ ...baseInput, email: "existing@example.com" })).rejects.toMatchObject({
      message: "Invalid input",
      cause: {
        issues: expect.arrayContaining([
          expect.objectContaining({ path: ["email"], message: "email_already_used" }),
        ]),
      },
    });
  });

  it("returns a field validation error when the username already exists", async () => {
    const caller = createCaller(vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 3 }));

    await expect(caller.add({ ...baseInput, username: "existing-user" })).rejects.toMatchObject({
      message: "Invalid input",
      cause: {
        issues: expect.arrayContaining([
          expect.objectContaining({ path: ["username"], message: "username_already_taken" }),
        ]),
      },
    });
  });
});