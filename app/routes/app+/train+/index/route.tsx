import { Disclosure } from "@headlessui/react";
import {
  ChevronUpIcon,
  EllipsisVerticalIcon,
  PlusIcon,
} from "@heroicons/react/20/solid";
import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import clsx from "clsx";
import { useState } from "react";
import { AppPageLayout } from "~/components/app-page-layout";
import { Card } from "~/components/card";
import { requireUser } from "~/services/auth/api/require-user";
import { classes } from "~/utils/classes";
import { prisma } from "~/utils/db.server";
import type { MatchWithHeader } from "~/utils/hooks";

export const handle: MatchWithHeader = {
  header: () => "Train",
  links: [],
};

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request);
  const folders = await prisma.folder.findMany({
    where: {
      userId: user.id,
    },
  });

  return json({ folders });
};

export default function Train() {
  const { folders } = useLoaderData<typeof loader>();
  const [folderModalOpen, setFolderModalOpen] = useState<string>();

  return (
    <AppPageLayout>
      <Card>
        <h3 className="mb-4 text-base font-semibold leading-7 text-zinc-900 dark:text-zinc-50">
          Quick start
        </h3>

        <Link
          to="./empty"
          className={clsx(classes.buttonOrLink.primary, "w-full")}
        >
          <PlusIcon className="h-5 w-5" />
          Start an empty session
        </Link>
      </Card>

      <Card>
        <h3 className="mb-4 text-base font-semibold leading-7 text-zinc-900 dark:text-zinc-50">
          Routines
        </h3>

        {folders.map((folder) => (
          <Disclosure key={folder.id}>
            {({ open }) => (
              <>
                <div className="flex items-start gap-4">
                  <Disclosure.Button className="flex w-full gap-2 rounded-lg text-left text-sm font-medium">
                    <ChevronUpIcon
                      className={`${
                        open ? "rotate-180 transform" : "rotate-90"
                      } h-5 w-5 text-orange-500 transition-transform`}
                    />
                    <span>{folder.name}</span>
                  </Disclosure.Button>

                  <button
                    className="text-zinc-400"
                    onClick={() => setFolderModalOpen(folder.id)}
                  >
                    <EllipsisVerticalIcon className="h-5 w-5" />
                    <span className="sr-only">Options</span>
                  </button>
                </div>
                <Disclosure.Panel className="mt-2 text-gray-500">
                  Yes! You can purchase a license that you can share with your
                  entire team.
                </Disclosure.Panel>
              </>
            )}
          </Disclosure>
        ))}
      </Card>
    </AppPageLayout>
  );
}
