import type { V2_MetaFunction } from "@remix-run/node";

import { useOptionalUser } from "~/utils";

export const meta: V2_MetaFunction = () => [{ title: "Remix Notes" }];

export default function Index() {
  const user = useOptionalUser();
  console.log({ user })
  return <p>Hello, World!</p>
}
