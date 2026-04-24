import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Link from 'next/link';

const PrivacyPage = () => {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Page Header */}
          <header className="mb-12 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Privacy Policy
            </h1>
            <p className="mt-3 text-base sm:text-lg text-gray-700 max-w-2xl mx-auto">
              Your privacy is important to us at <sup className="text-xs align-super">®</sup>. This page explains how
              we handle your information.
            </p>
          </header>

          {/* Main Content */}
          <article className="bg-white rounded-xl shadow-md p-10 prose max-w-none mx-auto">
            {/* Highlight Banner */}
            <section className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-10 text-center">
              <h2 className="text-2xl font-bold text-orange-800 mb-4">
                SavrLeaf<sup className="text-xs align-super">®</sup> Privacy Policy
              </h2>
              <p className="text-base text-orange-700 font-medium leading-relaxed">
                We respect your privacy. SavrLeaf<sup className="text-xs align-super">®</sup> collects only the minimal
                information necessary to provide our services. <br />
                We never sell your data. For questions, contact{' '}
                <a
                  href="mailto:support@savrleafdeals.com"
                  className="underline text-orange-600 hover:text-orange-800 transition-colors"
                >
                  support@savrleafdeals.com
                </a>.
              </p>
            </section>

            {/* Policy Sections */}
            <div className="space-y-8">
              {[
                {
                  title: '1. Information We Collect',
                  content: (
                    <>
                      <p>
                        <sup className="text-xs align-super">®</sup> collects minimal information necessary to provide
                        our services:
                      </p>
                      <ul>
                        <li>Age verification data (21+ confirmation)</li>
                        <li>Location data (to show nearby discounts)</li>
                        <li>Basic usage analytics (page views, discount interactions)</li>
                        <li>
                          Partner account information (for dispensary partners only)
                        </li>
                      </ul>
                    </>
                  ),
                },
                {
                  title: '2. How We Use Your Information',
                  content: (
                    <>
                      <p>We use collected information solely to:</p>
                      <ul>
                        <li>Verify age requirements (21+)</li>
                        <li>Show relevant discounts in your area</li>
                        <li>Improve our platform and user experience</li>
                        <li>Communicate with our business partners</li>
                      </ul>
                    </>
                  ),
                },
                {
                  title: '3. Data Sharing',
                  content: (
                    <>
                      <p>
                        <strong>We do not sell your data.</strong> We may share
                        minimal information only with:
                      </p>
                      <ul>
                        <li>
                          Partner dispensaries (when you interact with their discounts)
                        </li>
                        <li>Legal authorities (when required by law)</li>
                        <li>
                          Service providers (hosting, analytics) under strict privacy
                          agreements
                        </li>
                      </ul>
                    </>
                  ),
                },
                {
                  title: '4. Data Storage',
                  content: (
                    <p>
                      Your information is stored securely and retained only as long
                      as necessary to provide our services. Age verification data is
                      stored locally on your device whenever possible.
                    </p>
                  ),
                },
                {
                  title: '5. Your Rights',
                  content: (
                    <>
                      <p>You have the right to:</p>
                      <ul>
                        <li>
                          Request information about data we have collected on you
                        </li>
                        <li>Request deletion of your personal data</li>
                        <li>Opt out of non-essential data collection</li>
                        <li>Contact us with privacy concerns</li>
                      </ul>
                    </>
                  ),
                },
                {
                  title: '6. Contact Us',
                  content: (
                    <p>
                      For privacy questions or data requests, contact us at:{' '}
                      <a
                        href="mailto:support@savrleafdeals.com"
                        className="font-semibold underline text-orange-600 hover:text-orange-800 transition-colors"
                      >
                        support@savrleafdeals.com
                      </a>
                    </p>
                  ),
                },
                {
                  title: '7. Updates',
                  content: (
                    <p>
                      This privacy policy may be updated occasionally. We will
                      notify users of significant changes through our platform or
                      email notifications.
                    </p>
                  ),
                },
              ].map(({ title, content }) => (
                <section key={title}>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">
                    {title}
                  </h3>
                  <div className="text-gray-700 leading-relaxed">{content}</div>
                </section>
              ))}
            </div>
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

export default PrivacyPage;
