import { Form, useLoaderData } from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { startOfToday } from "date-fns";
import { AppPageLayout } from "~/components/app-page-layout";
import { Heading } from "~/components/heading";
import { Paragraph } from "~/components/paragraph";
import { SubmitButton } from "~/components/submit-button";
import { configRoutes } from "~/utils/routes";
import { prisma } from "~/utils/db.server";
import { requireUser } from "~/services/auth/api/require-user";

export const loader = async ({ request, params }: LoaderArgs) => {
  const user = await requireUser(request);
  const { id } = params;
  if (!id) {
    throw new Error("id param is falsy, this should never happen");
  }

  const mesocycle = await prisma.mesocycle.findFirst({
    where: {
      id,
      userId: user.id,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!mesocycle) {
    throw new Response("Not found", {
      status: 404,
    });
  }

  const currentMesocycle = await prisma.mesocycleRun.findFirst({
    where: {
      currentUserId: user.id,
    },
    select: { mesocycle: { select: { id: true } } },
  });

  // Can't stop a mesocycle that is not the current one.
  if (
    !currentMesocycle?.mesocycle ||
    currentMesocycle.mesocycle.id !== mesocycle.id
  ) {
    return redirect(configRoutes.app.mesocycles.list);
  }

  return json({ mesocycle });
};

export const action = async ({ request, params }: ActionArgs) => {
  const user = await requireUser(request);
  const { id } = params;
  if (!id) {
    throw new Error("id param is falsy, this should never happen");
  }

  const mesocycle = await prisma.mesocycle.findFirst({
    where: {
      id,
      userId: user.id,
    },
    select: {
      id: true,
    },
  });

  if (!mesocycle) {
    throw new Response("Not found", {
      status: 404,
    });
  }

  const currentMesocycle = await prisma.mesocycleRun.findFirst({
    where: {
      currentUserId: user.id,
    },
    select: { id: true, mesocycle: { select: { id: true } } },
  });

  // Can't stop a mesocycle that is not the current one.
  if (
    !currentMesocycle?.mesocycle ||
    currentMesocycle.mesocycle.id !== mesocycle.id
  ) {
    return redirect(configRoutes.app.mesocycles.list);
  }

  await prisma.$transaction([
    prisma.mesocycleRun.update({
      where: {
        id: currentMesocycle.id,
      },
      data: {
        endDate: { set: startOfToday() },
      },
    }),
    prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        currentMesocycleRun: {
          disconnect: true,
        },
      },
      select: {
        id: true,
      },
    }),
  ]);

  return redirect(configRoutes.app.mesocycles.list);
};

export default function StopMesocycle() {
  const { mesocycle } = useLoaderData<typeof loader>();

  return (
    <AppPageLayout>
      <Heading>Stop mesocycle</Heading>
      <Paragraph>
        Are you sure you want to stop the current mesocycle{" "}
        <span className="font-bold text-zinc-900">{mesocycle.name}</span>? All
        training you have performed up to this point during the mesocycle will
        be saved.
      </Paragraph>
      <Form method="post" className="mt-4 inline-flex">
        <SubmitButton text="Yes, stop mesocycle" />
      </Form>
    </AppPageLayout>
  );
}
