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
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <Heading>{data.mesocycleName}</Heading>
      <Paragraph>Your mesocycle starts {data.formattedStartDate}.</Paragraph>
    </div>
  );
}
