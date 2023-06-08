import type { SerializeFrom } from "@remix-run/server-runtime";
import { RestDay } from "./rest-day";
import { TrainingDay } from "./training-day";
import type { CurrentMesocycleState, loader } from "../route";

type DayPlanProps = {
  data: SerializeFrom<typeof loader> & {
    state: CurrentMesocycleState.STARTED;
  };
};

export function DayPlan({ data }: DayPlanProps) {
  const { trainingDay, dayNumber, microcycleNumber } = data.day;

  if (trainingDay) {
    return (
      <TrainingDay
        mesocycleName={data.mesocycleName}
        dayNumber={dayNumber}
        microcycleNumber={microcycleNumber}
        trainingDay={trainingDay}
        date={new Date(data.date)}
      />
    );
  }

  return (
    <RestDay
      dayNumber={dayNumber}
      mesocycleName={data.mesocycleName}
      microcycleNumber={microcycleNumber}
    />
  );
}
