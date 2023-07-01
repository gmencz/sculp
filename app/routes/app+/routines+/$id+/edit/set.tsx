import type { SerializeFrom } from "@remix-run/server-runtime";
import type { loader } from "./route";

type SetProps = {
  set: SerializeFrom<
    typeof loader
  >["routine"]["exercises"][number]["sets"][number];
};

export function Set({ set }: SetProps) {
  return null;
}
