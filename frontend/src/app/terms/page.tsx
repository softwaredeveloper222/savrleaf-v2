import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Link from 'next/link';

const TermsPage = () => {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Page Header */}
          <header className="mb-12 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              SavrLeaf Billing Terms & Partner Policies
            </h1>
            <p className="mt-3 text-base sm:text-lg text-gray-700 max-w-2xl mx-auto">
              Effective Date: [Month Day, Year]
            </p>
            <p className="mt-2 text-sm text-gray-600 max-w-2xl mx-auto">
              These Billing Terms ("Terms") apply to all dispensaries, cannabis retailers, and license holders ("Partners") using SavrLeaf.
            </p>
          </header>

          {/* Main Content */}
          <article className="bg-white rounded-xl shadow-md p-10 prose max-w-none mx-auto">
            {/* Highlight Banner */}
            <section className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-10">
              <p className="text-base text-orange-700 font-medium leading-relaxed mb-0">
                <strong>Note:</strong> SavrLeaf reserves the right to update these Terms as the platform evolves.
              </p>
            </section>

            {/* Terms Sections */}
            <div className="space-y-8">
              {/* Section 1 */}
              <section>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">
                  1) Platform Purpose
                </h3>
                <div className="text-gray-700 leading-relaxed">
                  <p>SavrLeaf is a cannabis discount discovery platform that:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Displays discounted cannabis items only</li>
                    <li>Helps shoppers find discounts by location</li>
                    <li>Routes outbound clicks to a Partner's website for viewing, reservation, or purchase</li>
                  </ul>
                  <p className="mt-2">
                    <strong>SavrLeaf does not sell cannabis and does not process transactions.</strong>
                  </p>
                </div>
              </section>

              {/* Section 2 */}
              <section>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">
                  2) Partner Eligibility & Compliance
                </h3>
                <div className="text-gray-700 leading-relaxed">
                  <p>Partners must:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Operate legally in their jurisdiction</li>
                    <li>Maintain required licenses to sell cannabis</li>
                    <li>Ensure all listed products, pricing, discount claims, and content are accurate and compliant with state/local rules</li>
                  </ul>
                  <p className="mt-2">
                    SavrLeaf may request verification of licensure and reserves the right to restrict access or remove content that violates these Terms.
                  </p>
                </div>
              </section>

              {/* Section 3 */}
              <section>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">
                  3) Subscription Pricing (Locked)
                </h3>
                <div className="text-gray-700 leading-relaxed">
                  <p>Partner subscription pricing:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li><strong>$79.99/month</strong> per location — unlimited discounted items</li>
                    <li><strong>Concierge Add-On:</strong> $24.99/month per location — includes 2 concierge posting batches per week (scheduled windows; template required). Partners can still self-serve updates anytime.</li>
                  </ul>
                  <p className="mt-2">
                    Each location is treated independently for listing access, discount visibility, and dashboard management.
                  </p>
                </div>
              </section>

              {/* Section 4 */}
              <section>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">
                  4) Multi-Location Policy (Admin Approval Required)
                </h3>
                <div className="text-gray-700 leading-relaxed">
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Partners may not add additional locations automatically.</li>
                    <li>Any additional location must be requested and approved by SavrLeaf Admin prior to activation.</li>
                    <li>Multi-location pricing eligibility is determined at SavrLeaf's discretion and may be based on name, ownership, branding, management structure, affiliation, and other factors.</li>
                    <li>SavrLeaf may request a brief discussion to confirm eligibility and correct pricing.</li>
                  </ul>
                </div>
              </section>

              {/* Section 5 */}
              <section>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">
                  5) Billing & Renewal
                </h3>
                <div className="text-gray-700 leading-relaxed">
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Subscriptions renew automatically on a recurring monthly basis unless a term option is selected (Section 7).</li>
                    <li>Partners are responsible for maintaining valid payment information.</li>
                    <li>Failure to pay may result in suspension, delisting, or termination of Partner access.</li>
                  </ul>
                </div>
              </section>

              {/* Section 6 */}
              <section>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">
                  6) Standard Cancellation Policy (Monthly Plans)
                </h3>
                <div className="text-gray-700 leading-relaxed">
                  <p>Partners may cancel at any time, but cancellation must be submitted at least:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li><strong>Seven (7) days before the next billing cycle</strong> to prevent the next recurring charge.</li>
                  </ul>
                  <p className="mt-2">
                    If cancellation is submitted fewer than 7 days before renewal, the next billing cycle may still process.
                  </p>
                  <p className="mt-2">
                    Access remains active through the end of the current billing period unless otherwise stated.
                  </p>
                </div>
              </section>

              {/* Section 7 */}
              <section>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">
                  7) Partner Term Options* (Commitment Plans)
                </h3>
                <div className="text-gray-700 leading-relaxed">
                  <p>Partners may choose a term-based billing option for discounted pricing:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li><strong>3-Month Term:</strong> Save 5%</li>
                    <li><strong>6-Month Term:</strong> Save 10%</li>
                    <li><strong>12-Month Term:</strong> Save 15%</li>
                  </ul>
                  
                  <h4 className="text-lg font-semibold mt-4 mb-2 text-gray-800">
                    Term Cancellation Policy (Option 1)*
                  </h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Term options are commitments for the selected term.</li>
                    <li>Partners may request cancellation at any time; however, cancellation will only prevent renewal after the committed term ends</li>
                    <li>No refunds are provided for unused time</li>
                    <li>Discounted pricing applies only while the Partner remains active and in good standing throughout the term</li>
                  </ul>
                  
                  <p className="mt-3 text-sm text-gray-600">
                    * SavrLeaf may approve exceptions at its sole discretion.
                  </p>
                </div>
              </section>

              {/* Section 8 */}
              <section>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">
                  8) Refund Policy
                </h3>
                <div className="text-gray-700 leading-relaxed">
                  <p>All payments are non-refundable unless:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>there is a verified duplicate charge, or</li>
                    <li>a technical issue prevents service delivery, confirmed by SavrLeafDeals</li>
                  </ul>
                  <p className="mt-2">
                    Refund decisions are made at SavrLeafDeals' discretion.
                  </p>
                </div>
              </section>

              {/* Section 9 */}
              <section>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">
                  9) Discounted Items Only (Content Rule)
                </h3>
                <div className="text-gray-700 leading-relaxed">
                  <p><strong>SavrLeaf is strictly for discounted items.</strong></p>
                  <p className="mt-2">Partners agree that:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Only discounted/sale-priced items may be listed</li>
                    <li>Pricing must be accurate and clearly displayed</li>
                    <li>Original price and sale price must be included when possible</li>
                    <li>Start/end dates should be provided when applicable</li>
                  </ul>
                  <p className="mt-2">
                    SavrLeaf reserves the right to remove or edit listings that are misleading, incomplete, non-discounted, or non-compliant.
                  </p>
                </div>
              </section>

              {/* Section 10 */}
              <section>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">
                  10) Outbound Clicks & Transactions
                </h3>
                <div className="text-gray-700 leading-relaxed">
                  <p>Clicking a discount sends the user to the Partner's website.</p>
                  <p className="mt-2">
                    The Partner is fully responsible for checkout, reservation, inventory, pricing accuracy, fulfillment, and customer service.
                  </p>
                  <p className="mt-2">
                    <strong>SavrLeaf is not responsible for purchase outcomes on Partner sites.</strong>
                  </p>
                </div>
              </section>

              {/* Section 11 */}
              <section>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">
                  11) 21+ Audience Policy
                </h3>
                <div className="text-gray-700 leading-relaxed">
                  <p>SavrLeaf is intended for users 21 years of age or older.</p>
                  <p className="mt-2">Partners must comply with:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>all applicable advertising and marketing restrictions</li>
                    <li>age-gating requirements on their own websites and checkout flows</li>
                  </ul>
                </div>
              </section>

              {/* Section 12 */}
              <section>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">
                  12) Enforcement, Removal, & Admin Rights
                </h3>
                <div className="text-gray-700 leading-relaxed">
                  <p>SavrLeaf reserves the right to:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>remove discounts or dispensary content at any time</li>
                    <li>suspend, limit, or terminate Partner access</li>
                    <li>refuse service to any Partner at its discretion</li>
                    <li>adjust discount visibility, account status, and listings to protect platform integrity</li>
                  </ul>
                </div>
              </section>

              {/* Section 13 */}
              <section>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">
                  13) Changes to Terms & Pricing
                </h3>
                <div className="text-gray-700 leading-relaxed">
                  <p>
                    SavrLeaf may update these Terms and/or pricing with reasonable notice.
                  </p>
                  <p className="mt-2">
                    Continued use of the platform after changes constitutes acceptance of updated Terms.
                  </p>
                </div>
              </section>

              {/* Section 14 */}
              <section>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">
                  14) Support
                </h3>
                <div className="text-gray-700 leading-relaxed">
                  <p>For support, billing questions, or account assistance:</p>
                  <ul className="list-none pl-0 mt-2 space-y-1">
                    <li>
                      <a
                        href="mailto:info@savrleafdeals.com"
                        className="font-semibold underline text-orange-600 hover:text-orange-800 transition-colors"
                      >
                        info@savrleafdeals.com
                      </a>
                    </li>
                    <li className="text-sm text-gray-600">
                      (or{' '}
                      <a
                        href="mailto:support@savrleafdeals.com"
                        className="font-semibold underline text-orange-600 hover:text-orange-800 transition-colors"
                      >
                        support@savrleafdeals.com
                      </a>{' '}
                      if you choose to use it)
                    </li>
                  </ul>
                </div>
              </section>
            </div>

            {/* Billing Summary Section */}
            <section className="mt-12 pt-8 border-t border-gray-200">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                Billing Summary (Quick Reference)
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="space-y-3 text-gray-700">
                  <div>
                    <strong>Pricing:</strong> $79.99/month per location — unlimited discounts. Concierge add-on: $24.99/month (approval required for additional locations).
                  </div>
                  <div>
                    <strong>Partner Term Options:</strong> 3 months save 5% • 6 months save 10% • 12 months save 15%*
                  </div>
                  <div>
                    <strong>Cancellations:</strong> Monthly plans require 7-day notice before renewal. Term plans are commitments; cancellation stops renewal at term end. No refunds for unused time.*
                  </div>
                  <div>
                    <strong>Discounts Policy:</strong> Discounted items only. SavrLeaf does not sell cannabis and does not process transactions. 21+ only.
                  </div>
                </div>
              </div>
            </section>

            {/* Partner Listing Terms */}
            <section className="mt-12 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold mb-2 text-gray-900">
                Partner Listing Terms (SavrLeaf)
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                These terms reflect our &quot;discounted sale items only&quot; vision and clarify concierge uploads.
              </p>

              <div className="space-y-8">
                {/* 1 */}
                <section>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">
                    1) Discount-Only Requirement
                  </h3>
                  <div className="text-gray-700 leading-relaxed">
                    <p>
                      SavrLeaf is for discounted cannabis sale items only. Partners may only list items that are actively discounted from normal pricing.
                    </p>
                  </div>
                </section>

                {/* 2 */}
                <section>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">
                    2) Accuracy responsibility
                  </h3>
                  <div className="text-gray-700 leading-relaxed">
                    <p>
                      Partner is responsible for ensuring all listings are accurate (price, product details, availability, timing, and destination link). If a discount is posted on SavrLeaf, Partner agrees to make a good-faith effort to honor it as displayed during the active period (subject to inventory availability and applicable laws).
                    </p>
                  </div>
                </section>

                {/* 3 */}
                <section>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">
                    3) Expiration Required + Auto-Hide
                  </h3>
                  <div className="text-gray-700 leading-relaxed">
                    <p>
                      Every listing must include an expiration date/time (or end date). Expired listings will be automatically removed/hidden.
                    </p>
                  </div>
                </section>

                {/* 4 */}
                <section>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">
                    4) Self-Serve Updates Anytime
                  </h3>
                  <div className="text-gray-700 leading-relaxed">
                    <p>
                      Partners may update listings at any time through their Partner Dashboard. Partner is responsible for keeping listings current.
                    </p>
                  </div>
                </section>

                {/* 5 */}
                <section>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">
                    5) Concierge = 2 Scheduled Batches Per Week + Template + Off-Cycle Rolls To Next Drop
                  </h3>
                  <div className="text-gray-700 leading-relaxed">
                    <p>
                      If Partner requests SavrLeaf to post or update listings on Partner&apos;s behalf (&quot;concierge uploads&quot;):
                    </p>

                    <h4 className="text-lg font-semibold mt-4 mb-2 text-gray-800">
                      a) Batch Window / Timeframe
                    </h4>
                    <p>
                      The concierge add-on includes 2 scheduled posting batches per week. Partner must use SavrLeaf&apos;s required template for submissions. Updates submitted outside the scheduled windows will roll to the next batch drop.
                    </p>

                    <h4 className="text-lg font-semibold mt-4 mb-2 text-gray-800">
                      b) Submission Format
                    </h4>
                    <p>
                      Partner must submit all required listing details using SavrLeaf&apos;s template. At minimum, each listing must include: product name, product type, discount price, expiration date/time, destination link, and an image (or image URL). SavrLeaf may delay or decline posting incomplete submissions until required fields are provided.
                    </p>

                    <h4 className="text-lg font-semibold mt-4 mb-2 text-gray-800">
                      c) Off-Cycle / Urgent Requests
                    </h4>
                    <p>
                      Off-cycle updates outside the 2 scheduled batch windows are not guaranteed. Submissions received outside the window will roll to the next scheduled drop.
                    </p>

                    <h4 className="text-lg font-semibold mt-4 mb-2 text-gray-800">
                      d) Error Corrections
                    </h4>
                    <p>
                      If Partner reports a true posting error (wrong price/link caused by SavrLeaf), SavrLeaf will make reasonable efforts to correct it promptly.
                    </p>
                  </div>
                </section>

                {/* 6 */}
                <section>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">
                    6) SavrLeaf Does Not Process Transactions (Redirects Only)
                  </h3>
                  <div className="text-gray-700 leading-relaxed">
                    <p>
                      SavrLeaf does not process payments or transactions. Listings redirect users to Partner&apos;s website/menu/order destination.
                    </p>
                  </div>
                </section>

                {/* 7 */}
                <section>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">
                    7) 21+ Compliance
                  </h3>
                  <div className="text-gray-700 leading-relaxed">
                    <p>
                      Partner is responsible for compliance with all applicable cannabis laws and regulations. SavrLeaf is a 21+ platform.
                    </p>
                  </div>
                </section>

                {/* 8 */}
                <section>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">
                    8) Admin Override/Removal Rights
                  </h3>
                  <div className="text-gray-700 leading-relaxed">
                    <p>
                      SavrLeaf may edit, pause, or remove any listing or partner page at its discretion (including for inaccurate discounts, expired listings, or policy violations) to protect users and platform quality.
                    </p>
                  </div>
                </section>

                {/* 9 */}
                <section>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">
                    9) Permission To Display Partner Name/Logo/Images For Listings
                  </h3>
                  <div className="text-gray-700 leading-relaxed">
                    <p>
                      Partner grants SavrLeaf permission to display Partner name, logo, and submitted images solely for promoting Partner&apos;s discounted listings on SavrLeaf.
                    </p>
                  </div>
                </section>
              </div>
            </section>
          </article>

          {/* Back Button */}
          <div className="mt-10 text-center">
            <Link
              href="/"
              className="inline-block bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default TermsPage;
