import type { SerializeFrom } from "@remix-run/server-runtime";
import type { loader } from "./route";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Bars2Icon } from "@heroicons/react/20/solid";

type SortableFolderProps = {
  folder: SerializeFrom<typeof loader>["folders"][number];
};

export function SortableFolder({ folder }: SortableFolderProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: folder.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div className="flex items-center">
        <span>{folder.name}</span>

        <Bars2Icon className="ml-auto h-6 w-6 text-zinc-400" />
      </div>
    </li>
  );
}
