import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { legalPageMetadata } from "@/lib/seo/legalMetadata";

const LAST_UPDATED = "June 3, 2026";

export const metadata = legalPageMetadata({
  title: "Dispute Policy | GTS MM",
  description:
    "GTS MM dispute rules: evidence requirements, mediator authority, timelines, prohibited conduct, and binding resolutions for escrow deals.",
  path: "/dispute-policy",
  keywords: [
    "GTS MM dispute policy",
    "escrow dispute Philippines",
    "online deal mediation",
  ],
});

export default function DisputePolicyPage() {
  return (
    <LegalPageShell title="Dispute policy" lastUpdated={LAST_UPDATED}>
      <p>
        This policy governs all disputes opened on GTS MM. By using the platform
        you agree to these rules. Mediators may update interpretations as fraud
        patterns evolve.
      </p>
      <h2>When to open a dispute</h2>
      <ul>
        <li>Item not received, materially not as described, or counterfeit</li>
        <li>Seller claims delivery but buyer has credible proof otherwise</li>
        <li>Buyer refuses receipt without valid reason after confirmed delivery</li>
        <li>Any escrow disagreement while funds are held or after partial release</li>
      </ul>
      <h2>How to open a dispute</h2>
      <ol>
        <li>Use the deal page while you are a participant.</li>
        <li>Select <strong>Open dispute</strong> and submit a clear reason.</li>
        <li>Upload proof in chat: tracking, photos, timestamps, and messages.</li>
        <li>Do not move the transaction off-platform to avoid escrow protection.</li>
      </ol>
      <h2>Evidence standards</h2>
      <ul>
        <li>
          <strong>Delivery:</strong> tracking numbers, carrier screenshots, signed
          receipt, or timestamped photos.
        </li>
        <li>
          <strong>Condition:</strong> unboxing video or photos within 48 hours of
          receipt.
        </li>
        <li>
          <strong>Digital goods:</strong> access logs, license keys, or delivery
          confirmation from the provider.
        </li>
        <li>
          Screenshots alone may be insufficient if metadata is missing or edited.
        </li>
      </ul>
      <h2>Mediator authority</h2>
      <p>Verified mediators may decide to:</p>
      <ul>
        <li>
          <strong>Release to seller</strong> — net funds after the 5% fee credit the
          seller balance.
        </li>
        <li>
          <strong>Refund to buyer</strong> — net funds after the 5% fee credit the
          buyer balance.
        </li>
        <li>
          <strong>Partial resolution</strong> — split net escrow between parties as
          documented in the resolution notes.
        </li>
      </ul>
      <p>Mediator decisions are final for that deal on GTS MM.</p>
      <h2>Timelines</h2>
      <ul>
        <li>Parties should respond in chat within 48 hours when asked.</li>
        <li>Mediators aim to decide within 5 business days of sufficient evidence.</li>
        <li>Deals without adequate proof may be decided against the party that failed to substantiate claims.</li>
      </ul>
      <h2>Prohibited conduct</h2>
      <ul>
        <li>False claims, forged documents, or intimidation of the other party</li>
        <li>Multiple accounts to manipulate reviews or disputes</li>
        <li>Requesting off-platform payment to evade fees or escrow</li>
        <li>Abusive language toward mediators or support staff</li>
      </ul>
      <p>
        Violations may result in account suspension and referral to authorities
        where applicable.
      </p>
      <h2>Reviews and reputation</h2>
      <p>
        Buyer star ratings (1–5) after completed deals affect public seller scores.
        Reviews must be honest. Mediators may disregard reviews tied to fraud or
        collusion.
      </p>
      <h2>Contact</h2>
      <p>
        Questions about this policy: <a href="/contact">Contact us</a>.
      </p>
    </LegalPageShell>
  );
}
