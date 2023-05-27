import { useFieldList, useForm } from "@conform-to/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import {
  findExerciseByNameUserId,
  getExercise,
  updateExercise,
} from "~/models/exercise.server";
import { requireUser } from "~/session.server";
import type { Schema } from "./schema";
import { schema } from "./schema";
import {
  Form,
  useActionData,
  useLoaderData,
  useSearchParams,
} from "@remix-run/react";
import { Heading } from "~/components/heading";
import { Input } from "~/components/input";
import { Select } from "~/components/select";
import { JointPain } from "@prisma/client";
import { getMuscleGroups } from "~/models/muscle-groups.server";
import { parse } from "@conform-to/zod";
import { SubmitButton } from "~/components/submit-button";
import { Paragraph } from "~/components/paragraph";
import { useAfterPaintEffect } from "~/utils";
import { toast } from "react-hot-toast";
import { SuccessToast } from "~/components/success-toast";

export const action = async ({ request, params }: ActionArgs) => {
  const user = await requireUser(request);
  const { id } = params;
  if (!id) {
    throw new Error("id param is falsy, this should never happen");
  }

  const formData = await request.formData();
  const submission = parse(formData, { schema });

  if (!submission.value || submission.intent !== "submit") {
    return json(submission, { status: 400 });
  }

  const { name, jointPain, muscleGroups } = submission.value;

  const existingExercise = await findExerciseByNameUserId(name, user.id);
  if (existingExercise && name !== existingExercise.name) {
    submission.error["name"] = "An exercise with that name already exists.";
    return json(submission, { status: 400 });
  }

  return updateExercise(new URL(request.url), id, user.id, {
    name,
    jointPain,
    muscleGroups,
  });
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const user = await requireUser(request);
  const { id } = params;
  if (!id) {
    throw new Error("id param is falsy, this should never happen");
  }

  const exercise = await getExercise(id, user.id);
  if (!exercise) {
    throw new Response("Not Found", {
      status: 404,
    });
  }

  const muscleGroups = await getMuscleGroups();

  return json({
    exercise,
    jointPainEnum: JointPain,
    muscleGroupsOptions: muscleGroups.map((m) => m.name),
  });
};

export default function Exercise() {
  const [searchParams] = useSearchParams();

  const { exercise, jointPainEnum, muscleGroupsOptions } =
    useLoaderData<typeof loader>();

  const lastSubmission = useActionData();

  const [form, { name, jointPain, muscleGroups }] = useForm<Schema>({
    id: "edit-exercise",
    lastSubmission,
    onValidate({ formData }) {
      return parse(formData, { schema });
    },
    defaultValue: {
      name: exercise.name,
      jointPain: exercise.jointPain || jointPainEnum.NONE,
      muscleGroups: exercise.muscleGroups.map(
        (muscleGroup) => muscleGroup.name
      ),
    },
  });

  const muscleGroupsList = useFieldList(form.ref, muscleGroups);

  const successId = searchParams.get("success_id");
  useAfterPaintEffect(() => {
    if (successId) {
      toast.custom(
        (t) => (
          <SuccessToast
            t={t}
            title="Success"
            description="Your changes have been saved."
          />
        ),
        { duration: 3000, position: "bottom-center", id: successId }
      );
    }
  }, [successId]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <Heading>Edit exercise</Heading>
      <Paragraph>
        On this page you can edit the exercise's name, how your joints feel when
        performing it and the muscle groups worked.
      </Paragraph>

      <Form
        method="post"
        className="mt-4 bg-white shadow-sm ring-1 ring-zinc-900/5 sm:rounded-xl md:col-span-2"
        {...form.props}
      >
        <div className="flex flex-col gap-6 px-4 py-6 sm:p-8">
          <Input
            config={name}
            label="How is this exercise called?"
            autoComplete="exercise-name"
          />

          <Select
            config={jointPain}
            options={Object.values(jointPainEnum)}
            capitalizeOptions
            label="How much joint pain do you have when performing this exercise?"
          />

          <Select
            config={muscleGroups}
            label="Which muscle groups does this exercise work?"
            options={muscleGroupsOptions}
            helperText="You can select up to 10 muscle groups."
            multipleOptions={{
              min: 1,
              max: 10,
              formRef: form.ref,
              list: muscleGroupsList,
            }}
          />

          <SubmitButton text="Save changes" />
        </div>
      </Form>
    </div>
  );
}
