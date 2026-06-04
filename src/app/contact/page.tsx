import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { ContactJsonLd } from "@/components/legal/ContactJsonLd";
import { legalPageMetadata } from "@/lib/seo/legalMetadata";

const LAST_UPDATED = "June 3, 2026";

export const metadata = legalPageMetadata({
  title: "Contact Us | GTS MM",
  description:
    "Official GTS MM customer support for escrow deals, QR Ph payments, wallet withdrawals, and disputes in the Philippines.",
  path: "/contact",
  keywords: ["GTS MM contact", "escrow support Philippines", "MidMan help"],
});

export default function ContactPage() {
  return (
    <>
      <ContactJsonLd />
      <LegalPageShell
        title="Contact Us"
        subtitle="Customer support for GTS MM escrow transactions"
        lastUpdated={LAST_UPDATED}
        currentPath="/contact"
        variant="support"
      >
        <p>
          This page describes how parties may contact GTS MM regarding account
          access, deal payments, wallet balances, withdrawals, and disputes. By
          using the Platform, you acknowledge that support requests are handled
          in accordance with this notice and our published policies.
        </p>

        <h2>1. Definitions</h2>
        <p>
          <strong>Platform</strong> means the GTS MM website and related
          services. <strong>Party</strong> means a registered buyer, seller, or
          authorized mediator. <strong>Deal</strong> means a transaction
          created on the Platform subject to MidMan escrow rules.
        </p>

        <h2>2. Support channels</h2>
        <p>
          <strong>Primary email:</strong>{" "}
          <a href="mailto:support@gtseller.shop">support@gtseller.shop</a>
        </p>
        <p>
          <strong>Business hours:</strong> Monday through Friday, 9:00 AM to
          6:00 PM (Philippine Standard Time), excluding public holidays. Messages
          received outside business hours shall be queued for the next business
          day.
        </p>

        <h2>3. Response standards</h2>
        <ul>
          <li>
            <strong>General inquiries:</strong> within two (2) business days.
          </li>
          <li>
            <strong>Active disputes:</strong> within twenty-four (24) hours on
            business days, subject to completeness of information provided.
          </li>
          <li>
            <strong>Payment or withdrawal issues:</strong> same business day
            where reasonably practicable.
          </li>
        </ul>

        <h2>4. Information required</h2>
        <p>
          To enable timely resolution, each request shall include, where
          applicable:
        </p>
        <ul>
          <li>Registered username (display name);</li>
          <li>Deal identifier (Deal ID from the deal page URL);</li>
          <li>Transaction or withdrawal reference, if any;</li>
          <li>A concise description of the issue and relevant timestamps.</li>
        </ul>

        <h2>5. Escalation paths</h2>
        <p>
          <strong>Escrow and refunds:</strong> Parties shall first review the{" "}
          <a href="/refund-and-return-policy">Refund &amp; Return Policy</a> and
          use in-app deal actions (cancel, confirm receipt, or open dispute) as
          appropriate.
        </p>
        <p>
          <strong>Disputes:</strong> Where funds remain in escrow or a dispute
          is open, parties shall follow the{" "}
          <a href="/dispute-policy">Dispute Policy</a> and submit evidence in the
          deal chat. Email support supplements—but does not replace—the
          in-app dispute process.
        </p>

        <h2>6. Policy updates</h2>
        <p>
          GTS MM may amend this contact notice and related policies. Material
          changes shall be reflected by the &quot;Last updated&quot; date above.
          Continued use of the Platform after publication constitutes acceptance
          of the revised notice.
        </p>

        <h2>7. Governing context</h2>
        <p>
          GTS MM operates escrow and payment services for users in the
          Philippines. Support is provided in English. Nothing in this notice
          creates a guarantee of outcome in any particular dispute; mediator
          decisions are governed by the Dispute Policy.
        </p>
      </LegalPageShell>
    </>
  );
}
