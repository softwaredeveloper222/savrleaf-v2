'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

export default function Header() {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/partner-login');
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo and Brand */}
        <Link href="/" className="flex items-center space-x-2 hover:opacity-90 transition-opacity">
          <Image
            src={logo}
            alt="SavrLeaf Logo"
            height={32}
            width={32}
            className="h-8 w-auto"
          />
          <span className="text-xl font-semibold text-gray-900 tracking-tight">
            SavrLeaf<sup className="text-xs align-super">®</sup>
          </span>
        </Link>

        {/* Navigation */}
        <nav>
          <ul className="flex items-center space-x-5 text-sm text-orange-600 cursor-pointer">
            {/* {!isAuthenticated && (
              <li>
                <a
                  href="#how-it-works"
                  className="font-bold text-orange-600 hover:text-orange-700 transition-colors cursor-pointer"
                >
                  How It Works
                </a>
              </li>
            )} */}
            {isAuthenticated && (
              <li>
                <button
                  onClick={handleLogout}
                  className="font-bold text-orange-600 hover:text-orange-700 transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
