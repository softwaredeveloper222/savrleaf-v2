'use client';

/**
 * ADMIN ONLY - Maintenance Mode Page
 * Displayed to public users when maintenance mode is ON
 * NOT PARTNER FACING
 */

import { Wrench } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import logo from '../assets/logo.png';

interface MaintenanceModePageProps {
  message?: string;
}

export default function MaintenanceModePage({ message }: MaintenanceModePageProps) {
  const defaultMessage = 'We are currently performing maintenance. Please check back soon.';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-orange-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="flex justify-center mb-6">
          <Image src={logo} alt="SavrLeaf Logo" width={80} height={80} className="w-20 h-20 object-contain" />
        </div>
        
        <div className="flex justify-center mb-6">
          <div className="bg-orange-100 rounded-full p-4">
            <Wrench className="w-12 h-12 text-orange-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Maintenance Mode
        </h1>

        <p className="text-gray-600 mb-6 text-lg">
          {message || defaultMessage}
        </p>

        <div className="mb-6">
          <Link
            href="/admin-login"
            className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Admin Login
          </Link>
        </div>

        <div className="text-sm text-gray-500">
          <p>We apologize for any inconvenience.</p>
          <p className="mt-2">Thank you for your patience.</p>
        </div>
      </div>
    </div>
  );
}

