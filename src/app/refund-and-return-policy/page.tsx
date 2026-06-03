import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { legalPageMetadata } from "@/lib/seo/legalMetadata";

const LAST_UPDATED = "June 3, 2026";

export const metadata = legalPageMetadata({
  title: "Refund & Return Policy | GTS MM",
  description:
    "GTS MM refund and return policy for escrow deals: 5% platform fee, wallet credits, QR Ph payments, and buyer cancellation when seller does not deliver.",
  path: "/refund-and-return-policy",
  keywords: [
    "GTS MM refund policy",
    "escrow refund Philippines",
    "return policy online deals",
  ],
});

export default function RefundReturnPolicyPage() {
  return (
    <LegalPageShell title="Refund & return policy" lastUpdated={LAST_UPDATED}>
      <p>
        GTS MM holds deal funds in escrow until the buyer confirms receipt or a
        mediator resolves a dispute. This policy explains when refunds apply and
        how funds return to your wallet.
      </p>
      <h2>Platform fee</h2>
      <p>
        A 5% platform fee applies to every deal at payment. Refunds and releases
        use the <strong>net amount after this fee</strong>, credited to the
        buyer&apos;s or seller&apos;s in-app balance.
      </p>
      <h2>Before payment</h2>
      <p>
        If no funds have been transferred, either party may cancel the deal from
        the deal page. The deal status becomes <strong>Cancelled</strong> with no
        wallet movement.
      </p>
      <p>
        After the buyer starts payment, the deal must be paid within{" "}
        <strong>20 minutes</strong>. If payment is not received in that window,
        the deal is <strong>automatically cancelled</strong> with no wallet
        movement.
      </p>
      <h2>Non-delivery by seller</h2>
      <p>
        After payment, if the seller has not marked the order as delivered within{" "}
        <strong>20 minutes</strong>, the buyer may cancel the deal for a refund.
        The net amount (after the 5% fee) is credited to the buyer&apos;s balance.
      </p>
      <h2>After delivery</h2>
      <p>
        Once the seller marks delivered and the buyer confirms receipt, funds
        release to the seller. Returns or refunds after release require an{" "}
        <a href="/dispute-policy">in-app dispute</a> and mediator decision.
      </p>
      <h2>Disputes and chargebacks</h2>
      <p>
        Open a dispute from the deal page while funds are in escrow. Mediators may
        refund the buyer, release to the seller, or apply a partial split. Bank
        chargebacks outside GTS MM may be declined when escrow records show
        delivery and release.
      </p>
      <h2>Withdrawals</h2>
      <p>
        Refunded balances may be withdrawn to a linked bank account via InstaPay
        or PESONet when payout details are verified.
      </p>
      <h2>Seller reputation</h2>
      <p>
        Public seller scores count 4- and 5-star buyer reviews as positive when
        calculating the percentage shown on profiles.
      </p>
    </LegalPageShell>
  );
}
