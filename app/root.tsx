import type {
  LinksFunction,
  LoaderArgs,
  V2_MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import * as Sentry from "@sentry/remix";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
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
import { env } from "./utils/env.server";
import { configRoutes } from "./utils/routes";

export const meta: V2_MetaFunction<typeof loader> = ({ data }) => {
  const title = "Sculped - Hypertrophy Training";

  const description =
    "Unleash the muscle-building potential within you using our groundbreaking app. Design customized mesocycles and keep a close eye on your progress. Say goodbye to plateaus and hello to extraordinary results.";

  const keywords =
    "Sculped, hypertrophy training, muscle building, mesocycles, progress tracking, results";

  const tags = [
    { title: title, charset: "utf-8" },
    { name: "viewport", content: "width=device-width,initial-scale=1" },
    { name: "description", content: description },
    { name: "keywords", content: keywords },

    { name: "og:title", content: title },
    { name: "og:description", content: description },
    { name: "og:type", content: "website" },

    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];

  if (data?.baseUrl) {
    const imageUrl = `${data.baseUrl}/logo.png`;
    tags.push(
      { name: "og:image", content: imageUrl },
      { name: "og:url", content: data.baseUrl },
      { name: "twitter:image", content: imageUrl }
    );
  }

  return tags;
};

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: tailwindStylesheetUrl },
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

export const loader = async ({ request }: LoaderArgs) => {
  const userId = await getUserId(request);
  if (!userId) {
    return json({ user: null, baseUrl: env.HOST_URL });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  return json({ user, baseUrl: env.HOST_URL });
};

function App() {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <Toaster position="bottom-right" />
        <GlobalLoading />
        <Outlet />
        <ScrollRestoration />
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
      <body className="h-full">
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
    Sentry.captureException(error);

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

  Sentry.captureException(error);

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
