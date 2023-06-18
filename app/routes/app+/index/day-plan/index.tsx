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
  if (!data.day) {
    return (
      <RestDay date={new Date(data.date)} mesocycleName={data.mesocycleName} />
    );
  }

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
}
