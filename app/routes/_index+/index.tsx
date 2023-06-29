import { Link } from "@remix-run/react";
import {
  ArrowLongRightIcon,
  BookOpenIcon,
  MinusSmallIcon,
  PlusSmallIcon,
} from "@heroicons/react/24/solid";
import { configRoutes } from "~/utils/routes";
import { useOptionalUser } from "~/utils/hooks";
import { Disclosure } from "@headlessui/react";
import type { SVGAttributes } from "react";
import { classes } from "~/utils/classes";

const faqs = [
  {
    question: "Why aren't I downloading this app from an App Store?",
    answer:
      "Sculped is a Progressive Web App (PWA), which means you don't need to download it from traditional app stores like the Play Store or Google Play Store. A Progressive Web App (PWA) offers several advantages that make it a better choice like instant access, cross-platform compatibility, space-saving, automatic updates, offline functionality and more.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Absolutely! We offer a 14-day free trial you can cancel at any time, allowing you to explore every feature of the app in depth. It's a wonderful opportunity to experience the full capabilities of Sculped before committing. Following the trial period, our subscription is priced at $4.99 per month. We believe this combination of a free trial and affordable pricing provides excellent value for your muscle-building journey.",
  },
  {
    question: "What is a mesocycle and why do I need one?",
    answer:
      "Training should be structured and designed around your likes and needs which is exactly what a mesocycle is. Structured training. The only way to know you're making progress is by tracking your performance every session somewhere and this is something that's built in to our mesocycles.",
  },
  {
    question: "Can I do the same mesocycle multiple times?",
    answer:
      "Of course! You can repeat a mesocycle as many times as you want, you'll be able to see how you performed on each of the times you did the mesocycle and see the amount of progress you've made.",
  },
  {
    question: "What mesocycle presets are there?",
    answer:
      "We currently have 5 presets which are the most popular. 3 Push pull legs presets, 1 upper lower preset and 1 bro split. You can of course customize each of them however you'd like or create your own from scratch.",
  },
  {
    question: "Is there an official Discord?",
    answer: () => (
      <>
        Yes! There is an official discord where you can directly talk to the
        developers, give feedback, request new features, talk with the rest of
        the community and more!{" "}
        <a
          className={classes.buttonOrLink.textOnly}
          href="https://discord.gg/t2vhvjrK"
        >
          Click here to join
        </a>
        .
      </>
    ),
  },
];

const features = [
  {
    name: "Mesocycles",
    pictures: [
      "/app-features/new-mesocycle-1.png",
      "/app-features/new-mesocycle-2.png",
      "/app-features/view-mesocycle-1.png",
      "/app-features/view-mesocycle-2.png",
      "/app-preview.png",
      "/app-features/view-mesocycle-3.png",
    ],
    description:
      "Structure your training with our powerful mesocycles. You can either use a preset or design your own from the ground up. We understand how many variables come into training which is why you can customize absolutely everything down to repetition ranges, RIR and more.",
    icon: BookOpenIcon,
  },
  {
    name: "Exercises",
    pictures: [
      "/app-features/list-exercises.png",
      "/app-features/view-exercise-1.png",
      "/app-features/new-exercise-1.png",
    ],
    description:
      "Perform any exercise you can think of, you can either pick one from our extensive directory of exercises or create your own. Every exercise includes stats and performance tracking.",
    icon: (props: SVGAttributes<SVGElement>) => (
      <svg
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 485.535 485.535"
        {...props}
      >
        <g>
          <g id="_x35__13_">
            <g>
              <path
                d="M55.465,123.228c-15.547,0-28.159,12.608-28.159,28.161v56.673C11.653,211.908,0,225.928,0,242.765
         c0,16.842,11.652,30.861,27.306,34.707v56.666c0,15.555,12.612,28.16,28.159,28.16c15.546,0,28.16-12.605,28.16-28.16V151.389
         C83.625,135.837,71.011,123.228,55.465,123.228z"
              />
              <path
                d="M334.498,65.278c-23.092,0-41.811,18.719-41.811,41.812v93.864h-12.801h-60.585h-19.625l-6.827-0.163V107.09
         c0-23.092-18.72-41.812-41.813-41.812c-23.091,0-41.812,18.719-41.812,41.812v271.355c0,23.093,18.721,41.812,41.812,41.812
         c23.094,0,41.813-18.719,41.813-41.812v-93.653c0,0,4.501-0.211,6.827-0.211h19.625h60.585h12.801v93.864
         c0,23.093,18.719,41.812,41.811,41.812c23.094,0,41.812-18.719,41.812-41.812V107.089
         C376.311,83.998,357.592,65.278,334.498,65.278z"
              />
              <path
                d="M458.229,208.062v-56.673c0-15.552-12.613-28.161-28.158-28.161c-15.547,0-28.16,12.608-28.16,28.161v182.749
         c0,15.555,12.613,28.16,28.16,28.16c15.545,0,28.158-12.605,28.158-28.16v-56.666c15.654-3.846,27.307-17.865,27.307-34.707
         C485.535,225.927,473.883,211.908,458.229,208.062z"
              />
            </g>
          </g>
        </g>
      </svg>
    ),
  },
];

