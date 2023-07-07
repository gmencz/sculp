import { redirect, type LoaderArgs } from "@remix-run/server-runtime";
import { requireUser } from "~/services/auth/api/require-user";
import { prisma } from "~/utils/db.server";
import { configRoutes } from "~/utils/routes";

export const loader = async ({ request, params }: LoaderArgs) => {
  const user = await requireUser(request, { select: { trackRir: true } });
  const newRoutine = await prisma.routine.create({
    data: {
      name: "Unnamed Routine",
      user: { connect: { id: user.id } },
      trackRir: user.trackRir,
      folder: { connect: { id: params.folderId } },
    },
    select: {
      id: true,
    },
  });

  return redirect(configRoutes.app.editRoutine(newRoutine.id));
};
