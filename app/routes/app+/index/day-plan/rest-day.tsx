import { Heading } from "~/components/heading";
import { Calendar } from "../calendar";
import { AppPageLayout } from "~/components/app-page-layout";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";

type RestDayProps = {
  mesocycleName: string;
  date: Date;
};

export function RestDay({ mesocycleName, date }: RestDayProps) {
  return (
    <AppPageLayout>
      <div className="flex items-center justify-between">
        <div className="hidden lg:block">
          {isToday(date) ? (
            <h2 className="mb-1 font-medium text-zinc-600">
              {mesocycleName} - Today
            </h2>
          ) : isTomorrow(date) ? (
            <h2 className="mb-1 font-medium text-zinc-600">
              {mesocycleName} - Tomorrow
            </h2>
          ) : isYesterday(date) ? (
            <h2 className="mb-1 font-medium text-zinc-600">
              {mesocycleName} - Yesterday
            </h2>
          ) : (
            <h2 className="mb-1 font-medium text-zinc-600">
              {mesocycleName} - {format(new Date(date), "MMMM' 'd' 'yyyy")}
            </h2>
          )}
        </div>

        <h2 className="mb-1 font-medium text-zinc-600 lg:hidden">
          {mesocycleName}
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
