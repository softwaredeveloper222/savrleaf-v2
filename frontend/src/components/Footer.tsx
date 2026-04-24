import Link from 'next/link';
import Image from 'next/image';
import logo from '../assets/logo.png';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-green-950 via-green-950 to-gray-800 text-white font-sans mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Cannabis Disclaimer */}
        <div className="bg-yellow-950 border border-yellow-700 rounded-xl p-5 shadow-md">
          <div className="flex items-start gap-4">
            <span className="text-yellow-400 text-2xl mt-1" aria-hidden="true">⚠️</span>
            <div className="text-sm leading-relaxed text-yellow-100">
              <p className="font-semibold text-yellow-200 mb-1 uppercase tracking-wide">
                Must Be 21+ • Legal Disclaimer
              </p>
              <p>
                <strong className="text-yellow-50">SavrLeaf<sup className="text-[10px] relative -top-[0.7em]">®</sup> does not sell or handle cannabis products.</strong> We connect consumers with licensed dispensaries. All purchases are made through licensed third-party retailers. Please consume responsibly and follow local laws.
              </p>
            </div>
          </div>
        </div>

        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <Image
                src={logo}
                alt="SavrLeaf Logo"
                width={36}
                height={36}
                className="w-9 h-9 rounded-lg object-cover"
              />
              <h2 className="text-2xl font-bold text-white">SavrLeaf<sup className="text-xs align-super">®</sup></h2>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              Find the best verified cannabis discounts from trusted dispensaries near you. Explore new products and compare prices with confidence.
            </p>
            <div className="text-sm text-green-200 space-y-1">
              <p>Verified dispensaries only</p>
              <p>Age verification required</p>
              <p>Service available in legal cannabis states</p>
            </div>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-lg font-semibold text-green-300 mb-3">Legal</h3>
            <ul className="space-y-2 text-sm">
              {[
                ['Terms of Service', '/terms'],
                ['Privacy Policy', '/privacy'],
                ['Contact Us', '/contact'],
                ['About', '/about'],
                ['How It Works', '/how-it-works'],
              ].map(([label, path]) => (
                <li key={path}>
                  <Link className="text-gray-300 hover:text-green-400 transition" href={path}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Admin & Business Links */}
          <div>
            <h3 className="text-lg font-semibold text-green-300 mb-3">Access</h3>
            <ul className="space-y-2 text-sm">
              {[
                ['Become a Partner', '/partner-signup'],
                ['Partner Login', '/partner-login'],
                ['Admin Login', '/admin-login'],
                // ['Pricing Plans', '/partner-signup'],
                ].map(([label, path], index) => (
                  <li key={`${path}-${index}`}>
                    <Link href={path} className="text-gray-300 hover:text-green-400 transition">
                      {label}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        </div>

        {/* Partner CTA */}
        <div className="border-t border-green-800 pt-8 pb-6">
          <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl p-6 text-center">
            <p className="text-white text-lg font-semibold mb-4">
              Are you a dispensary? List your discounted items on SavrLeaf.
            </p>
            <Link
              href="/partner-signup"
              className="inline-block bg-white text-orange-600 px-6 py-3 rounded-lg font-bold hover:bg-orange-50 transition-colors"
            >
              Partner Application / Apply Here
            </Link>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="border-t border-green-800 pt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-sm text-gray-400">
          <div>
            <p>© 2025 SavrLeaf<sup className="text-[10px] relative -top-[0.7em]">®</sup>. All rights reserved.</p>
            <p className="text-xs mt-1">
              SavrLeaf<sup className="text-[9px] relative -top-[0.6em]">®</sup> is a registered trademark of LumoraSolutionsLLC. Product names and logos are property of their respective owners.
            </p>
          </div>
          <div className="text-xs text-gray-500 max-w-md text-left md:text-right">
            <p>
              This website has not been evaluated by the FDA. Products are not intended to diagnose, treat, cure, or prevent any disease.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
