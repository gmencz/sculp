import {
  ArrowLongRightIcon,
  CalendarIcon,
  PlusIcon,
} from "@heroicons/react/20/solid";
import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import {
  addDays,
  differenceInDays,
  format,
  isAfter,
  isToday,
  startOfToday,
} from "date-fns";
import { Heading } from "~/components/heading";
import { Paragraph } from "~/components/paragraph";
import {
  getCurrentMesocycleDetailed,
  getMesocyclesCount,
  getTrainingDay,
} from "~/models/mesocycle.server";
import { requireUser } from "~/session.server";

type CurrentMesocycleNotFoundData = {
  type: "current_mesocycle_not_found";
  mesocyclesCount: number;
};

type CurrentMesocycleStartsInTheFutureData = {
  type: "current_mesocycle_starts_in_the_future";
  formattedStartDate: string;
  mesocycleName: string;
};

type CurrentMesocycleStartedData = {
  type: "current_mesocycle_started";
  mesocycleName: string;
  today: {
    trainingDay: {
      label: string;
      exercises: {
        number: number;
        id: string;
        notes: string | null;
        exercise: {
          name: string;
          muscleGroups: {
            name: string;
          }[];
        };
      }[];
    } | null;
    dayNumber: number;
    microcycleNumber: number;
  };
};

type Data =
  | CurrentMesocycleNotFoundData
  | CurrentMesocycleStartsInTheFutureData
  | CurrentMesocycleStartedData;

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request);
  let data: Data | null = null;

  const currentMesocycle = await getCurrentMesocycleDetailed(user.id);
  if (!currentMesocycle) {
    data = {
      type: "current_mesocycle_not_found",
      mesocyclesCount: await getMesocyclesCount(user.id),
    };

    return json(data);
  }

  // The user starts the mesocycle some time in the future.
  const today = startOfToday();

  // currentMesocycle.startDate = subDays(new Date(), 2);
  currentMesocycle.startDate = today;

  if (isAfter(currentMesocycle.startDate, today)) {
    const daysDifference = differenceInDays(currentMesocycle.startDate, today);
    let formattedStartDate;
    if (daysDifference === 1) {
      formattedStartDate = "tomorrow";
    } else {
      formattedStartDate = `on the ${format(
        currentMesocycle.startDate,
        "do' of 'MMMM'"
      )} (in ${daysDifference} days)`;
    }

    data = {
      type: "current_mesocycle_starts_in_the_future",
      formattedStartDate,
      mesocycleName: currentMesocycle.mesocycle.name,
    };

    return json(data);
  }

  // The user starts the mesocycle today so this is day 1 of micro 1
  if (isToday(currentMesocycle.startDate)) {
    const trainingDay = currentMesocycle.microcycles[0].trainingDays.find(
      (trainingDay) => trainingDay.number === 1
    );

    if (!trainingDay) {
      data = {
        type: "current_mesocycle_started",
        mesocycleName: currentMesocycle.mesocycle.name,
        today: {
          trainingDay: null,
          dayNumber: 1,
          microcycleNumber: 1,
        },
      };

      return json(data);
    }

    const trainingDayData = await getTrainingDay(trainingDay.id);

    if (!trainingDayData) {
      throw new Error("trainingDayData is null, this should never happen");
    }

    data = {
      type: "current_mesocycle_started",
      mesocycleName: currentMesocycle.mesocycle.name,
      today: {
        trainingDay: trainingDayData,
        dayNumber: 1,
        microcycleNumber: 1,
      },
    };

    return json(data);
  }

  // If we got here, it means the user's current mesocycle has started at least 1 day ago.

  const microcycleLength =
    currentMesocycle.mesocycle._count.trainingDays +
    currentMesocycle.mesocycle.restDays.length;

  // Here we make an array with the length of a microcycle, this is so we can loop through it
  // later on inside each microcycle.
  const microcycleDays = Array(microcycleLength).fill(0);

  let foundDay = null;
  for (
    let microcycleIndex = 0;
    microcycleIndex < currentMesocycle.microcycles.length;
    microcycleIndex++
  ) {
    if (foundDay) break;

    const microcycle = currentMesocycle.microcycles[microcycleIndex];
    for (let dayNumber = 1; dayNumber < microcycleDays.length; dayNumber++) {
      const isDayToday = isToday(
        addDays(currentMesocycle.startDate, microcycleIndex + dayNumber)
      );

      if (isDayToday) {
        const trainingDay =
          microcycle.trainingDays.find(({ number }) => number === dayNumber) ||
          null;

        foundDay = {
          trainingDay,
          dayNumber,
          microcycleNumber: microcycleIndex + 1,
        };
      }
    }
  }

  if (!foundDay) {
    throw new Error("foundDay is null, this should never happen");
  }

  if (foundDay.trainingDay?.id) {
    const trainingDayData = await getTrainingDay(foundDay.trainingDay.id);

    if (!trainingDayData) {
      throw new Error("trainingDayData is null, this should never happen");
    }

    data = {
      type: "current_mesocycle_started",
      mesocycleName: currentMesocycle.mesocycle.name,
      today: {
        dayNumber: foundDay.dayNumber,
        microcycleNumber: foundDay.microcycleNumber,
        trainingDay: trainingDayData,
      },
    };

    return json(data);
  }

  data = {
    type: "current_mesocycle_started",
    mesocycleName: currentMesocycle.mesocycle.name,
    today: {
      dayNumber: foundDay.dayNumber,
      microcycleNumber: foundDay.microcycleNumber,
      trainingDay: null,
    },
  };

  return json(data);
};

