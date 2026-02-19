'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dispensary } from '@/types';
import defaultDispensaryImg from '@/assets/dispensary.jpg';
import axios from 'axios';
import Modal from '@/components/Modal';
import DispensaryForm from '@/components/DispensaryForm';

interface DispensaryInfoProps {
  dispensaries: Dispensary[];
  onDispensaryUpdate?: () => void;
}

export default function DispensaryInfo({ dispensaries, onDispensaryUpdate }: DispensaryInfoProps) {
  const router = useRouter();
  const [editingDispensary, setEditingDispensary] = useState<Dispensary | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleEdit = (dispensary: Dispensary) => {
    setEditingDispensary(dispensary);
    setShowEditModal(true);
  };

  const handleSave = async (updatedDispensary: Dispensary) => {
    setShowEditModal(false);
    setEditingDispensary(null);
    if (onDispensaryUpdate) {
      onDispensaryUpdate();
    }
  };

  const handleCancel = () => {
    setShowEditModal(false);
    setEditingDispensary(null);
  };

  if (!dispensaries || dispensaries.length === 0) {
    return <p className="text-gray-500">No dispensaries found.</p>;
  }

  if (dispensaries.length === 1) {
    const dispensary = dispensaries[0];
    // const imageSrc = dispensary.images?.[0] || defaultDispensaryImg.src;
    const imageSrc = defaultDispensaryImg.src;

    return (
      <>
        <div className="flex justify-center">
          <DispensaryCard 
            dispensary={dispensary} 
            imageSrc={imageSrc} 
            isActive={dispensary.isActive} 
            isPurchased={dispensary.isPurchased} 
            skuLimit={dispensary.skuLimit} 
            usedSkus={dispensary.usedSkus}
            onEdit={handleEdit}
            onViewDetails={(id) => router.push(`/partner-dashboard/dispensary/${id}`)}
          />
        </div>
        {showEditModal && editingDispensary && (
          <Modal isOpen={showEditModal} onClose={handleCancel}>
            <DispensaryForm
              initialData={editingDispensary}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </Modal>
        )}
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 px-2 sm:px-4 py-4 sm:py-6 auto-rows-fr">
        {dispensaries.map((dispensary, index) => {
          const imageSrc = dispensary.images?.[0] || defaultDispensaryImg.src;
          return (
            <div key={index} className="h-full min-w-0">
              <DispensaryCard 
                dispensary={dispensary} 
                imageSrc={imageSrc} 
                isActive={dispensary.isActive} 
                isPurchased={dispensary.isPurchased} 
                skuLimit={dispensary.skuLimit} 
                usedSkus={dispensary.usedSkus}
                onEdit={handleEdit}
                onViewDetails={(id) => router.push(`/partner-dashboard/dispensary/${id}`)}
              />
            </div>
          );
        })}
      </div>
      {showEditModal && editingDispensary && (
        <Modal isOpen={showEditModal} onClose={handleCancel}>
          <DispensaryForm
            initialData={editingDispensary}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </Modal>
      )}
    </>
  );
}

function DispensaryCard({
  dispensary,
  imageSrc,
  isActive,
  isPurchased,
  skuLimit,
  usedSkus,
  onEdit,
  onViewDetails,
}: {
  dispensary: Dispensary;
  imageSrc: string;
  isActive: boolean | undefined;
  isPurchased: boolean;
  skuLimit: number;
  usedSkus: number;
  onEdit: (dispensary: Dispensary) => void;
  onViewDetails: (id: string) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const handleCopyEmail = async () => {
    if (dispensary.subPartnerEmail) {
      try {
        await navigator.clipboard.writeText(dispensary.subPartnerEmail);
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
      } catch (err) {
        console.error('Failed to copy email:', err);
      }
    }
  };

  const handleCopyPassword = async () => {
    if (dispensary.subPartnerPassword) {
      try {
        await navigator.clipboard.writeText(dispensary.subPartnerPassword);
        setCopiedPassword(true);
        setTimeout(() => setCopiedPassword(false), 2000);
      } catch (err) {
        console.error('Failed to copy password:', err);
      }
    }
  };
  const handlePurchaseSubscription = async () => {
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/create-subscription-session`, { subscriptionId: dispensary.subscription });
      const { url } = res.data;
      window.location.href = url;
    } catch (error) {
      console.error('Error purchasing subscription', error);
    }
  };

  const purchaseExtraPlan = async () => {
    try {
      const tier = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/subscription-tiers/tier-by-name/extra`);
      const subscription = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions`, { user: dispensary.user, tier: tier.data._id, status: 'pending', startDate: new Date(), metadata: { source: 'extra_plan', dispensaryId: dispensary._id } }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/create-extra-plan-session`, { dispensaryId: dispensary._id, subscriptionId: subscription.data._id }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log(res.data);
      const { url } = res.data;
      window.location.href = url;
    } catch (error) {
      console.error('Error purchasing extra plan', error);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons or links
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }
    onViewDetails(dispensary._id);
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`w-full h-full bg-white rounded-2xl shadow-lg p-3 sm:p-6 flex flex-col hover:shadow-xl hover:-translate-y-1 transition-transform duration-300 overflow-hidden max-w-[500px] min-w-0 cursor-pointer ${isActive && skuLimit > 0 ? 'border-2 border-green-500' : 'border-2 border-red-500'}`}
    >
      {/* Logo & Name */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 mb-4 min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {dispensary.logo ? (
            <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
              <img
                src={dispensary.logo}
                alt={`${dispensary.name} logo`}
                className="h-full w-full object-contain"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-400 font-semibold flex-shrink-0">
              No Logo
            </div>
          )}
          <h2 className="text-base sm:text-xl font-extrabold text-orange-700 truncate min-w-0">{dispensary.name}</h2>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isActive && skuLimit > 0 ? (
            <span className="text-xs text-green-500 bg-green-100 text-green-700 px-2 py-1 rounded-full text-center whitespace-nowrap">({usedSkus} / {skuLimit + (dispensary.additionalSkuLimit ? dispensary.additionalSkuLimit : 0)})</span>
          ) : (
            <span className="text-xs text-red-500 bg-red-100 text-red-700 px-2 py-1 rounded-full whitespace-nowrap">Inactive</span>
          )}
          <button
            onClick={() => onEdit(dispensary)}
            className="text-orange-600 hover:text-orange-700 p-1 rounded transition"
            title="Edit dispensary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Large Image */}
      <div className="h-44 w-full rounded-xl overflow-hidden mb-4">
        <img
          src={dispensary.images?.[0] || defaultDispensaryImg.src}
          alt={dispensary.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Location & Description */}
      {dispensary.address && (
        <p className="text-xs sm:text-sm text-gray-600 mb-3 break-words">
          {dispensary.address.street1}
          {dispensary.address.street2 && `, ${dispensary.address.street2}`},{' '}
          {dispensary.address.city}, {dispensary.address.state} {dispensary.address.zipCode}
        </p>
      )}
      {dispensary.description && (
        <p className="text-xs text-gray-500 mb-4 line-clamp-3 italic break-words">
          {dispensary.description || 'No description available.'}
        </p>
      )}

      {/* display sub partner email and password if available */}
      {dispensary.subPartnerEmail && dispensary.subPartnerPassword && (
        <div className="min-w-0 break-words mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start justify-between gap-2 mb-2">
            <strong className="font-semibold text-gray-700 text-sm">Additional Location Email:</strong>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopyEmail();
              }}
              className="flex-shrink-0 p-1.5 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
              title={copiedEmail ? 'Copied!' : 'Copy email'}
            >
              {copiedEmail ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
          <span className="break-all text-sm text-gray-800 font-mono">{dispensary.subPartnerEmail}</span>
        </div>
      )}
      {dispensary.subPartnerPassword && (
        <div className="min-w-0 break-words mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start justify-between gap-2 mb-2">
            <strong className="font-semibold text-gray-700 text-sm">Additional Location Password:</strong>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPassword(!showPassword);
                }}
                className="p-1.5 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyPassword();
                }}
                className="p-1.5 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                title={copiedPassword ? 'Copied!' : 'Copy password'}
              >
                {copiedPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <span className="break-all text-sm text-gray-800 font-mono">
            {showPassword ? dispensary.subPartnerPassword : '•'.repeat(dispensary.subPartnerPassword.length)}
          </span>
        </div>
      )}

      {/*increase sku limit by 10 by purchasing extra plan button */}
      {/* {(
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4">
            <div className="min-w-0">
              <strong className="font-semibold text-gray-700 text-xs sm:text-sm">Extra plan Limit:</strong>
              <span className="text-xs sm:text-sm text-gray-500 ml-2 break-words">{dispensary.additionalSkuLimit ? dispensary.additionalSkuLimit : 0} / { dispensary.extraLimit ? dispensary.extraLimit : 0} </span>
            </div>
            <button onClick={purchaseExtraPlan} disabled={!isPurchased} className="bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs px-2 py-2 rounded-lg shadow-md transition focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0 w-full sm:w-auto">Purchase Extra Sku +1</button>
          </div>
        </>
      )} */}

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs text-gray-500 mb-4 min-w-0">
        {dispensary.type === 'main' && (
          <div className="min-w-0 break-words">
            <strong className="font-semibold text-gray-700">Type:</strong> <br />
            <span className="break-words">Main Location</span>
          </div>
        )}
        {dispensary.type === 'additional' && (
          <div className="min-w-0 break-words">
            <strong className="font-semibold text-gray-700">Type:</strong> <br />
            <span className="break-words">Additional Location</span>
          </div>
        )}
        {dispensary.phoneNumber && (
          <div className="min-w-0 break-words">
            <strong className="font-semibold text-gray-700">Phone:</strong> <br />
            <span className="break-all">{dispensary.phoneNumber}</span>
          </div>
        )}
        {dispensary.websiteUrl && (
          <div className="min-w-0 break-words">
            <strong className="font-semibold text-gray-700">Website:</strong> <br />
            <a
              href={dispensary.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:underline break-all"
            >
              {dispensary.websiteUrl}
            </a>
          </div>
        )}
        {dispensary.status && (
          <div className="min-w-0">
            <strong className="font-semibold text-gray-700">Status:</strong> <br />
            <span
              className={`inline-block mt-1 px-2 py-0.5 rounded-full font-semibold text-xs whitespace-nowrap ${dispensary.status === 'approved'
                ? 'bg-green-100 text-green-700'
                : dispensary.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
                }`}
            >
              {dispensary.status.charAt(0).toUpperCase() + dispensary.status.slice(1)}
            </span>
          </div>
        )}
        {!isPurchased && (
          <div className="min-w-0 break-words">
            <strong className="font-semibold text-gray-700">Subscription:</strong> <br />
            <span className="text-xs text-gray-500 break-words">Not purchased</span>
          </div>
        )}
        {dispensary.licenseNumber && (
          <div className="min-w-0 break-words">
            <strong className="font-semibold text-gray-700">License #:</strong> <br />
            <span className="break-all">{dispensary.licenseNumber}</span>
          </div>
        )}
      </div>

      {/* Amenities */}
      {dispensary.amenities && dispensary.amenities.length > 0 && (
        <div className="mb-4 min-w-0">
          <strong className="font-semibold text-gray-700 text-xs sm:text-sm">Amenities:</strong>
          <ul className="list-disc list-inside text-gray-600 text-xs mt-1 max-h-20 overflow-auto break-words">
            {dispensary.amenities.map((amenity, idx) => (
              <li key={idx} className="break-words">{amenity}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Hours */}
      {dispensary.hours && (
        <div className="mb-4 min-w-0">
          <strong className="font-semibold text-gray-700 text-xs sm:text-sm">Hours:</strong>
          <ul className="list-none text-gray-600 text-xs mt-1 max-h-28 overflow-auto break-words">
            {Object.entries(dispensary.hours).map(([day, hours]) => (
              <li key={day} className="break-words">
                <span className="capitalize font-semibold">{day}:</span> <span className="break-words">{hours}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Weekly Promotions */}
      {dispensary.weeklyPromotions && Object.keys(dispensary.weeklyPromotions).length > 0 && (
        <div className="mb-4 min-w-0">
          <strong className="font-semibold text-gray-700 text-xs sm:text-sm">Weekly Promotions:</strong>
          <ul className="list-none text-gray-600 text-xs mt-1 max-h-28 overflow-auto break-words">
            {Object.entries(dispensary.weeklyPromotions).map(([day, promo]) => (
              <li key={day} className="break-words">
                <span className="capitalize font-semibold">{day}:</span> <span className="break-words">{promo}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Accessories & Merch */}
      {dispensary.accessoriesMerch && dispensary.accessoriesMerch.trim() !== '' && (
        <div className="mb-4 min-w-0">
          <strong className="font-semibold text-gray-700 text-xs sm:text-sm">Accessories & Merch:</strong>
          <p className="text-gray-600 text-xs mt-1 whitespace-pre-line break-words">{dispensary.accessoriesMerch}</p>
        </div>
      )}
      <div className="mt-auto pt-4">
        {!dispensary.isPurchased && (
          <button onClick={handlePurchaseSubscription} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md transition focus:outline-none focus:ring-2 focus:ring-orange-400">Purchase Subscription</button>
        )}
      </div>
    </div>
  );
}
