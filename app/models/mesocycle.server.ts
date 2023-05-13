import { redirect } from "@remix-run/server-runtime";
import { nanoid } from "nanoid";
import { configRoutes } from "~/config-routes";
import { getSession, sessionStorage } from "~/session.server";

export type DraftMesocycle = {
  name: string;
  goal: string;
  durationInWeeks: number;
  trainingDaysPerWeek: number;
};

const getDraftMesocycleSessionKey = (id: string) => `draft-mesocycle-${id}`;

export async function createDraftMesocycle(
  request: Request,
  data: DraftMesocycle
) {
  const session = await getSession(request);
  const id = nanoid();
  session.set(getDraftMesocycleSessionKey(id), data);
  return redirect(configRoutes.newMesocycleDesign(id), {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

export async function getDraftMesocycle(
  request: Request,
  id: string
): Promise<DraftMesocycle | null> {
  const session = await getSession(request);
  const mesocycle = await session.get(getDraftMesocycleSessionKey(id));
  return mesocycle;
}
