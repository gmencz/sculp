import type { CurrentMesocycleStartedData } from "../route";
import { RestDay } from "./rest-day";
import { TrainingDay } from "./training-day";

type TodayPlanProps = {
  data: CurrentMesocycleStartedData;
};

export function TodayPlan({ data }: TodayPlanProps) {
  const { trainingDay, dayNumber, microcycleNumber } = data.today;

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
