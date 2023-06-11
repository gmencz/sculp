import { Heading } from "~/components/heading";
import { Calendar } from "../calendar";
import { AppPageLayout } from "~/components/app-page-layout";

type RestDayProps = {
  mesocycleName: string;
  microcycleNumber: number;
  dayNumber: number;
};

export function RestDay({
  mesocycleName,
  microcycleNumber,
  dayNumber,
}: RestDayProps) {
  return (
    <AppPageLayout>
      <div className="flex items-center justify-between">
        <h2 className="mb-1 font-medium text-zinc-600">
          {mesocycleName} - M{microcycleNumber} D{dayNumber}
        </h2>

        <Calendar darkButton />
      </div>

      <Heading className="text-zinc-900">Rest day</Heading>

      <p className="mt-2 text-zinc-600">
        It's time to rest! Remember, your body repairs and rebuilds during rest,
        allowing you to come back stronger and more energized for your next
        training session.
      </p>
    </AppPageLayout>
  );
}