export default function Today() {
  const data = useLoaderData<typeof loader>();

  console.log({ data });

  if (data.type === "current_mesocycle_not_found") {
    return (
      <div className="py-10">
        <div className="flex flex-col items-center justify-center text-center">
          <CalendarIcon className="mx-auto h-12 w-12 text-zinc-400" />
          <h3 className="mt-2 text-sm font-semibold text-zinc-900">
            Nothing today
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            {data.mesocyclesCount > 0
              ? "Get started by starting one of your mesocycles."
              : "Get started by planning a new mesocycle."}
          </p>
          <div className="mt-6">
            {data.mesocyclesCount > 0 ? (
              <Link
                to="/app/mesocycles"
                className="inline-flex w-full justify-center rounded-md bg-orange-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Go to your mesocycles
                <ArrowLongRightIcon
                  className="-mr-0.5 ml-1.5 h-5 w-5"
                  aria-hidden="true"
                />
              </Link>
            ) : (
              <Link
                to="/app/new-mesocycle"
                className="inline-flex w-full justify-center rounded-md bg-orange-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <PlusIcon
                  className="-ml-0.5 mr-1.5 h-5 w-5"
                  aria-hidden="true"
                />
                New mesocycle
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (data.type === "current_mesocycle_starts_in_the_future") {
    return (
      <div className="py-10">
        <Heading>{data.mesocycleName}</Heading>
        <Paragraph>Your mesocycle starts {data.formattedStartDate}.</Paragraph>
      </div>
    );
  }

  const { trainingDay, dayNumber, microcycleNumber } = data.today;

  const getUniqueMuscleGroups = () => {
    if (!trainingDay) return [];

    const set = new Set<string>();

    trainingDay.exercises.forEach((exercise) => {
      exercise.exercise.muscleGroups.forEach((muscleGroup) => {
        set.add(muscleGroup.name);
      });
    });

    return Array.from(set);
  };

  const muscleGroups = getUniqueMuscleGroups();

  return (
    <div className="mx-auto w-full max-w-2xl py-10">
      <Heading>{data.mesocycleName}</Heading>

      <div className="mt-4 rounded border-y border-b-zinc-200 border-t-zinc-100 bg-white px-4 py-3 leading-6 text-zinc-900">
        <h2 className="mb-2 font-medium">
          Microcycle {microcycleNumber} Day {dayNumber}
        </h2>

        {trainingDay ? (
          <ul className="flex gap-2">
            {muscleGroups.map((muscleGroup) => (
              <li
                key={muscleGroup}
                className="rounded-full bg-orange-500/10 px-3 py-0.5 text-sm font-semibold leading-6 text-orange-400 ring-1 ring-inset ring-orange-500/20"
              >
                {muscleGroup}
              </li>
            ))}
          </ul>
        ) : (
          <>
            <span className="rounded-full bg-orange-500/10 px-3 py-0.5 text-sm font-semibold leading-6 text-orange-400 ring-1 ring-inset ring-orange-500/20">
              Rest day
            </span>
          </>
        )}
      </div>

      {trainingDay ? (
        <ul>
          {trainingDay.exercises.map((exercise) => (
            <div key={exercise.id} className="relative mt-4">
              <div className="flex flex-col items-start gap-2 rounded border-y border-b-zinc-200 border-t-zinc-100 bg-white px-4 py-3 font-semibold leading-6 text-zinc-900">
                <Exercise data={exercise} />
              </div>
            </div>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

type ExerciseProps = {
  data: {
    number: number;
    id: string;
    notes: string | null;
    exercise: {
      name: string;
      muscleGroups: {
        name: string;
      }[];
    };
  };
};

function Exercise(props: ExerciseProps) {
  const { data } = props;

  return <p>{data.exercise.name}</p>;
}
