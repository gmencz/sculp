import { Link } from "@remix-run/react";
import { ArrowLongRightIcon } from "@heroicons/react/20/solid";
import { useOptionalUser } from "~/utils";

export default function Index() {
  const user = useOptionalUser();

  return (
    <div className="relative isolate h-full overflow-hidden bg-zinc-950">
      <svg
        className="absolute inset-0 -z-10 h-full w-full stroke-white/10 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="983e3e4c-de6d-4c3f-8d64-b9761d1534cc"
            width={200}
            height={200}
            x="50%"
            y={-1}
            patternUnits="userSpaceOnUse"
          >
            <path d="M.5 200V.5H200" fill="none" />
          </pattern>
        </defs>
        <svg x="50%" y={-1} className="overflow-visible fill-gray-800/20">
          <path
            d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
            strokeWidth={0}
          />
        </svg>
        <rect
          width="100%"
          height="100%"
          strokeWidth={0}
          fill="url(#983e3e4c-de6d-4c3f-8d64-b9761d1534cc)"
        />
      </svg>
      <div
        className="absolute left-[calc(50%-4rem)] top-10 -z-10 transform-gpu blur-3xl sm:left-[calc(50%-18rem)] lg:left-48 lg:top-[calc(50%-30rem)] xl:left-[calc(50%-24rem)]"
        aria-hidden="true"
      >
        <div
          className="aspect-[1108/632] w-[69.25rem] bg-gradient-to-r from-[#80caff] to-[#4f46e5] opacity-20"
          style={{
            clipPath:
              "polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)",
          }}
        />
      </div>
      <div className="mx-auto flex h-full max-w-7xl flex-col px-6 py-10">
        <div className="mx-auto my-auto w-full max-w-2xl flex-shrink-0 pt-10">
          <span className="rounded-full bg-orange-500/10 px-3 py-1 text-sm font-semibold leading-6 text-orange-400 ring-1 ring-inset ring-orange-500/20">
            Currently in private beta
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Smart hypertrophy logbook
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-300">
            Want to build muscle like a pro? Our evidence-based logbook provides
            personalized recommendations and data-driven insights to help you
            achieve your goals.
          </p>
          <div className="mt-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            {user ? (
              <Link
                to="/logbook"
                className="rounded-md bg-orange-500 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
              >
                Open logbook
              </Link>
            ) : (
              <>
                <Link
                  to=".?modal=request-access"
                  className="rounded-md bg-orange-500 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
                >
                  Request access
                </Link>
                <Link
                  to=".?modal=sign-in"
                  className="flex items-center gap-2 rounded-md bg-zinc-900 px-5 py-2.5 font-semibold text-white shadow-sm ring-1 ring-zinc-700 hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-800"
                >
                  <span>Sign in</span>
                  <ArrowLongRightIcon className="-mr-1 h-5 w-5" />
                </Link>
              </>
            )}
          </div>
        </div>

        <footer className="mx-auto mt-auto w-full max-w-2xl flex-shrink-0 self-start text-white">
          <Link
            to="/legal/privacy-policy"
            className="text-zinc-400 hover:text-white"
          >
            Privacy policy
          </Link>
        </footer>
      </div>
    </div>
  );
}
