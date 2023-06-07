import { Dialog, Transition } from "@headlessui/react";
import {
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  ScaleIcon,
} from "@heroicons/react/20/solid";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { Fragment, useMemo } from "react";
import type { FinishSessionSchema } from "../schema";
import { actionIntents, finishSessionSchema } from "../schema";
import { conform, useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import type { CurrentMesocycleState, loader } from "../route";
import type { SerializeFrom } from "@remix-run/server-runtime";
import { SubmitButton } from "~/components/submit-button";
import { Textarea } from "~/components/textarea";
import { classes } from "~/utils/classes";
import clsx from "clsx";
import { getSetPerformance } from "~/utils/sets";

type FinishTrainingDayModalProps = {
  show: boolean;
  onClose: VoidFunction;
  trainingDay: NonNullable<
    (SerializeFrom<typeof loader> & {
      state: CurrentMesocycleState.STARTED;
    })["day"]["trainingDay"]
  >;
};

export function FinishTrainingDayModal({
  show,
  onClose,
  trainingDay,
}: FinishTrainingDayModalProps) {
  const navigation = useNavigation();

  const isSubmitting =
    navigation.state === "submitting" &&
    navigation.formData.get("actionIntent") === actionIntents[1];

  const lastSubmission = useActionData() as any;
  const [form, { actionIntent, id, feedback }] = useForm<FinishSessionSchema>({
    id: "finish-session",
    lastSubmission,
    defaultValue: {
      actionIntent: actionIntents[1],
      id: trainingDay.id,
    },
    onValidate({ formData }) {
      return parse(formData, { schema: finishSessionSchema });
    },
  });

  const totalStats = useMemo(() => {
    return {
      sets: trainingDay.exercises.reduce((exerciseAccCount, exercise) => {
        return exerciseAccCount + exercise.sets.length;
      }, 0),

      weight: trainingDay.exercises.reduce((exerciseAccCount, exercise) => {
        return (
          exerciseAccCount +
          exercise.sets.reduce(
            (setAccCount, set) =>
              setAccCount + (set.weight || 0) * (set.repsCompleted || 0),
            0
          )
        );
      }, 0),

      progressions: trainingDay.exercises.reduce(
        (exerciseAccCount, exercise) => {
          return (
            exerciseAccCount +
            exercise.sets.reduce((setAccCount, set) => {
              const previousRunSet = exercise.previousRun?.sets.find(
                (previousSet) => previousSet.number === set.number
              );

              const performance = getSetPerformance(previousRunSet, set);

              if (performance === "increased") {
                return setAccCount + 1;
              }

              return setAccCount;
            }, 0)
          );
        },
        0
      ),
    };
  }, [trainingDay.exercises]);

  return (
    <Transition.Root show={show} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-zinc-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:p-6">
                <div>
                  <Dialog.Title
                    as="h3"
                    className="text-base font-semibold leading-6 text-zinc-900"
                  >
                    Finish your training session
                  </Dialog.Title>

                  <ul className="mt-3 flex flex-col gap-3">
                    <li className="flex items-center gap-1.5 text-sm text-zinc-500">
                      <ArrowPathIcon className="h-5 w-5 flex-shrink-0 text-orange-500" />
                      {totalStats.sets} total sets
                    </li>
                    <li className="flex items-center gap-1.5 text-sm text-zinc-500">
                      <ScaleIcon className="h-5 w-5 flex-shrink-0 text-orange-500" />
                      {totalStats.weight} total weight lifted
                    </li>
                    {totalStats.progressions > 0 ? (
                      <li className="flex items-center gap-1.5 text-sm text-zinc-500">
                        <ArrowTrendingUpIcon className="h-5 w-5 flex-shrink-0 text-orange-500" />
                        {totalStats.progressions} total progressions, great
                        stuff!
                      </li>
                    ) : null}
                  </ul>
                </div>

                <Form method="post" {...form.props}>
                  <div className="mt-4">
                    <Textarea
                      rows={4}
                      label="Feedback (Optional)"
                      placeholder="Overall very good session with most things progressing nicely..."
                      helperText="Write down your personal reflections and thoughts about the training session here. This is your space to capture any observations, key takeaways, or memorable moments from the session."
                      config={feedback}
                    />
                  </div>

                  <input {...conform.input(actionIntent, { hidden: true })} />
                  <input {...conform.input(id, { hidden: true })} />

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={onClose}
                      type="button"
                      className={clsx(classes.buttonOrLink.secondary, "flex-1")}
                    >
                      Cancel
                    </button>

                    <SubmitButton
                      isSubmitting={isSubmitting}
                      className="flex-1"
                      text="Finish"
                    />
                  </div>
                </Form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
