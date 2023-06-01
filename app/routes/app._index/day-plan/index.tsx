import type { SerializeFrom } from "@remix-run/server-runtime";
import { RestDay } from "./rest-day";
import { TrainingDay } from "./training-day";
import type { CurrentMesocycleStartedData } from "../route";

type DayPlanProps = {
  data: SerializeFrom<CurrentMesocycleStartedData>;
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
