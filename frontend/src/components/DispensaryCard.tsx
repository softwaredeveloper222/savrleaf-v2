'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Dispensary } from '@/types';
import defaultDispensaryImg from '../assets/dispensary.jpg';

export default function DispensaryCard({ dispensary }: { dispensary: Dispensary }) {
  const router = useRouter();
  // const imageSrc = dispensary.images?.[0] || defaultDispensaryImg.src;
  const imageSrc = defaultDispensaryImg.src;

  const handleCardClick = () => {
    router.push(`/dispensary/${dispensary._id}`);
  };

  const handleViewDeals = () => {
    router.push(`/dispensary/${dispensary._id}?showDeals=true`);
  };

  return (
    <>
      {/* Card */}
      <div
        className="cursor-pointer bg-gray-50 shadow-lg rounded-2xl p-4 transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl min-h-[280px] w-full flex flex-col justify-between"
      >
        <div onClick={handleCardClick}>
          {/* Logo and name */}
          <div className="flex items-center mb-4 gap-3">
            {dispensary.logo ? (
              <div className="h-12 w-12 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src={dispensary.logo}
                  alt={`${dispensary.name} logo`}
                  width={48}
                  height={48}
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-400 font-semibold flex-shrink-0">
                No Logo
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold">{dispensary.name}</h3>
                {(dispensary as { isGeneric?: boolean }).isGeneric && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-200 text-slate-700 rounded">Generic</span>
                )}
              </div>
            </div>
          </div>

          {/* Large image */}
          <div className="h-40 w-full rounded-xl overflow-hidden mb-4">
            <Image
              src={imageSrc}
              alt={dispensary.name}
              width={400}
              height={160}
              className="h-full w-full object-cover"
            />
          </div>

          <p className="text-sm text-gray-600">
            {dispensary.address.city}, {dispensary.address.state}
          </p>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {dispensary.description || 'No description available.'}
          </p>
        </div>

        <div className="text-xs text-gray-400 mt-4">
          License: {dispensary.licenseNumber || 'N/A'}
        </div>
        <br/>
        <div className="flex justify-center space-x-4 mb-2">
          <button
            className="px-6 py-2 rounded-full text-sm font-semibold transition cursor-pointer bg-orange-600 text-white shadow-md"
            onClick={() => {
              if (dispensary.type) {
                handleViewDeals();
              } else {
                const destination = dispensary.address.street1
                  ? `${dispensary.address.street1}, ${dispensary.address.city}, ${dispensary.address.state} ${dispensary.address.zipCode || ''}`
                  : `${dispensary.address.city}, ${dispensary.address.state}`;
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`, '_blank');
              }
            }}
          >
            {dispensary.type ? 'View Discounts' : 'Get Directions'}
          </button>
        </div>

      </div>
    </>
  );
}