export default function Index() {
  const user = useOptionalUser();

  return (
    <div className="relative isolate mx-auto flex  max-w-7xl flex-col gap-12 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
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

      <div className="my-auto flex flex-shrink-0 flex-col items-center gap-20 pt-2 lg:flex-row lg:gap-12 lg:pt-10">
        <div className="mx-auto w-full max-w-2xl xs:text-center lg:mx-0 lg:-mt-20 lg:max-w-none lg:text-left">
          <div className="lg:ml-1l mb-10 xs:flex xs:items-center xs:justify-center lg:block">
            <img src="/logo.png" alt="" className="h-12 w-12" />
          </div>

          <span className="rounded-full bg-orange-500/10 px-3 py-1 text-sm font-semibold leading-6 text-orange-400 ring-1 ring-inset ring-orange-500/20">
            Currently in beta
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-zinc-950 dark:text-white xs:text-5xl sm:text-6xl">
            Supercharge your hypertrophy training
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-300">
            Unleash the muscle-building potential within you using our
            groundbreaking app. Design customized mesocycles and keep a close
            eye on your progress. Say goodbye to plateaus and hello to
            extraordinary results.
          </p>
          <div className="mt-8 flex flex-col gap-6 xs:flex-row xs:items-center xs:justify-center lg:justify-normal">
            {user ? (
              <Link
                to={configRoutes.app.home}
                className="rounded-md bg-orange-500 px-5 py-2.5 font-semibold text-white  hover:bg-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
              >
                Open app
              </Link>
            ) : (
              <>
                <Link
                  to={configRoutes.auth.getStarted}
                  className="rounded-md bg-orange-500 px-5 py-2.5 font-semibold text-white  hover:bg-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
                >
                  Get started for free
                </Link>
                <Link
                  to={configRoutes.auth.signIn}
                  className="flex items-center gap-2 rounded-md bg-zinc-900 px-5 py-2.5 font-semibold text-white  ring-1 ring-zinc-700 hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-800"
                >
                  <span>Sign in</span>
                  <ArrowLongRightIcon className="-mr-1 h-5 w-5" />
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="flex-shrink-0">
          <img
            src="/app-preview.png"
            className="w-auto rounded-3xl border-[6px] border-zinc-900 dark:border-zinc-700"
            alt="App preview"
          />
        </div>
        <div
          className="absolute inset-x-0 top-[calc(100%-30rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-60rem)]"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#fcc189] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
          />
        </div>
      </div>

      <div className="mx-auto mt-32 max-w-7xl sm:mt-56">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-lg font-semibold leading-7 text-orange-600">
            Features
          </h2>
        </div>

        <ul className="flex flex-col gap-16">
          {features.map((feature) => (
            <li className="lg:text-center" key={feature.name}>
              <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
                {feature.name}
              </p>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
                {feature.description}
              </p>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-10">
                {feature.pictures.map((picture, index) => (
                  <img
                    key={picture}
                    src={picture}
                    alt={`Preview ${index + 1}`}
                    className="max-h-[700px] w-auto rounded-3xl border-[6px] border-zinc-900 dark:border-zinc-700"
                  />
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-32 divide-y divide-zinc-900/10 dark:divide-zinc-50/10 sm:mt-56">
        <h2 className="text-2xl font-bold leading-10 tracking-tight text-zinc-900 dark:text-zinc-50">
          Frequently asked questions
        </h2>
        <dl className="mt-10 space-y-6 divide-y divide-zinc-900/10 dark:divide-zinc-50/10">
          {faqs.map((faq) => (
            <Disclosure as="div" key={faq.question} className="pt-6">
              {({ open }) => (
                <>
                  <dt>
                    <Disclosure.Button className="flex w-full items-start justify-between text-left text-zinc-900 dark:text-zinc-50">
                      <span className="text-base font-semibold leading-7">
                        {faq.question}
                      </span>
                      <span className="ml-6 flex h-7 items-center">
                        {open ? (
                          <MinusSmallIcon
                            className="h-6 w-6"
                            aria-hidden="true"
                          />
                        ) : (
                          <PlusSmallIcon
                            className="h-6 w-6"
                            aria-hidden="true"
                          />
                        )}
                      </span>
                    </Disclosure.Button>
                  </dt>
                  <Disclosure.Panel as="dd" className="mt-2 pr-12">
                    <p className="text-base leading-7 text-zinc-600 dark:text-zinc-300">
                      {typeof faq.answer === "function"
                        ? faq.answer()
                        : faq.answer}
                    </p>
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>
          ))}
        </dl>
      </div>

      <footer className="mt-32 flex gap-6 text-sm">
        <Link
          to="/legal/privacy-policy"
          className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-200 dark:hover:text-zinc-400"
        >
          Privacy Policy
        </Link>
        <Link
          to="/legal/terms-of-service"
          className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-200 dark:hover:text-zinc-400"
        >
          Terms Of Service
        </Link>

        <div className="ml-auto">
          <Link
            to="https://discord.gg/t2vhvjrK"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-200 dark:hover:text-zinc-400"
          >
            <svg
              width="24"
              height="24"
              xmlns="http://www.w3.org/2000/svg"
              fill-rule="evenodd"
              clip-rule="evenodd"
              fill="currentColor"
            >
              <path d="M19.54 0c1.356 0 2.46 1.104 2.46 2.472v21.528l-2.58-2.28-1.452-1.344-1.536-1.428.636 2.22h-13.608c-1.356 0-2.46-1.104-2.46-2.472v-16.224c0-1.368 1.104-2.472 2.46-2.472h16.08zm-4.632 15.672c2.652-.084 3.672-1.824 3.672-1.824 0-3.864-1.728-6.996-1.728-6.996-1.728-1.296-3.372-1.26-3.372-1.26l-.168.192c2.04.624 2.988 1.524 2.988 1.524-1.248-.684-2.472-1.02-3.612-1.152-.864-.096-1.692-.072-2.424.024l-.204.024c-.42.036-1.44.192-2.724.756-.444.204-.708.348-.708.348s.996-.948 3.156-1.572l-.12-.144s-1.644-.036-3.372 1.26c0 0-1.728 3.132-1.728 6.996 0 0 1.008 1.74 3.66 1.824 0 0 .444-.54.804-.996-1.524-.456-2.1-1.416-2.1-1.416l.336.204.048.036.047.027.014.006.047.027c.3.168.6.3.876.408.492.192 1.08.384 1.764.516.9.168 1.956.228 3.108.012.564-.096 1.14-.264 1.74-.516.42-.156.888-.384 1.38-.708 0 0-.6.984-2.172 1.428.36.456.792.972.792.972zm-5.58-5.604c-.684 0-1.224.6-1.224 1.332 0 .732.552 1.332 1.224 1.332.684 0 1.224-.6 1.224-1.332.012-.732-.54-1.332-1.224-1.332zm4.38 0c-.684 0-1.224.6-1.224 1.332 0 .732.552 1.332 1.224 1.332.684 0 1.224-.6 1.224-1.332 0-.732-.54-1.332-1.224-1.332z" />
            </svg>
          </Link>
        </div>
      </footer>
    </div>
  );
}
