import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { legalPageMetadata } from "@/lib/seo/legalMetadata";

const LAST_UPDATED = "June 3, 2026";

export const metadata = legalPageMetadata({
  title: "Refund & Return Policy | GTS MM",
  description:
    "Official GTS MM refund and return policy for escrow deals, platform fees, wallet credits, and buyer cancellation for non-delivery.",
  path: "/refund-and-return-policy",
  keywords: [
    "GTS MM refund policy",
    "escrow refund Philippines",
    "return policy online deals",
  ],
});

export default function RefundReturnPolicyPage() {
  return (
    <LegalPageShell
      title="Refund & Return Policy"
      subtitle="Terms governing escrow refunds and wallet credits"
      lastUpdated={LAST_UPDATED}
      currentPath="/refund-and-return-policy"
    >
      <p>
        This Refund &amp; Return Policy (&quot;Policy&quot;) applies to all deals
        conducted on GTS MM. By creating or participating in a Deal, each party
        agrees to this Policy as supplemented by the{" "}
        <a href="/dispute-policy">Dispute Policy</a> and applicable in-app rules.
        Effective date: {LAST_UPDATED}.
      </p>

      <h2>1. Definitions</h2>
      <ul>
        <li>
          <strong>Escrow</strong> — funds held by the Platform (MidMan) until
          release, refund, or mediator resolution.
        </li>
        <li>
          <strong>Buyer</strong> — the party designated to pay for the Deal.
        </li>
        <li>
          <strong>Seller</strong> — the party designated to deliver goods or
          services under the Deal.
        </li>
        <li>
          <strong>Wallet balance</strong> — credited funds available for
          withdrawal or payment on future deals.
        </li>
        <li>
          <strong>Platform fee</strong> — five percent (5%) charged on the gross
          deal amount at payment.
        </li>
      </ul>

      <h2>2. Scope</h2>
      <p>
        This Policy governs when funds may be cancelled, refunded, or released
        prior to completion. It does not cover bank chargebacks initiated
        outside GTS MM; see Section 8.
      </p>

      <h2>3. Order of remedies</h2>
      <ol>
        <li>
          <strong>Pre-payment:</strong> Either party may cancel while no
          payment has been received.
        </li>
        <li>
          <strong>Payment window:</strong> Automatic cancellation if payment is
          not received within twenty (20) minutes after the payment window
          starts.
        </li>
        <li>
          <strong>Post-payment, pre-delivery:</strong> Buyer may cancel for
          refund if the Seller has not marked delivery within twenty (20)
          minutes after payment.
        </li>
        <li>
          <strong>After delivery:</strong> Refunds require an in-app dispute and
          mediator decision under the Dispute Policy.
        </li>
      </ol>

      <h2>4. Platform fee</h2>
      <p>
        The Platform fee is deducted at payment and is <strong>non-refundable</strong>{" "}
        except where a mediator orders otherwise in writing within a dispute
        resolution. Refunds and releases to Wallet balance shall use the{" "}
        <strong>net amount after the Platform fee</strong>, unless otherwise
        stated in the Deal or resolution notes.
      </p>

      <h2>5. Before payment</h2>
      <p>
        If no funds have entered Escrow, either party may cancel the Deal from
        the deal page. Status shall become <strong>Cancelled</strong> with no
        Wallet movement.
      </p>
      <p>
        After the Buyer starts payment, the Deal must be funded within{" "}
        <strong>twenty (20) minutes</strong>. Failure to pay within that period
        shall result in <strong>automatic cancellation</strong> without Wallet
        movement.
      </p>

      <h2>6. Non-delivery by Seller</h2>
      <p>
        After payment, if the Seller has not marked the order as delivered
        within <strong>twenty (20) minutes</strong>, the Buyer may cancel the Deal
        for a refund. The net amount (after the Platform fee) shall be credited
        to the Buyer&apos;s Wallet balance.
      </p>

      <h2>7. After delivery and confirmation</h2>
      <p>
        Once the Seller marks delivered and the Buyer confirms receipt, funds
        shall release to the Seller&apos;s Wallet balance. Returns or refunds
        thereafter require an <a href="/dispute-policy">in-app dispute</a> and
        a binding mediator decision.
      </p>

      <h2>8. Disputes and external chargebacks</h2>
      <p>
        Parties shall open disputes from the deal page while funds remain in
        Escrow or as otherwise permitted. Mediators may refund the Buyer, release
        to the Seller, or apply a partial split of net Escrow.
      </p>
      <p>
        Bank or card chargebacks filed outside GTS MM may be declined where
        Platform records show confirmed delivery, release, or a final mediator
        resolution. GTS MM reserves the right to provide transaction records to
        payment partners in accordance with applicable law.
      </p>

      <h2>9. Withdrawals</h2>
      <p>
        Amounts credited to Wallet balance may be withdrawn to a verified bank
        account via InstaPay or PESONet when payout details are complete and
        verified.
      </p>

      <h2>10. Seller reputation</h2>
      <p>
        Public seller metrics treat buyer ratings of four (4) or five (5) stars
        as positive when calculating the percentage displayed on profiles.
        Reviews must be honest and may be disregarded where tied to fraud or
        collusion.
      </p>

      <h2>11. Contact and amendments</h2>
      <p>
        Questions regarding this Policy:{" "}
        <a href="/contact">Contact us</a>. GTS MM may update this Policy;
        continued use after the published effective date constitutes acceptance.
      </p>
    </LegalPageShell>
  );
}
