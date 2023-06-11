import { Heading } from "~/components/heading";
import { Paragraph } from "~/components/paragraph";
import type { CurrentMesocycleState, loader } from "./route";
import type { SerializeFrom } from "@remix-run/server-runtime";

type CurrentMesocycleStartsInTheFutureProps = {
  data: SerializeFrom<typeof loader> & {
    state: CurrentMesocycleState.STARTS_IN_THE_FUTURE;
  };
};

export function CurrentMesocycleStartsInTheFuture({
  data,
}: CurrentMesocycleStartsInTheFutureProps) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <Heading className="text-zinc-900">{data.mesocycleName}</Heading>
      <Paragraph>Your mesocycle starts {data.formattedStartDate}.</Paragraph>
    </div>
  );
}
