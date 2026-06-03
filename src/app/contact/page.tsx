import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { ContactJsonLd } from "@/components/legal/ContactJsonLd";
import { legalPageMetadata } from "@/lib/seo/legalMetadata";

const LAST_UPDATED = "June 3, 2026";

export const metadata = legalPageMetadata({
  title: "Contact Us | GTS MM",
  description:
    "Contact GTS MM support for escrow deals, QR Ph payments, withdrawals, and dispute questions in the Philippines.",
  path: "/contact",
  keywords: ["GTS MM contact", "escrow support Philippines", "MidMan help"],
});

export default function ContactPage() {
  return (
    <>
      <ContactJsonLd />
      <LegalPageShell title="Contact us" lastUpdated={LAST_UPDATED}>
        <p>
          For account, payment, withdrawal, or dispute questions, reach our team
          using the channels below. Include your deal ID and registered username
          when applicable.
        </p>
        <h2>Support email</h2>
        <p>
          <a href="mailto:support@gtseller.shop">support@gtseller.shop</a>
        </p>
        <h2>Response times</h2>
        <ul>
          <li>General inquiries: within 2 business days</li>
          <li>Active disputes: within 24 hours on business days</li>
          <li>Payment or withdrawal issues: same day when possible</li>
        </ul>
        <h2>Before you write</h2>
        <ul>
          <li>
            Read our{" "}
            <a href="/refund-and-return-policy">Refund &amp; return policy</a> for
            escrow refunds and the 20-minute non-delivery rule.
          </li>
          <li>
            Read our <a href="/dispute-policy">Dispute policy</a> for evidence
            requirements and mediator decisions.
          </li>
          <li>
            Open an in-app dispute from the deal page if funds are in escrow and
            parties disagree.
          </li>
        </ul>
      </LegalPageShell>
    </>
  );
}
