import { CalendarDaysIcon } from "@heroicons/react/20/solid";

type MesocycleOverviewProps = {
  microcycles: number;
  restDays: number;
  trainingDays: number;
  goal: string;
};

export function MesocycleOverview({
  microcycles,
  restDays,
  trainingDays,
  goal,
}: MesocycleOverviewProps) {
  return (
    <div className="mt-1 flex flex-col gap-1">
      <div className="mt-2 flex items-center text-sm text-zinc-500">
        <CalendarDaysIcon
          className="mr-1.5 h-5 w-5 flex-shrink-0 text-zinc-400"
          aria-hidden="true"
        />
        {microcycles} {microcycles === 1 ? "microcycle" : "microcycles"}
      </div>
      <div className="mt-2 flex items-center text-sm text-zinc-500">
        <svg
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 485.535 485.535"
          className="mr-1.5 h-5 w-5 flex-shrink-0 text-zinc-400"
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
        {trainingDays} training {trainingDays === 1 ? "day" : "days"} per
        microcycle
      </div>
      <div className="mt-2 flex items-center text-sm text-zinc-500">
        <svg
          fill="currentColor"
          className="mr-1.5 h-5 w-5 flex-shrink-0 text-zinc-400"
          xmlns="http://www.w3.org/2000/svg"
          fillRule="evenodd"
          clipRule="evenodd"
        >
          <path d="M24 19v-7h-23v-7h-1v14h1v-2h22v2h1zm-20-12c1.104 0 2 .896 2 2s-.896 2-2 2-2-.896-2-2 .896-2 2-2zm19 4c0-1.657-1.343-3-3-3h-13v3h16z" />
        </svg>
        {restDays} rest {restDays === 1 ? "day" : "days"} per microcycle
      </div>
      <div className="mt-2 flex items-center text-sm text-zinc-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mr-1.5 h-5 w-5 flex-shrink-0 text-zinc-400"
          fill="currentColor"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <path d="M6 12c0 2.206 1.794 4 4 4 1.761 0 3.242-1.151 3.775-2.734l2.224-1.291.001.025c0 3.314-2.686 6-6 6s-6-2.686-6-6 2.686-6 6-6c1.084 0 2.098.292 2.975.794l-2.21 1.283c-.248-.048-.503-.077-.765-.077-2.206 0-4 1.794-4 4zm4-2c-1.105 0-2 .896-2 2s.895 2 2 2 2-.896 2-2l-.002-.015 3.36-1.95c.976-.565 2.704-.336 3.711.159l4.931-2.863-3.158-1.569.169-3.632-4.945 2.87c-.07 1.121-.734 2.736-1.705 3.301l-3.383 1.964c-.29-.163-.621-.265-.978-.265zm7.995 1.911l.005.089c0 4.411-3.589 8-8 8s-8-3.589-8-8 3.589-8 8-8c1.475 0 2.853.408 4.041 1.107.334-.586.428-1.544.146-2.18-1.275-.589-2.69-.927-4.187-.927-5.523 0-10 4.477-10 10s4.477 10 10 10c5.233 0 9.521-4.021 9.957-9.142-.301-.483-1.066-1.061-1.962-.947z" />
        </svg>
        {goal}
      </div>
    </div>
  );
}
