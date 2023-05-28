import { Heading } from "~/components/heading";
import { Calendar } from "../calendar";

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
    <>
      <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="mx-auto w-full max-w-2xl">
          <div className="flex items-center justify-between">
            <h2 className="mb-1 font-medium text-zinc-600">
              {mesocycleName} - M{microcycleNumber} D{dayNumber}
            </h2>

            <Calendar darkButton />
          </div>

          <Heading>Rest day</Heading>

          <p className="mt-2 text-zinc-600">
            It's time to rest! Remember, your body repairs and rebuilds during
            rest, allowing you to come back stronger and more energized for your
            next training session.
          </p>
        </div>
      </div>
    </>
  );
}
