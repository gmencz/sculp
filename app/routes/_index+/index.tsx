import { Link } from "@remix-run/react";
import { ArrowLongRightIcon } from "@heroicons/react/20/solid";
import { configRoutes } from "~/utils/routes";
import { useOptionalUser } from "~/utils/hooks";

export default function Index() {
  const user = useOptionalUser();

  return (
    <div className="relative isolate h-full bg-zinc-50">
      <div
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        aria-hidden="true"
      >
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#fcc189] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>

      <div className="mx-auto flex min-h-full max-w-7xl flex-col gap-12 px-6 py-6 sm:py-10">
        <div className="mx-auto my-auto w-full max-w-2xl flex-shrink-0 pt-10">
          <span className="rounded-full bg-orange-500/10 px-3 py-1 text-sm font-semibold leading-6 text-orange-400 ring-1 ring-inset ring-orange-500/20">
            Currently in beta
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-zinc-950 sm:text-6xl">
            Supercharge your hypertrophy training
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-600">
            Unleash the muscle-building potential within you using our
            groundbreaking app. Design customized mesocycles and keep a close
            eye on your progress. Say goodbye to plateaus and hello to
            extraordinary results.
          </p>
          <div className="mt-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            {user ? (
              <Link
                to={configRoutes.app.current}
                className="rounded-md bg-orange-500 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
              >
                Open app
              </Link>
            ) : (
              <>
                <Link
                  to={configRoutes.auth.getStarted}
                  className="rounded-md bg-orange-500 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
                >
                  Get started
                </Link>
                <Link
                  to={configRoutes.auth.signIn}
                  className="flex items-center gap-2 rounded-md bg-zinc-900 px-5 py-2.5 font-semibold text-white shadow-sm ring-1 ring-zinc-700 hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-800"
                >
                  <span>Sign in</span>
                  <ArrowLongRightIcon className="-mr-1 h-5 w-5" />
                </Link>
              </>
            )}
          </div>
        </div>

        <footer className="mx-auto mt-auto flex w-full max-w-2xl flex-shrink-0 gap-6 self-start text-sm">
          <Link
            to="/legal/privacy-policy"
            className="text-zinc-600 hover:text-zinc-800"
          >
            Privacy Policy
          </Link>
          <Link
            to="/legal/terms-of-service"
            className="text-zinc-600 hover:text-zinc-800"
          >
            Terms Of Service
          </Link>
        </footer>
      </div>
    </div>
  );
}
