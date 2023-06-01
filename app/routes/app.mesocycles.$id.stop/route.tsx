import { Form, useLoaderData } from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { AppPageLayout } from "~/components/app-page-layout";
import { BackLink } from "~/components/back-link";
import { Heading } from "~/components/heading";
import { Paragraph } from "~/components/paragraph";
import { SubmitButton } from "~/components/submit-button";
import { configRoutes } from "~/config-routes";
import {
  getCurrentMesocycle,
  getMesocycle,
  stopMesocycle,
} from "~/models/mesocycle.server";
import { requireUser } from "~/session.server";

export const loader = async ({ request, params }: LoaderArgs) => {
  const user = await requireUser(request);
  const { id } = params;
  if (!id) {
    throw new Error("id param is falsy, this should never happen");
  }

  const mesocycle = await getMesocycle(id, user.id, true);
  if (!mesocycle) {
    throw new Response("Not found", {
      status: 404,
    });
  }

  const currentMesocycle = await getCurrentMesocycle(user.id);

  // Can't stop a mesocycle that is not the current one.
  if (
    !currentMesocycle?.mesocycle ||
    currentMesocycle.mesocycle.id !== mesocycle.id
  ) {
    return redirect(configRoutes.mesocycles.list);
  }

  return json({ mesocycle });
};

export const action = async ({ request, params }: ActionArgs) => {
  const user = await requireUser(request);
  const { id } = params;
  if (!id) {
    throw new Error("id param is falsy, this should never happen");
  }

  return stopMesocycle(user.id, id);
};

export default function StopMesocycle() {
  const { mesocycle } = useLoaderData<typeof loader>();

  return (
    <AppPageLayout>
      <div className="mb-4 sm:hidden">
        <BackLink to={configRoutes.mesocycles.list}>Go back</BackLink>
      </div>
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
