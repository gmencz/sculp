import { Heading } from "~/components/heading";
import { Paragraph } from "~/components/paragraph";
import type { CurrentMesocycleState, loader } from "./route";
import type { SerializeFrom } from "@remix-run/server-runtime";
import { AppPageLayout } from "~/components/app-page-layout";

type CurrentMesocycleStartsInTheFutureProps = {
  data: SerializeFrom<typeof loader> & {
    state: CurrentMesocycleState.STARTS_IN_THE_FUTURE;
  };
};

export function CurrentMesocycleStartsInTheFuture({
  data,
}: CurrentMesocycleStartsInTheFutureProps) {
  return (
    <AppPageLayout>
      <Heading className="text-zinc-900">{data.mesocycleName}</Heading>
      <Paragraph>Your mesocycle starts {data.formattedStartDate}.</Paragraph>
    </AppPageLayout>
  );
}
