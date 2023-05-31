import type { SerializeFrom } from "@remix-run/server-runtime";
import type { CurrentMesocycleStartedData } from "../route";
import { RestDay } from "./rest-day";
import { TrainingDay } from "./training-day";

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
