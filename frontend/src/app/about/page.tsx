import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Link from 'next/link';

const AboutPage = () => {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Page Header */}
          <header className="mb-12 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-orange-600 tracking-tight">
              About SavrLeaf
              <sup className="text-xs align-super">®</sup>
            </h1>
          </header>

          {/* Main Content */}
          <article className="bg-white rounded-xl shadow-md p-10 prose max-w-none mx-auto">
            {/* Intro Paragraph */}
            <section className="mb-10">
              <p className="text-gray-700 leading-relaxed text-lg mb-4">
                SavrLeaf<sup className="text-xs align-super">®</sup> is a cannabis discount-discovery platform built exclusively for discounted and sale-priced products from licensed dispensaries. The platform is intentionally simple — helping shoppers 21+ find real discounts by location or ingestion type, without accounts, logins, or clutter.
              </p>
              <p className="text-gray-700 leading-relaxed text-lg">
                SavrLeaf does not process transactions and does not sell cannabis. All discounts redirect users directly to participating dispensaries, allowing retailers to move discounted inventory efficiently while maintaining full control of pricing and fulfillment.
              </p>
            </section>

            {/* Section Divider */}
            <div className="border-t border-orange-200 my-10"></div>

            {/* How SavrLeaf Works */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4 text-orange-600">
                How SavrLeaf Works
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-relaxed">
                <li>Displays only discounted or sale-priced products</li>
                <li>Allows browsing by location or ingestion type</li>
                <li>Redirects users directly to licensed dispensaries</li>
                <li>No accounts, no logins, no checkout</li>
              </ul>
            </section>

            {/* Section Divider */}
            <div className="border-t border-orange-200 my-10"></div>

            {/* What SavrLeaf Is Not */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4 text-orange-600">
                What SavrLeaf Is Not
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-relaxed">
                <li>Not a marketplace</li>
                <li>Not a delivery service</li>
                <li>Not a payment processor</li>
                <li>Not a data broker</li>
              </ul>
            </section>

            {/* Section Divider */}
            <div className="border-t border-orange-200 my-10"></div>

            {/* Compliance & Transparency */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4 text-orange-600">
                Compliance & Transparency
              </h2>
              <p className="text-gray-700 leading-relaxed">
                SavrLeaf displays discount information provided by licensed dispensaries and redirects users off-site for all transactions. Users must be 21 years of age or older to access cannabis discounts. Availability, pricing, and product details are managed entirely by each participating dispensary.
              </p>
            </section>

            {/* Section Divider */}
            <div className="border-t border-orange-200 my-10"></div>

            {/* Company Information */}
            <section className="mb-6">
              <div className="text-gray-700 leading-relaxed space-y-2">
                <p>SavrLeafDeals.com is operated by LumoraSolutions LLC.</p>
                <p>SavrLeaf<sup className="text-xs align-super">®</sup> is a registered trademark.</p>
                <p>
                  Contact:{' '}
                  <a
                    href="mailto:info@savrleafdeals.com"
                    className="text-orange-600 hover:text-orange-700 underline transition-colors"
                  >
                    info@savrleafdeals.com
                  </a>
                </p>
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

export default AboutPage;
