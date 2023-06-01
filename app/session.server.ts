import { createCookieSessionStorage, redirect } from "@remix-run/node";
import invariant from "tiny-invariant";

import { configRoutes } from "./config-routes";
import type { User } from "@prisma/client";
import { prisma } from "./db.server";
import { nanoid } from "nanoid";

invariant(process.env.SESSION_SECRET, "SESSION_SECRET must be set");

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET],
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
});

const USER_SESSION_KEY = "userId";

export async function getSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

export async function getUserId(
  request: Request
): Promise<User["id"] | undefined> {
  const session = await getSession(request);
  const userId = session.get(USER_SESSION_KEY);
  return userId;
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const userId = await getUserId(request);
  if (!userId) {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/auth/sign-in?${searchParams}`);
  }
  return userId;
}

export async function requireUser(
  request: Request,
  options?: { ignoreSubscription: boolean }
) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      subscription: {
        select: { status: true },
      },
    },
  });

  if (user) {
    if (options?.ignoreSubscription) {
      return user;
    }

    // Check if the user has a valid subscription, if they don't redirect them to the error page.
    const successStatuses = ["trialing", "active"];
    if (
      !user.subscription ||
      !successStatuses.includes(user.subscription?.status)
    ) {
      throw redirect(configRoutes.auth.unsuccessfulSubscription);
    }

    return user;
  }

  throw await logout(request);
}

export async function createUserSession({
  request,
  userId,
}: {
  request: Request;
  userId: string;
}) {
  const session = await getSession(request);
  session.set(USER_SESSION_KEY, userId);
  return session;
}

export async function logout(request: Request) {
  const session = await getSession(request);
  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}

export type DraftMesocycle = {
  name: string;
  goal: string;
  durationInMicrocycles: number;
  restDaysPerMicrocycle: number[];
  trainingDaysPerMicrocycle: number[];
  presetName?: string;
};

export const getDraftMesocycleSessionKey = (id: string) =>
  `draft-mesocycle-${id}`;

export async function getDraftMesocycle(
  request: Request,
  id: string
): Promise<DraftMesocycle | null> {
  const session = await getSession(request);
  const mesocycle = await session.get(getDraftMesocycleSessionKey(id));
  return mesocycle;
}

export async function createDraftMesocycle(
  request: Request,
  input: DraftMesocycle
) {
  const session = await getSession(request);
  const id = nanoid();
  session.set(getDraftMesocycleSessionKey(id), input);
  return redirect(configRoutes.mesocycles.newStepTwo(id), {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}
