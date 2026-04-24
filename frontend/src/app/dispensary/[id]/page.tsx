'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { Deal, Dispensary } from '@/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DealCard from '@/components/DealCard';
import WeeklyPromotions from '@/components/WeeklyPromotions';
import AccessoriesMerch from '@/components/AccessoriesMerch';
import defaultDispensaryImg from '@/assets/dispensary.jpg';

export default function DispensaryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const showDeals = searchParams.get('showDeals') === 'true';
  const [dispensary, setDispensary] = useState<Dispensary | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch dispensary by id (works for both real and generic)
        const dispRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/dispensaries/${id}`);
        if (dispRes.data?.success && dispRes.data?.dispensary) {
          setDispensary(dispRes.data.dispensary);
        } else {
          setError('Dispensary not found');
          setLoading(false);
          return;
        }

        // Deals only exist for real dispensaries; skip for generic
        if (!(dispRes.data.dispensary as { isGeneric?: boolean }).isGeneric) {
          const dealsRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/deals`, {
            params: { dispensaryId: id, limit: 200 },
          });
          setDeals(dealsRes.data?.deals || []);
        } else {
          setDeals([]);
        }
      } catch (err) {
        console.error('Error fetching dispensary data:', err);
        setError('Dispensary not found');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !dispensary) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center py-20">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Dispensary Not Found</h1>
              <p className="text-gray-600 mb-6">{error || 'The dispensary you are looking for does not exist.'}</p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // const imageSrc = dispensary.images?.[0] || defaultDispensaryImg.src;
  const imageSrc = defaultDispensaryImg.src;
  const isGeneric = (dispensary as { isGeneric?: boolean }).isGeneric;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-6">
          {/* Dispensary Info Section */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
            <div className="flex flex-col md:flex-row">
              {/* Image */}
              <div className="w-full md:w-1/3 h-64 md:h-auto">
                <Image
                  src={imageSrc}
                  alt={dispensary.name}
                  width={600}
                  height={400}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 p-6 md:p-8">
                <div className="flex items-start gap-4 mb-4">
                  {dispensary.logo && (
                    <div className="h-16 w-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-200">
                      <Image
                        src={dispensary.logo}
                        alt={`${dispensary.name} logo`}
                        width={64}
                        height={64}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h1 className="text-3xl font-bold text-gray-900">{dispensary.name}</h1>
                      {(dispensary as { isGeneric?: boolean }).isGeneric && (
                        <span className="px-2 py-1 text-xs font-semibold bg-slate-200 text-slate-700 rounded">Generic</span>
                      )}
                    </div>
                      {/* {dispensary?.type ? "" : "Nutural / Basic"} */}
                    {dispensary.accessType && (
                      <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium mb-2">
                        {dispensary.accessType.replace('/', ' & ')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3 text-gray-700">
                  <p>
                    <strong>Address:</strong> {dispensary.address.street1}
                    {dispensary.address.street2 && `, ${dispensary.address.street2}`}
                    <br />
                    {dispensary.address.city}, {dispensary.address.state} {dispensary.address.zipCode}
                  </p>

                  {dispensary.phoneNumber && (
                    <p>
                      <strong>Phone:</strong>{' '}
                      <a href={`tel:${dispensary.phoneNumber}`} className="text-orange-600 hover:underline">
                        {dispensary.phoneNumber}
                      </a>
                    </p>
                  )}

                  {(dispensary as { email?: string }).email && (
                    <p>
                      <strong>Email:</strong>{' '}
                      <a href={`mailto:${(dispensary as { email?: string }).email}`} className="text-orange-600 hover:underline">
                        {(dispensary as { email?: string }).email}
                      </a>
                    </p>
                  )}

                  {dispensary.websiteUrl && (
                    <p>
                      <strong>Website:</strong>{' '}
                      <a
                        href={
                          dispensary.type
                            ? dispensary.websiteUrl
                            : `https://www.google.com/maps/@${Number(dispensary.coordinates.coordinates[1])},${Number(dispensary.coordinates.coordinates[0])},15z`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:underline"
                      >
                        {dispensary.name}
                      </a>
                    </p>
                  )}

                  {dispensary.description && (
                    <p className="pt-2 border-t">
                      <strong>Description:</strong> {dispensary.description}
                    </p>
                  )}

                  {dispensary.amenities && dispensary.amenities.length > 0 && (
                    <p>
                      <strong>Amenities:</strong> {dispensary.amenities.join(', ')}
                    </p>
                  )}

                  {(() => {
                    const destination = dispensary.address.street1
                      ? `${dispensary.address.street1}, ${dispensary.address.city}, ${dispensary.address.state} ${dispensary.address.zipCode || ''}`
                      : `${dispensary.address.city}, ${dispensary.address.state}`;
                    return (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-4 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                      >
                        Get Directions
                      </a>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Promotions - only for purchased dispensaries with promotions */}
          {dispensary.isPurchased &&
            dispensary.weeklyPromotions &&
            Object.values(dispensary.weeklyPromotions).some((v) => v && v.trim() !== '') && (
              <WeeklyPromotions weeklyPromotions={dispensary.weeklyPromotions} />
          )}

          {/* Accessories & Merch - only for purchased dispensaries with content */}
          {dispensary.isPurchased &&
            dispensary.accessoriesMerch &&
            dispensary.accessoriesMerch.trim() !== '' && (
              <AccessoriesMerch text={dispensary.accessoriesMerch} />
          )}

          {/* Deals Section - only shown when showDeals=true */}
          {showDeals && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Discounts ({deals.length})
              </h2>

              {deals.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {deals.map((deal) => (
                    <DealCard key={deal._id} deal={deal} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <p className="text-gray-600 text-lg">
                    {isGeneric ? 'Generic dispensaries do not list discounts here.' : 'No discounts available at this dispensary at the moment.'}
                  </p>
                  {isGeneric && dispensary.websiteUrl ? (
                    <a
                      href={
                            dispensary.type
                              ? dispensary.websiteUrl
                              : `https://www.google.com/maps/@${Number(dispensary.coordinates.coordinates[1])},${Number(dispensary.coordinates.coordinates[0])},15z`
                          }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-4 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                    >
                      Visit Website
                    </a>
                  ) : (
                    <div></div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}


