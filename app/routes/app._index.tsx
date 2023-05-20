import { ArrowLongRightIcon, PlusIcon } from "@heroicons/react/20/solid";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import {
  addDays,
  differenceInDays,
  endOfToday,
  isAfter,
  isToday,
} from "date-fns";
import {
  getCurrentMesocycleDetailed,
  getMesocyclesCount,
} from "~/models/mesocycle.server";
import { requireUser } from "~/session.server";

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request);

  const [currentMesocycle, userMesocyclesCount] = await Promise.all([
    getCurrentMesocycleDetailed(user.id),
    getMesocyclesCount(user.id),
  ]);

  if (!currentMesocycle) {
    return json({
      currentMesocycle: null,
      userMesocyclesCount,
    });
  }

  const today = endOfToday();
  if (isAfter(currentMesocycle.startDate, today)) {
    return json({
      mesocycleStarts: currentMesocycle.startDate,
    });
  }

  // The user starts the mesocycle today so this is day 1 of micro 1
  if (isToday(currentMesocycle.startDate)) {
    const trainingDay = currentMesocycle.microcycles[0].trainingDays.find(
      (trainingDay) => trainingDay.number === 1
    );

    if (!trainingDay) {
      return json({
        isRestDay: true,
      });
    }

    return json({
      trainingDay,
    });
  }

  const microcycleLength =
    currentMesocycle.mesocycle._count.trainingDays +
    currentMesocycle.mesocycle.restDays.length;

  const trainingDay = currentMesocycle.microcycles.find((_, microcycleIndex) =>
    Array(microcycleLength)
      .fill(0)
      .find((_, dayIndex) =>
        isToday(addDays(currentMesocycle.startDate, microcycleIndex + dayIndex))
      )
  );

  if (!trainingDay) {
    return json({
      isRestDay: true,
    });
  }

  return json({
    trainingDay,
  });

  // Create an array of arrays with the dates for each microcycle.
  // [18-05-2023, 19-05-2023, 20-05-2023]
  // [21-05-2023, 22-05-2023, 23-05-2023]
  // const microcyclesDates = currentMesocycle.microcycles.map(
  //   (microcycle, microcycleIndex) => {
  //     return Array.from({ length: microcycleLength }, (_, dayIndex) => {
  //       const date = addDays(
  //         currentMesocycle.startDate,
  //         microcycleIndex + dayIndex
  //       );

  //       const trainingDay = microcycle.trainingDays.find(
  //         (trainingDay) => trainingDay.number === dayIndex + 1
  //       );

  //       return {
  //         date,
  //         trainingDay,
  //       };
  //     });
  //   }
  // );

  // console.log(JSON.stringify({ microcyclesDates }, null, 4));

  // return json({});
};

export default function Today() {
  return null;
  // const { currentMesocycle, userMesocyclesCount } =
  //   useLoaderData<typeof loader>();

  // return (
  //   <div className="py-10">
  //     {currentMesocycle ? (
  //       <div>
  //         <p>Your current mesocycle: {currentMesocycle.id}</p>
  //       </div>
  //     ) : (
  //       <div className="flex flex-col items-center justify-center text-center">
  //         <CalendarIcon className="mx-auto h-12 w-12 text-zinc-400" />
  //         <h3 className="mt-2 text-sm font-semibold text-zinc-900">
  //           Nothing today
  //         </h3>
  //         <p className="mt-1 text-sm text-zinc-500">
  //           {userMesocyclesCount > 0
  //             ? "Get started by starting one of your mesocycles."
  //             : "Get started by planning a new mesocycle."}
  //         </p>
  //         <div className="mt-6">
  //           {userMesocyclesCount > 0 ? (
  //             <Link
  //               to="/app/mesocycles"
  //               className="inline-flex w-full justify-center rounded-md bg-orange-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
  //             >
  //               Go to your mesocycles
  //               <ArrowLongRightIcon
  //                 className="-mr-0.5 ml-1.5 h-5 w-5"
  //                 aria-hidden="true"
  //               />
  //             </Link>
  //           ) : (
  //             <Link
  //               to="/app/new-mesocycle"
  //               className="inline-flex w-full justify-center rounded-md bg-orange-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
  //             >
  //               <PlusIcon
  //                 className="-ml-0.5 mr-1.5 h-5 w-5"
  //                 aria-hidden="true"
  //               />
  //               New mesocycle
  //             </Link>
  //           )}
  //         </div>
  //       </div>
  //     )}
  //   </div>
  // );
}
