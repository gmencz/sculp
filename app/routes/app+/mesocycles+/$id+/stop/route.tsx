import { Form, useLoaderData } from "@remix-run/react";
import type {
  ActionArgs,
  LoaderArgs,
  SerializeFrom,
} from "@remix-run/server-runtime";
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
import type { MatchWithHeader } from "~/utils/hooks";

export const handle: MatchWithHeader<SerializeFrom<typeof loader>> = {
  header: (data) => `Stop ${data.mesocycle.name}`,
  links: [],
};

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
      <Heading className="hidden lg:block">Stop {mesocycle.name}</Heading>
      <Paragraph className="lg:mt-2">
        Are you sure you want to stop the current mesocycle? All training you
        have performed up to this point during the mesocycle will be saved in
        the mesocycle's history.
      </Paragraph>
      <Form method="post" className="mt-4 inline-flex">
        <SubmitButton text="Yes, stop mesocycle" />
      </Form>
    </AppPageLayout>
  );
}
