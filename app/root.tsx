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
  isRouteErrorResponse,
  useLoaderData,
  useLocation,
  useRouteError,
} from "@remix-run/react";
import { withSentry } from "@sentry/remix";

import tailwindStylesheetUrl from "./tailwind.css";
import { ErrorPage } from "./components/error-page";
import type { PropsWithChildren } from "react";
import { BackLink } from "./components/back-link";
import { Toaster } from "react-hot-toast";
import { cssBundleHref } from "@remix-run/css-bundle";
import { getUserId } from "./services/auth/api/require-user-id";
import { prisma } from "./utils/db.server";
import { GlobalLoading } from "./components/global-loading";
import { configRoutes } from "./utils/routes";
import { getMeta } from "./utils/seo";
import { useSWEffect } from "@remix-pwa/sw";
import { env } from "./utils/env.server";

export const meta: V2_MetaFunction = () => getMeta();

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: tailwindStylesheetUrl },
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

export const loader = async ({ request }: LoaderArgs) => {
  const userId = await getUserId(request);

  const ENV = {
    SENTRY_DSN: env.SENTRY_DSN,
  };

  if (!userId) {
    return json({ user: null, ENV });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  return json({ user, ENV });
};

function App() {
  useSWEffect();

  const data = useLoaderData<typeof loader>();

  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="manifest" href="/resources/manifest.webmanifest" />
        <Meta />
        <Links />
      </head>
      <body className="h-full bg-zinc-50">
        <Toaster position="bottom-right" />
        <GlobalLoading />
        <Outlet />
        <ScrollRestoration />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(data.ENV)}`,
          }}
        />
        <Scripts />
        <LiveReload />
        <noscript>This app requires JavaScript to be enabled</noscript>
      </body>
    </html>
  );
}

function ErrorDoc({ children }: PropsWithChildren) {
  return (
    <html lang="en" className="h-full">
      <head>
        <title>Oh no...</title>
        <Links />
      </head>
      <body className="h-full bg-zinc-50">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const location = useLocation();

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return (
        <ErrorDoc>
          <ErrorPage
            statusCode={error.status}
            title="Page not found"
            subtitle={`"${location.pathname}" is not a page. So sorry.`}
            action={<BackLink to={configRoutes.home}>Back to home</BackLink>}
          />
        </ErrorDoc>
      );
    }

    if (error.status !== 500) {
      return (
        <ErrorDoc>
          <ErrorPage
            statusCode={error.status}
            title="Oh no, something did not go well."
            subtitle={`"${location.pathname}" is currently not working. So sorry.`}
            action={<BackLink to={configRoutes.home}>Back to home</BackLink>}
          />
        </ErrorDoc>
      );
    }

    throw new Error(`Unhandled error: ${error.status}`);
  }

  return (
    <ErrorDoc>
      <ErrorPage
        statusCode={500}
        title="Oh no, something did not go well."
        subtitle={`"${location.pathname}" is currently not working. So sorry.`}
        action={<BackLink to={configRoutes.home}>Back to home</BackLink>}
      />
    </ErrorDoc>
  );
}

export default withSentry(App);
