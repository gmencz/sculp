import { LegalHeader } from "~/components/legal-header";

export default function TermsOfService() {
  return (
    <div className="bg-zinc-950 text-white">
      <LegalHeader />

      <div className="flex items-center justify-center border-b border-t border-zinc-600 px-6 py-24">
        <h1 className="text-5xl font-semibold text-zinc-100 sm:text-6xl">
          Terms and Conditions of Use
        </h1>
      </div>

      <div className="mx-auto w-full max-w-5xl p-6 leading-7 text-zinc-300">
        <h2 className="mb-4 text-xl font-semibold text-zinc-100">1. Terms</h2>

        <p className="mb-10">
          By accessing this Website, accessible from
          https://hypertrophylogbook.com, you are agreeing to be bound by these
          Website Terms and Conditions of Use and agree that you are responsible
          for the agreement with any applicable local laws. If you disagree with
          any of these terms, you are prohibited from accessing this site. The
          materials contained in this Website are protected by copyright and
          trade mark law.
        </p>

        <h2 className="mb-4 text-xl font-semibold text-zinc-100">
          2. Use License
        </h2>

        <p className="mb-4">
          Permission is granted to temporarily download one copy of the
          materials on The Hypertrophy Logbook's Website for personal,
          non-commercial transitory viewing only. This is the grant of a
          license, not a transfer of title, and under this license you may not:
        </p>

        <ul className="mb-4 ml-5 flex list-disc flex-col gap-4">
          <li>modify or copy the materials;</li>
          <li>
            use the materials for any commercial purpose or for any public
            display;
          </li>
          <li>
            attempt to reverse engineer any software contained on The
            Hypertrophy Logbook's Website;
          </li>
          <li>
            remove any copyright or other proprietary notations from the
            materials; or
          </li>
          <li>
            transferring the materials to another person or "mirror" the
            materials on any other server.
          </li>
        </ul>

        <p className="mb-10">
          This will let The Hypertrophy Logbook to terminate upon violations of
          any of these restrictions. Upon termination, your viewing right will
          also be terminated and you should destroy any downloaded materials in
          your possession whether it is printed or electronic format. These
          Terms of Service has been created with the help of the{" "}
          <a
            className="text-orange-400 underline"
            href="https://www.termsfeed.com/terms-service-generator/"
            rel="noreferrer"
            target="_blank"
          >
            Terms Of Service Generator
          </a>
          .
        </p>

        <h2 className="mb-4 text-xl font-semibold text-zinc-100">
          3. Disclaimer
        </h2>

        <p className="mb-10">
          All the materials on The Hypertrophy Logbook's Website are provided
          "as is". The Hypertrophy Logbook makes no warranties, may it be
          expressed or implied, therefore negates all other warranties.
          Furthermore, The Hypertrophy Logbook does not make any representations
          concerning the accuracy or reliability of the use of the materials on
          its Website or otherwise relating to such materials or any sites
          linked to this Website.
        </p>

        <h2 className="mb-4 text-xl font-semibold text-zinc-100">
          4. Limitations
        </h2>

        <p className="mb-10">
          The Hypertrophy Logbook or its suppliers will not be hold accountable
          for any damages that will arise with the use or inability to use the
          materials on The Hypertrophy Logbook's Website, even if The
          Hypertrophy Logbook or an authorize representative of this Website has
          been notified, orally or written, of the possibility of such damage.
          Some jurisdiction does not allow limitations on implied warranties or
          limitations of liability for incidental damages, these limitations may
          not apply to you.
        </p>

        <h2 className="mb-4 text-xl font-semibold text-zinc-100">
          5. Revisions and Errata
        </h2>

        <p className="mb-10">
          The materials appearing on The Hypertrophy Logbook's Website may
          include technical, typographical, or photographic errors. The
          Hypertrophy Logbook will not promise that any of the materials in this
          Website are accurate, complete, or current. The Hypertrophy Logbook
          may change the materials contained on its Website at any time without
          notice. The Hypertrophy Logbook does not make any commitment to update
          the materials.
        </p>

        <h2 className="mb-4 text-xl font-semibold text-zinc-100">6. Links</h2>

        <p className="mb-10">
          The Hypertrophy Logbook has not reviewed all of the sites linked to
          its Website and is not responsible for the contents of any such linked
          site. The presence of any link does not imply endorsement by The
          Hypertrophy Logbook of the site. The use of any linked website is at
          the user's own risk.
        </p>

        <h2 className="mb-4 text-xl font-semibold text-zinc-100">
          7. Site Terms of Use Modifications
        </h2>

        <p className="mb-10">
          The Hypertrophy Logbook may revise these Terms of Use for its Website
          at any time without prior notice. By using this Website, you are
          agreeing to be bound by the current version of these Terms and
          Conditions of Use.
        </p>

        <h2 className="mb-4 text-xl font-semibold text-zinc-100">
          8. Your Privacy
        </h2>

        <p className="mb-10">Please read our Privacy Policy.</p>

        <h2 className="mb-4 text-xl font-semibold text-zinc-100">
          9. Governing Law
        </h2>

        <p className="mb-4">
          Any claim related to The Hypertrophy Logbook's Website shall be
          governed by the laws of es without regards to its conflict of law
          provisions.
        </p>
      </div>
    </div>
  );
}
