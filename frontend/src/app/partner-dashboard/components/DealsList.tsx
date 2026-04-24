'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import Image from 'next/image';
import defaultDealImg from '@/assets/deal.jpg';
import { Deal, Dispensary } from '@/types';
import { useRouter } from 'next/navigation';

interface DealsListProps {
  deals: Deal[];
  setDeals: (deals: Deal[]) => void;
  onEdit?: (deal: Deal) => void;
  dispensaries: Dispensary[];
}

export default function DealsList({ deals, setDeals, onEdit, dispensaries }: DealsListProps) {
  const [selectedDispensaryId, setSelectedDispensaryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const router = useRouter();
  // Filter deals based on search query
  const searchFilteredDeals = useMemo(() => {
    if (!searchQuery.trim()) {
      return deals;
    }

    const query = searchQuery.toLowerCase().trim();
    return deals.filter(deal => {
      // Search in title
      if (deal.title?.toLowerCase().includes(query)) return true;

      // Search in description
      if (deal.description?.toLowerCase().includes(query)) return true;

      // Search in brand
      if (deal.brand?.toLowerCase().includes(query)) return true;

      // Search in tags
      if (deal.tags?.some(tag => tag.toLowerCase().includes(query))) return true;

      // Search in category
      if (deal.category?.toLowerCase().includes(query)) return true;

      // Search in subcategory
      if (deal.subcategory?.toLowerCase().includes(query)) return true;

      // Search in strain
      if (deal.strain?.toLowerCase().includes(query)) return true;

      // Search in dispensary name
      if (typeof deal.dispensary !== 'string' && deal.dispensary?.name?.toLowerCase().includes(query)) return true;

      return false;
    });
  }, [deals, searchQuery]);

  // Group deals by dispensary (after search filter)
  const groupedDeals = useMemo(() => {
    const groups: Record<string, Deal[]> = {};

    searchFilteredDeals.forEach((deal) => {
      const dispensaryId = typeof deal.dispensary === 'string'
        ? deal.dispensary
        : deal.dispensary._id;

      if (!groups[dispensaryId]) {
        groups[dispensaryId] = [];
      }
      groups[dispensaryId].push(deal);
    });

    return groups;
  }, [searchFilteredDeals]);

  // Get dispensary name by ID
  const getDispensaryName = (dispensaryId: string): string => {
    if (dispensaryId === 'all') return 'All Dispensaries';
    const dispensary = dispensaries.find(d => d._id === dispensaryId);
    if (!dispensary) {
      // Try to find in deals
      const deal = deals.find(d => {
        const id = typeof d.dispensary === 'string' ? d.dispensary : d.dispensary._id;
        return id === dispensaryId;
      });
      if (deal && typeof deal.dispensary !== 'string') {
        return deal.dispensary.name;
      }
      return 'Unknown Dispensary';
    }
    return dispensary.name;
  };

  // Filter deals based on selected dispensary (after search filter)
  const filteredDeals = useMemo(() => {
    if (selectedDispensaryId === 'all') {
      return searchFilteredDeals;
    }
    return searchFilteredDeals.filter(deal => {
      const dispensaryId = typeof deal.dispensary === 'string'
        ? deal.dispensary
        : deal.dispensary._id;
      return dispensaryId === selectedDispensaryId;
    });
  }, [searchFilteredDeals, selectedDispensaryId]);

  // Get unique dispensary IDs from search filtered deals
  const dispensaryIds = useMemo(() => {
    const ids = new Set<string>();
    searchFilteredDeals.forEach(deal => {
      const id = typeof deal.dispensary === 'string'
        ? deal.dispensary
        : deal.dispensary._id;
      ids.add(id);
    });
    return Array.from(ids);
  }, [searchFilteredDeals]);

  if (deals.length === 0) {
    return <p className="text-gray-500">No discounts found.</p>;
  }

  const handleDelete = async (dealId: string) => {
    if (!confirm('Are you sure you want to delete this discount?')) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/deals/${dealId}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (data.success) {
        setDeals(deals.filter((deal) => deal._id !== dealId));
      } else {
        alert(data.message || 'Failed to delete discount.');
      }
    } catch (err) {
      console.error('Error deleting discount:', err);
      alert('Error deleting discount.');
    }
  };

  // const displayAccessType = (type: string) => {
  //   if (type === 'both') return 'Med/Rec';
  //   return type.charAt(0).toUpperCase() + type.slice(1);
  // };

  const renderDealCard = (deal: Deal) => {
    const startDate = deal.startDate
      ? format(new Date(deal.startDate), 'MMM dd, yyyy')
      : 'N/A';
    const endDate = deal.endDate
      ? format(new Date(deal.endDate), 'MMM dd, yyyy')
      : 'N/A';

    const isActive =
      !!deal.isActive &&
      !!deal.startDate &&
      !!deal.endDate &&
      new Date(deal.startDate) <= new Date() &&
      new Date(deal.endDate) >= new Date();

    const effectiveOriginalPrice =
      typeof deal.estimatedOriginalPrice === 'number'
        ? deal.estimatedOriginalPrice
        : typeof deal.originalPrice === 'number'
          ? deal.originalPrice
          : undefined;

    const savingsAmount =
      typeof deal.estimatedSavings === 'number'
        ? deal.estimatedSavings
        : effectiveOriginalPrice && deal.salePrice
          ? Math.max(0, effectiveOriginalPrice - deal.salePrice)
          : undefined;

    const savingsPercent =
      typeof deal.discountTier === 'number'
        ? deal.discountTier
        : typeof deal.discountPercent === 'number'
          ? Math.round(deal.discountPercent)
          : effectiveOriginalPrice && deal.salePrice && effectiveOriginalPrice > 0
            ? Math.round((1 - deal.salePrice / effectiveOriginalPrice) * 100)
            : undefined;

    return (
      <div
        key={deal._id}
        className={`bg-white shadow-lg rounded-2xl p-4 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-transform duration-200 border border-[#e0e0e0] ${isActive ? 'border-green-500' : 'border-red-500'}`}
      // Make the entire card clickable to open deal purchase link or dispensary website in a new tab
      onClick={() => {
        if (deal?.deal_purchase_link) {
          window.open(deal.deal_purchase_link, '_blank', 'noopener,noreferrer');
        } else {
          const dispensary = typeof deal?.dispensary === 'object' ? deal.dispensary : null;
          if (dispensary?.websiteUrl) {
            window.open(dispensary.websiteUrl, '_blank', 'noopener,noreferrer');
          }
        }
      }}
      style={{ cursor: (deal?.deal_purchase_link || (typeof deal?.dispensary === 'object' && deal.dispensary?.websiteUrl)) ? 'pointer' : 'default' }}
      >
        <div className="h-50 w-full rounded-xl overflow-hidden mb-4">
          <Image
            src={deal.images?.[0] || defaultDealImg.src}
            alt={deal.title || 'Discount'}
            width={400}
            height={160}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold mb-1">{deal.title || 'Discount'}</h3>
            <p className="text-sm text-gray-600 line-clamp-2">{deal.description}</p>
          </div>
          <div>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>

            {/* <span className={`px-2 py-1 rounded-full text-xs font-semibold ml-2 ${!deal.manuallyActivated ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {!deal.manuallyActivated ? 'Pending' : 'Approved'}
            </span> */}
          </div>
        </div>

        <div className="mt-3 flex justify-between items-end text-sm">
          <div className="flex flex-col">
            {typeof effectiveOriginalPrice === 'number' && effectiveOriginalPrice > deal.salePrice && (
              <span className="text-xs text-gray-400 line-through">
                Est. price ${effectiveOriginalPrice.toFixed(2)}
              </span>
            )}
            <span className="text-green-600 font-semibold">
              ${Number(deal.salePrice).toFixed(2)}
            </span>
            {deal.sizeOrStrength && (
              <span className="text-xs text-gray-600 font-medium mt-0.5">
                {deal.sizeOrStrength}
              </span>
            )}
          </div>
          {(typeof savingsPercent === 'number' || typeof savingsAmount === 'number') && (
            <div className="flex flex-col items-end text-xs text-gray-700">
              {typeof savingsPercent === 'number' && (
                <span className="font-semibold text-green-700">
                  {savingsPercent}% off
                </span>
              )}
              {typeof savingsAmount === 'number' && savingsAmount > 0 && (
                <span>Save ${savingsAmount.toFixed(2)}</span>
              )}
            </div>
          )}
          
          {/* <div className="mt-2 flex flex-wrap gap-2">
            {accessTypes.map((type: string) => (
              <span
                key={type}
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${deal.accessType === 'medical'
                  ? 'bg-green-100 text-green-700'
                  : deal.accessType === 'recreational'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-200 text-gray-700'
                  }`}
              >
                {displayAccessType(deal.accessType)}
              </span>
            ))}
          </div> */}
        </div>

        <div className="mt-3 text-xs text-gray-500 space-y-1">
          <p><strong>Start:</strong> {startDate}</p>
          <p><strong>End:</strong> {endDate}</p>
          {deal.tags && deal.tags.length > 0 && (
            <p><strong>Tags:</strong> {deal.tags.join(', ')}</p>
          )}
          {selectedDispensaryId === 'all' && deal.dispensary && (
            <p>
              <strong>Dispensary:</strong>{' '}
              {typeof deal.dispensary === 'string'
                ? deal.dispensary
                : deal.dispensary.name}
            </p>
          )}
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click
              onEdit && onEdit(deal);
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-400 text-white py-2 rounded-lg text-sm font-semibold shadow-md transition cursor-pointer"
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6 6-9 3 3-9z" />
            </svg>
            Edit
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click
              handleDelete(deal._id);
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 text-white py-2 rounded-lg text-sm font-semibold shadow-md transition cursor-pointer"
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4m-4 0a1 1 0 00-1 1v1h6V4a1 1 0 00-1-1m-4 0h4" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Search and Filter Controls */}
      <div className="mb-6 space-y-4">
        {/* Search Input */}
        <div>
          <label htmlFor="deal-search" className="block text-sm font-medium text-gray-700 mb-2">
            Search Discounts
          </label>
          <div className="relative">
            <input
              id="deal-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, description, brand, tags, category..."
              className="w-full border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 pl-10 rounded-lg"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-1 text-sm text-gray-500">
              Found {searchFilteredDeals.length} {searchFilteredDeals.length === 1 ? 'discount' : 'discounts'} matching &quot;{searchQuery}&quot;
            </p>
          )}
        </div>

        {/* Dispensary Filter Dropdown */}
        <div>
          <label htmlFor="dispensary-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Dispensary
          </label>
          <select
            id="dispensary-filter"
            value={selectedDispensaryId}
            onChange={(e) => setSelectedDispensaryId(e.target.value)}
            className="border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 rounded-lg min-w-[250px]"
          >
            <option value="all">All Dispensaries ({searchFilteredDeals.length} {searchFilteredDeals.length === 1 ? 'discount' : 'discounts'})</option>
            {dispensaryIds.map((dispensaryId) => {
              const count = groupedDeals[dispensaryId]?.length || 0;
              return (
                <option key={dispensaryId} value={dispensaryId}>
                  {getDispensaryName(dispensaryId)} ({count} {count === 1 ? 'discount' : 'discounts'})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Grouped Deals Display */}
      {searchFilteredDeals.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500">
            {searchQuery
              ? `No discounts found matching "${searchQuery}"${selectedDispensaryId !== 'all' ? ` for ${getDispensaryName(selectedDispensaryId)}` : ''}.`
              : 'No discounts found.'}
          </p>
        </div>
      ) : selectedDispensaryId === 'all' ? (
        // Show all deals grouped by dispensary
        <div className="space-y-8">
          {Object.entries(groupedDeals).map(([dispensaryId, dispensaryDeals]) => (
            <div key={dispensaryId}>
              <h3 className="text-2xl font-bold text-orange-700 mb-4 pb-2 border-b-2 border-orange-200">
                {getDispensaryName(dispensaryId)}
                <span className="ml-2 text-lg font-normal text-gray-500">
                  ({dispensaryDeals.length} {dispensaryDeals.length === 1 ? 'discount' : 'discounts'})
                </span>
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {dispensaryDeals.map((deal) => renderDealCard(deal))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Show only selected dispensary's deals
        <div>
          <h3 className="text-2xl font-bold text-orange-700 mb-4 pb-2 border-b-2 border-orange-200">
            {getDispensaryName(selectedDispensaryId)}
            <span className="ml-2 text-lg font-normal text-gray-500">
              ({filteredDeals.length} {filteredDeals.length === 1 ? 'discount' : 'discounts'})
            </span>
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDeals.map((deal) => renderDealCard(deal))}
          </div>
        </div>
      )}
    </div>
  );
}
