import {
  Form,
  useActionData,
  useLoaderData,
  useSubmit,
} from "@remix-run/react";
import type { Schema } from "./schema";
import { schema } from "./schema";
import { useForm } from "@conform-to/react";
import type { loader } from "./route";
import { type action } from "./route";
import { parse } from "@conform-to/zod";
import { Input } from "~/components/input";
import { useEffect, useState } from "react";
import { useDebounce } from "~/utils/hooks";
import { generateId } from "~/utils/ids";

export function UpdateMesocycleForm() {
  const lastSubmission = useActionData<typeof action>();
  const { mesocycle } = useLoaderData<typeof loader>();
  const [form, { goal, name }] = useForm<Schema>({
    id: "update-mesocycle",
    lastSubmission,
    defaultValue: {
      name: mesocycle.name,
      goal: mesocycle.goal,
    },
    onValidate({ formData }) {
      return parse(formData, { schema });
    },
  });

  const [shouldUpdate, setShouldUpdate] = useState<string>("");
  const debouncedShouldUpdate = useDebounce(shouldUpdate, 1500);
  const submit = useSubmit();

  useEffect(() => {
    if (debouncedShouldUpdate) {
      submit(form.ref.current, {
        replace: true,
        preventScrollReset: true,
      });
    }
  }, [submit, form.ref, debouncedShouldUpdate]);

  return (
    <Form
      method="post"
      className="flex flex-col gap-4 lg:mt-4"
      onChange={() => setShouldUpdate(generateId())}
      {...form.props}
    >
      <Input config={name} label="Name" autoComplete="mesocycle-name" />
      <Input config={goal} label="Goal" />
    </Form>
  );
}
