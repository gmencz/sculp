import { useNavigation } from "@remix-run/react";
import type { Set } from "./set";
import { ActionIntents } from "./schema";
import type { RefObject } from "react";
import { useEffect } from "react";
import { UpdateSetForm } from "./update-set-form";
import { RemoveSetForm } from "./remove-set-form";

type TrainingDayExerciseSetFormProps = {
  set: Set;
  setSets: React.Dispatch<React.SetStateAction<Set[]>>;
  setIsRemoved: React.Dispatch<React.SetStateAction<boolean>>;
  isRemoved: boolean;
  exerciseId: string;
  removeFormRef: RefObject<HTMLFormElement>;
};

export function TrainingDayExerciseSetForm({
  set,
  setIsRemoved,
  isRemoved,
  setSets,
  exerciseId,
  removeFormRef,
}: TrainingDayExerciseSetFormProps) {
  const navigation = useNavigation();

  useEffect(() => {
    if (navigation.formData) {
      const actionIntent = navigation.formData.get("actionIntent");
      if (actionIntent === ActionIntents.RemoveSet) {
        const setId = navigation.formData.get("id");
        if (setId === set.id && !isRemoved) {
          setIsRemoved(true);
        }
      }
    }
  }, [isRemoved, navigation.formData, set.id, setIsRemoved, setSets]);

  const isBeingCreated =
    navigation.state === "submitting" &&
    navigation.formData.get("actionIntent") === ActionIntents.AddSet &&
    navigation.formData.get("id") === exerciseId;

  return (
    <div className="flex items-center gap-3">
      <UpdateSetForm set={set} />
      <RemoveSetForm
        formRef={removeFormRef}
        set={set}
        isBeingCreated={isBeingCreated}
      />
    </div>
  );
}
