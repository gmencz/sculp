import { redirect } from "@remix-run/node";
import { nanoid } from "nanoid";
import { getSessionFromCookie, sessionStorage } from "./session.server";
import { configRoutes } from "./routes";

export type DraftMesocycle = {
  name: string;
  goal: string;
  durationInMicrocycles: number;
  restDaysPerMicrocycle: number[];
  trainingDaysPerMicrocycle: number[];
  presetName?: string;
};

export async function getDraftMesocycle(
  request: Request,
  id: string
): Promise<DraftMesocycle | null> {
  const session = await getSessionFromCookie(request);
  const draftMesocycle = await session.get(`draft-mesocycle-${id}`);
  return draftMesocycle;
}

export async function createDraftMesocycle(
  request: Request,
  draftMesocycle: DraftMesocycle
) {
  const session = await getSessionFromCookie(request);
  const id = nanoid();
  session.set(`draft-mesocycle-${id}`, draftMesocycle);
  return redirect(configRoutes.app.mesocycles.new.step2(id), {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

export async function deleteDraftMesocycle(request: Request, id: string) {
  const session = await getSessionFromCookie(request);
  session.unset(`draft-mesocycle-${id}`);
  return redirect(configRoutes.app.mesocycles.list, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}
