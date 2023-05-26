import { Heading } from "~/components/heading";

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
      <div className="bg-zinc-900 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto w-full max-w-2xl">
          <h2 className="mb-1 font-medium text-zinc-200">
            {mesocycleName} - M{microcycleNumber} D{dayNumber}
          </h2>

          <Heading white>Rest</Heading>

          <p className="mt-2 text-zinc-200">
            There's nothing for you to do today other than rest and recover for
            your next training session!
          </p>
        </div>
      </div>
    </>
  );
}
