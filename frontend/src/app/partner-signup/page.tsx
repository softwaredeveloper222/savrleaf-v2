'use client';

import { useEffect, useState } from 'react';
import DispensaryApplicationForm from '@/components/DispensaryApplication';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import axios from 'axios';
import { SubscriptionTier } from '@/types';

export default function PartnerSignupPage() {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);

  // useEffect(() => {
  //   const fetchTiers = async () => {
  //     try {
  //       const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/subscription-tiers`);
  //       setTiers(res.data);
  //     } catch (error) {
  //       console.error('Error fetching subscription tiers', error);
  //     }
  //   };
  //   fetchTiers();
  // }, []);

  return (
    <>
      <Header />
      <div className="min-h-screen py-10 bg-gradient-to-br from-orange-50 to-white px-4 md:px-16">
        <h1 className="text-3xl font-bold text-center text-orange-800 mb-8">
          Apply to join as a Dispensary Partner
        </h1>

        {/* Partner Guide */}
        <div className="max-w-4xl mx-auto mb-12 bg-white rounded-2xl shadow-lg p-8 border border-orange-100">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="bg-orange-600 text-white rounded-full w-16 h-16 flex items-center justify-center font-bold text-2xl mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Apply</h3>
              <p className="text-gray-600 text-sm">
                Fill out the application form below with your dispensary information and contact details.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-orange-600 text-white rounded-full w-16 h-16 flex items-center justify-center font-bold text-2xl mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Approval & Payment</h3>
              <p className="text-gray-600 text-sm">
                Once approved, complete your subscription payment to activate your account.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-orange-600 text-white rounded-full w-16 h-16 flex items-center justify-center font-bold text-2xl mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Discounts</h3>
              <p className="text-gray-600 text-sm">
                Start uploading your discounted items today and reach more customers.
              </p>
            </div>
          </div>

          {/* Pricing Information */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 text-center">Pricing</h3>
            <div className="text-center space-y-2 text-gray-700">
              <p className="text-base">
                <strong>$79.99/month</strong> per location — unlimited discounted items (SKUs)
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <strong>Concierge Add-On:</strong> $24.99/month — 2 posting batches per week
              </p>
              <p className="text-sm text-gray-600 mt-3">
                Term options available: 3 months (save 5%), 6 months (save 10%), 12 months (save 15%)
              </p>
            </div>
          </div>
        </div>

        {/* Subscription Tiers Row */}
        {/* <div className="flex flex-col items-center mb-2">
          <h2 className="text-xl font-semibold text-orange-700 mb-4">Choose Your Plan</h2>
          <div className="flex flex-wrap justify-center gap-6">
            {tiers.map((tier) => (
              <div
                key={tier._id}
                onClick={() => setSelectedTier(tier)}
                className={`w-full sm:w-64 border rounded-lg p-4 shadow-sm cursor-pointer ${
                  selectedTier?._id === tier._id ? 'border-orange-600 bg-orange-50' : 'border-orange-200 bg-white'
                }`}
              >
                <h3 className="text-lg font-bold text-orange-800">{tier.displayName}</h3>
                <p className="text-sm text-gray-600 mb-2">${tier.monthlyPrice} / month</p>
                <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                  {tier.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div> */}
        {/* Enterprise Fine Print */}
        <p className="mt-4 w-full text-center text-sm text-gray-500">
          Enterprise plan: custom quote, applicants should email{' '}
          <a href="mailto:info@savrleafdeals.com" className="text-green-600 underline">
            info@savrleafdeals.com
          </a>
        </p>

        {/* Application Form */}
        <DispensaryApplicationForm />
      </div>
      <Footer />
    </>
  );
}
