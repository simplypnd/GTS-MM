import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { legalPageMetadata } from "@/lib/seo/legalMetadata";

const LAST_UPDATED = "June 3, 2026";

export const metadata = legalPageMetadata({
  title: "Dispute Policy | GTS MM",
  description:
    "Official GTS MM dispute policy: evidence standards, mediator authority, timelines, and binding resolutions for escrow deals.",
  path: "/dispute-policy",
  keywords: [
    "GTS MM dispute policy",
    "escrow dispute Philippines",
    "online deal mediation",
  ],
});

export default function DisputePolicyPage() {
  return (
    <LegalPageShell
      title="Dispute Policy"
      subtitle="Rules for escrow disputes and mediator resolutions"
      lastUpdated={LAST_UPDATED}
    >
      <p>
        This Dispute Policy (&quot;Policy&quot;) governs all disputes opened on
        GTS MM. By using the Platform, each party agrees to submit disputes in
        accordance with this Policy. Effective date: {LAST_UPDATED}. This Policy
        supplements the{" "}
        <a href="/refund-and-return-policy">Refund &amp; Return Policy</a>.
      </p>

      <h2>1. Definitions</h2>
      <ul>
        <li>
          <strong>Mediator</strong> — a Platform-authorized user empowered to
          resolve disputed Deals.
        </li>
        <li>
          <strong>Evidence</strong> — documentation submitted in the deal chat or
          otherwise made available to the Mediator.
        </li>
        <li>
          <strong>Resolution</strong> — a final Mediator decision to release,
          refund, or partially allocate net Escrow.
        </li>
      </ul>

      <h2>2. When to open a dispute</h2>
      <p>A party may open a dispute when, including but not limited to:</p>
      <ul>
        <li>Goods or services were not received, were materially not as described, or are alleged counterfeit;</li>
        <li>The Seller claims delivery but the Buyer has credible contrary proof;</li>
        <li>The Buyer refuses receipt without valid cause after confirmed delivery;</li>
        <li>Any disagreement regarding Escrow while funds are held or after partial release.</li>
      </ul>

      <h2>3. How to open a dispute</h2>
      <ol>
        <li>Access the Deal page while authenticated as a participant;</li>
        <li>Select <strong>Open dispute</strong> and provide a clear written reason;</li>
        <li>Upload supporting Evidence in the deal chat (tracking, photos, timestamps, messages);</li>
        <li>
          Parties shall not move the transaction off-platform to evade Escrow or
          Platform fees.
        </li>
      </ol>

      <h2>4. Evidence standards</h2>
      <ul>
        <li>
          <strong>Physical delivery:</strong> carrier tracking, signed receipt, or
          timestamped photographs.
        </li>
        <li>
          <strong>Condition:</strong> unboxing video or photographs within
          forty-eight (48) hours of receipt.
        </li>
        <li>
          <strong>Digital goods:</strong> access logs, license keys, or provider
          delivery confirmation.
        </li>
        <li>
          Screenshots alone may be insufficient where metadata is absent,
          altered, or unverifiable.
        </li>
      </ul>
      <p>
        Parties shall retain original files and sources. GTS MM may preserve chat
        and event records for resolution and audit purposes.
      </p>

      <h2>5. Mediator authority</h2>
      <p>Authorized Mediators may issue a Resolution to:</p>
      <ul>
        <li>
          <strong>Release to Seller</strong> — credit net funds (after the Platform
          fee) to the Seller&apos;s Wallet balance;
        </li>
        <li>
          <strong>Refund to Buyer</strong> — credit net funds (after the Platform
          fee) to the Buyer&apos;s Wallet balance;
        </li>
        <li>
          <strong>Partial allocation</strong> — split net Escrow between parties as
          documented in resolution notes.
        </li>
      </ul>
      <p>
        <strong>Binding effect:</strong> A Mediator Resolution is final for the
        subject Deal on GTS MM. Parties waive further Platform review except
        where required by law or for fraud investigation.
      </p>

      <h2>6. Timelines</h2>
      <ul>
        <li>
          Parties shall respond to Mediator requests in chat within forty-eight
          (48) hours when practicable.
        </li>
        <li>
          Mediators aim to decide within five (5) business days of receiving
          sufficient Evidence.
        </li>
        <li>
          Deals lacking adequate Evidence may be decided against the party that
          failed to substantiate its claims.
        </li>
      </ul>

      <h2>7. Prohibited conduct</h2>
      <p>The following conduct is prohibited and may result in account suspension:</p>
      <ul>
        <li>False claims, forged documents, or intimidation of another party;</li>
        <li>Use of multiple accounts to manipulate reviews or disputes;</li>
        <li>Requests for off-platform payment to evade fees or Escrow;</li>
        <li>Abusive language toward Mediators or support staff.</li>
      </ul>
      <p>
        GTS MM reserves the right to refer matters to competent authorities where
        applicable.
      </p>

      <h2>8. Reviews and reputation</h2>
      <p>
        Buyer star ratings (1–5) after completed Deals affect public seller
        scores. Reviews must be truthful. Mediators may disregard reviews linked
        to fraud or collusion.
      </p>

      <h2>9. Contact and amendments</h2>
      <p>
        Questions regarding this Policy: <a href="/contact">Contact us</a>. GTS MM
        may update interpretations and this Policy as fraud patterns and product
        rules evolve; the &quot;Last updated&quot; date reflects material revisions.
      </p>
    </LegalPageShell>
  );
}
