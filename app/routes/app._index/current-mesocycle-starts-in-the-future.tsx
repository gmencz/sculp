import { Heading } from "~/components/heading";
import { Paragraph } from "~/components/paragraph";
import type { CurrentMesocycleStartsInTheFutureData } from "./route";

type CurrentMesocycleStartsInTheFutureProps = {
  data: CurrentMesocycleStartsInTheFutureData;
};

export function CurrentMesocycleStartsInTheFuture({
  data,
}: CurrentMesocycleStartsInTheFutureProps) {
  return (
    <div className="py-10">
      <Heading>{data.mesocycleName}</Heading>
      <Paragraph>Your mesocycle starts {data.formattedStartDate}.</Paragraph>
    </div>
  );
}
