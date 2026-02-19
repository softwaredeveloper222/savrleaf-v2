'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import { Dispensary, Deal, User } from '@/types';
import defaultDispensaryImg from '@/assets/dispensary.jpg';
import { format } from 'date-fns';
import defaultDealImg from '@/assets/deal.jpg';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Modal from '@/components/Modal';
import DealForm from '@/components/DealForm';

function DispensaryDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const [dispensary, setDispensary] = useState<Dispensary | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDealForm, setShowDealForm] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [dispensaries, setDispensaries] = useState<Dispensary[]>([]);

  useEffect(() => {
    const fetchDispensaryDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.replace('/partner-login');
          return;
        }

        const dispensaryId = params.id as string;

        // Fetch all dispensaries and find the one we need
        const dispensariesRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/partner/dashboard`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const foundDispensary = dispensariesRes.data.dispensaries.find(
          (d: Dispensary) => d._id === dispensaryId
        );

        if (!foundDispensary) {
          setError('Dispensary not found');
          setLoading(false);
          return;
        }

        setDispensary(foundDispensary);

        // Fetch deals for this dispensary and user data
        const dealsRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/partner/dashboard`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setUser(dealsRes.data.user);
        setDispensaries(dealsRes.data.dispensaries);

        // Filter deals for this dispensary
        const dispensaryDeals = dealsRes.data.deals.filter((deal: Deal) => {
          const dealDispensaryId = typeof deal.dispensary === 'string' 
            ? deal.dispensary 
            : deal.dispensary._id;
          return dealDispensaryId === dispensaryId;
        });
        setDeals(dispensaryDeals);
      } catch (err: any) {
        console.error('Error fetching dispensary details:', err);
        setError(err.response?.data?.message || 'Failed to load dispensary details');
      } finally {
        setLoading(false);
      }
    };

    fetchDispensaryDetails();
  }, [params.id, router]);

  const handleAddDeal = () => {
    setSelectedDeal(null);
    setShowDealForm(true);
  };

  const handleEditDeal = (deal: Deal) => {
    setSelectedDeal(deal);
    setShowDealForm(true);
  };

  const handleSaveDeal = async (savedDeal: Deal) => {
    // Refresh deals list
    try {
      const token = localStorage.getItem('token');
      const dispensaryId = params.id as string;
      const dealsRes = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/partner/dashboard`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Filter deals for this dispensary
      const dispensaryDeals = dealsRes.data.deals.filter((deal: Deal) => {
        const dealDispensaryId = typeof deal.dispensary === 'string' 
          ? deal.dispensary 
          : deal.dispensary._id;
        return dealDispensaryId === dispensaryId;
      });
      setDeals(dispensaryDeals);
    } catch (err) {
      console.error('Error refreshing deals:', err);
    }

    setSelectedDeal(null);
    setShowDealForm(false);
  };

  const handleCancelDealForm = () => {
    setSelectedDeal(null);
    setShowDealForm(false);
  };

  if (loading) {
    return (
      <DashboardLayout activeTab="dispensary" onTabChange={() => {}}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dispensary details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !dispensary) {
    return (
      <DashboardLayout activeTab="dispensary" onTabChange={() => {}}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Dispensary not found'}</p>
            <button
              onClick={() => router.push('/partner-dashboard?tab=dispensary')}
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2 rounded-lg"
            >
              Back to Dispensaries
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // const imageSrc = dispensary.images?.[0] || defaultDispensaryImg.src;
  const imageSrc = defaultDispensaryImg.src;

  return (
    <DashboardLayout activeTab="dispensary" onTabChange={() => {}}>
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => router.push('/partner-dashboard?tab=dispensary')}
          className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold mb-4"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dispensaries
        </button>

        {/* Dispensary Info Section */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="md:flex">
            {/* Image Section */}
            <div className="md:w-1/2 h-64 md:h-auto">
              <div className="relative w-full h-full">
                <Image
                  src={imageSrc}
                  alt={dispensary.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            {/* Info Section */}
            <div className="md:w-1/2 p-6 md:p-8">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  {dispensary.logo ? (
                    <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-orange-200">
                      <Image
                        src={dispensary.logo}
                        alt={`${dispensary.name} logo`}
                        width={64}
                        height={64}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-400 font-semibold">
                      No Logo
                    </div>
                  )}
                  <div>
                    <h1 className="text-3xl font-bold text-orange-700">{dispensary.name}</h1>
                    {dispensary.status && (
                      <span
                        className={`inline-block mt-2 px-3 py-1 rounded-full font-semibold text-sm ${
                          dispensary.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : dispensary.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {dispensary.status.charAt(0).toUpperCase() + dispensary.status.slice(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Address */}
              {dispensary.address && (
                <div className="mb-4">
                  <div className="flex items-start gap-2 text-gray-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <div>
                      <p className="font-medium">{dispensary.address.street1}</p>
                      {dispensary.address.street2 && <p>{dispensary.address.street2}</p>}
                      <p>
                        {dispensary.address.city}, {dispensary.address.state} {dispensary.address.zipCode}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {dispensary.phoneNumber && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-orange-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <a href={`tel:${dispensary.phoneNumber}`} className="hover:text-orange-600">
                      {dispensary.phoneNumber}
                    </a>
                  </div>
                )}

                {dispensary.websiteUrl && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-orange-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                      />
                    </svg>
                    <a
                      href={dispensary.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-600 hover:underline truncate"
                    >
                      {dispensary.websiteUrl}
                    </a>
                  </div>
                )}

                {dispensary.licenseNumber && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-orange-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span>License: {dispensary.licenseNumber}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-gray-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-orange-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <span>
                    {dispensary.type === 'main' ? 'Main Location' : 'Additional Location'}
                  </span>
                </div>
              </div>

              {/* Description */}
              {dispensary.description && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800 mb-2">About</h3>
                  <p className="text-gray-600">{dispensary.description}</p>
                </div>
              )}

              {/* Amenities */}
              {dispensary.amenities && dispensary.amenities.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {dispensary.amenities.map((amenity, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Hours */}
              {dispensary.hours && Object.keys(dispensary.hours).length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Hours</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(dispensary.hours).map(([day, hours]) => (
                      <div key={day} className="flex justify-between">
                        <span className="font-medium text-gray-700 capitalize">{day}:</span>
                        <span className="text-gray-600">{hours}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Weekly Promotions */}
              {dispensary.weeklyPromotions && Object.keys(dispensary.weeklyPromotions).length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Weekly Promotions</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(dispensary.weeklyPromotions).map(([day, promo]) => (
                      <div key={day} className="flex justify-between">
                        <span className="font-medium text-gray-700 capitalize">{day}:</span>
                        <span className="text-gray-600">{promo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Accessories & Merch */}
              {dispensary.accessoriesMerch && dispensary.accessoriesMerch.trim() !== '' && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Accessories & Merch</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{dispensary.accessoriesMerch}</p>
                </div>
              )}

              {/* SKU Information */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">SKU Usage:</span>
                  <span className="text-lg font-bold text-orange-600">
                    {dispensary.usedSkus} / {dispensary.skuLimit + (dispensary.additionalSkuLimit || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Deals Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-orange-700">
              Deals ({deals.length})
            </h2>
            <button
              onClick={handleAddDeal}
              className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-5 py-2 rounded-lg shadow-md transition focus:outline-none focus:ring-2 focus:ring-orange-400"
              type="button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Deal
            </button>
          </div>

          {deals.length === 0 ? (
            <div className="text-center py-12">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-gray-300 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <p className="text-gray-500 text-lg">No deals available for this dispensary</p>
              {/* <button
                onClick={handleAddDeal}
                className="mt-4 inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Deal
              </button> */}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {deals.map((deal) => {
                const dealImageSrc = deal.images?.[0] || defaultDealImg.src;
                const isActive = new Date(deal.startDate) <= new Date() && new Date(deal.endDate) >= new Date() && !deal.manuallyActivated;

                return (
                  <div
                    key={deal._id}
                    onClick={() => handleEditDeal(deal)}
                    className="bg-gray-50 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-orange-200"
                  >
                    <div className="relative h-48 w-full">
                      <Image
                        src={dealImageSrc}
                        alt={deal.title}
                        fill
                        className="object-cover"
                      />
                      {isActive && (
                        <span className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">
                        {deal.title}
                      </h3>
                      {deal.brand && (
                        <p className="text-sm text-gray-600 mb-2">Brand: {deal.brand}</p>
                      )}
                      <div className="flex items-center justify-between mb-2">
                        {deal.originalPrice && (
                          <span className="text-sm text-gray-400 line-through">
                            ${Number(deal.originalPrice).toFixed(2)}
                          </span>
                        )}
                        <span className="text-xl font-bold text-green-600">
                          ${Number(deal.salePrice).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-semibold capitalize">
                          {deal.category}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        <p>
                          {format(new Date(deal.startDate), 'MMM d, yyyy')} -{' '}
                          {format(new Date(deal.endDate), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Deal Form Modal */}
        {showDealForm && user && dispensary && (
          <Modal isOpen={true} onClose={handleCancelDealForm} maxWidth="4xl">
            <DealForm
              initialData={selectedDeal || ({
                dispensary: dispensary._id,
                manuallyActivated: false,
              } as Deal)}
              dispensaryOptions={dispensaries.map(d => ({
                _id: d._id,
                name: d.name,
                isActive: d.isActive ?? false,
                isPurchased: d.isPurchased ?? false,
              }))}
              onSave={handleSaveDeal}
              onCancel={handleCancelDealForm}
              userId={user.id || user._id}
            />
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function DispensaryDetailsPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout activeTab="dispensary" onTabChange={() => {}}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </DashboardLayout>
      }
    >
      <DispensaryDetailsContent />
    </Suspense>
  );
}

