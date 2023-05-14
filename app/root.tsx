import type {
  LinksFunction,
  LoaderArgs,
  V2_MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

import tailwindStylesheetUrl from "~/styles/tailwind.css";
import { getUser } from "~/session.server";
import { useOptionalUser } from "./utils";
import { RequestAccessModal } from "./components/request-access-modal";
import { SignInModal } from "./components/sign-in-modal";

export const meta: V2_MetaFunction = () => [
  {
    title: "The Hypertrophy Logbook",
    charset: "utf-8",
  },
  {
    name: "viewport",
    content: "width=device-width,initial-scale=1",
  },
  {
    name: "description",
    content: "Smart hypertrophy logbook for maximum muscle growth.",
  },
];

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: tailwindStylesheetUrl },
];

export const loader = async ({ request }: LoaderArgs) => {
  return json({ user: await getUser(request) });
};

export default function App() {
  const user = useOptionalUser();

  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full overflow-x-hidden">
        <Outlet />

        {!user ? (
          <>
            <RequestAccessModal />
            <SignInModal />
          </>
        ) : null}

        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
