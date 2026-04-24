import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Link from 'next/link';

const HowItWorksPage = () => {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Page Header */}
          <header className="mb-12 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-orange-600 tracking-tight">
              How SavrLeaf Works
            </h1>
          </header>

          {/* Main Content */}
          <article className="bg-white rounded-xl shadow-md p-10 prose max-w-none mx-auto">
            {/* Intro Paragraph */}
            <section className="mb-10">
              <p className="text-gray-700 leading-relaxed text-lg">
                SavrLeaf<sup className="text-xs align-super">®</sup> is designed to reduce noise in cannabis shopping by displaying only discounted products and sending shoppers directly to licensed dispensaries. The platform stays intentionally narrow in scope to remain simple, compliant, and effective.
              </p>
            </section>

            {/* Section Divider */}
            <div className="border-t border-orange-200 my-10"></div>

            {/* For Shoppers */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4 text-orange-600">
                For Shoppers
              </h2>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700 leading-relaxed">
                <li>Browse discounted and sale-only products</li>
                <li>Filter by location or ingestion type</li>
                <li>Click a discount to visit the dispensary directly</li>
                <li>Complete your purchase with the retailer</li>
              </ol>
              <p className="mt-4 text-gray-700 leading-relaxed">
                No accounts. No logins. No checkout on SavrLeaf.
              </p>
            </section>

            {/* Section Divider */}
            <div className="border-t border-orange-200 my-10"></div>

            {/* For Dispensaries */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4 text-orange-600">
                For Dispensaries
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-relaxed">
                <li>List discounted products for discovery</li>
                <li>Increase visibility for sale inventory</li>
                <li>Receive direct traffic to your site or menu</li>
                <li>Maintain full control over pricing and fulfillment</li>
              </ul>
              <p className="mt-4 text-gray-700 leading-relaxed">
                SavrLeaf functions strictly as a discovery channel, not a marketplace.
              </p>
            </section>

            {/* Section Divider */}
            <div className="border-t border-orange-200 my-10"></div>

            {/* What SavrLeaf Does Not Do */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4 text-orange-600">
                What SavrLeaf Does Not Do
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-relaxed">
                <li>Process payments</li>
                <li>Handle orders or delivery</li>
                <li>Store customer purchase data</li>
              </ul>
            </section>

            {/* Section Divider */}
            <div className="border-t border-orange-200 my-10"></div>

            {/* Built for Simplicity & Compliance */}
            <section className="mb-6">
              <h2 className="text-2xl font-semibold mb-4 text-orange-600">
                Built for Simplicity & Compliance
              </h2>
              <p className="text-gray-700 leading-relaxed">
                All transactions occur off-site with licensed dispensaries. SavrLeaf does not sell cannabis. Users must be 21 years of age or older.
              </p>
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

export default HowItWorksPage;
