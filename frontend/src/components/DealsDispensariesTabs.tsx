'use client';

import { Deal, Dispensary } from '@/types';
import DealCard from './DealCard';
import DispensaryCard from './DispensaryCard';

interface Props {
  deals: Deal[];
  dispensaries: Dispensary[];
  loading?: boolean;
  activeTab: 'deals' | 'dispensaries';
  setActiveTab: (tab: 'deals' | 'dispensaries') => void;
  userLocation?: { lat: number; lng: number };
}

export default function DealsDispensariesTabs({ deals, dispensaries, loading = false, activeTab, setActiveTab, userLocation }: Props) {
  const renderSkeletonCard = () => (
    <div className="animate-pulse bg-gray-100 rounded-xl h-40 w-full" />
  );

  return (
    <div className="max-w-7xl mx-auto px-3 my-10">
      <div className="flex space-x-4 mb-6">
        <button
          className={`px-6 py-2 rounded-full text-sm font-semibold transition cursor-pointer ${
            activeTab === 'deals'
              ? 'bg-orange-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('deals')}
        >
          Discounts
        </button>
        <button
          className={`px-6 py-2 rounded-full text-sm font-semibold transition cursor-pointer ${
            activeTab === 'dispensaries'
              ? 'bg-orange-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('dispensaries')}
        >
          Dispensaries
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-4">
              {renderSkeletonCard()}
              <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
            </div>
          ))
        ) : activeTab === 'deals' ? (
          deals.length ? (
            deals.map((deal, index) => {
              // Handle Mongoose populated documents that may have _doc wrapper
              const dealData = typeof deal === 'object' && '_doc' in deal 
                ? (deal as { _doc: Deal })._doc 
                : deal;
              return (
                <DealCard 
                  key={dealData._id || `deal-${index}-${dealData.title || 'unknown'}`} 
                  deal={dealData}
                  userLocation={userLocation}
                />
              );
            })
          ) : (
            <p key="no-deals" className="col-span-full text-center text-gray-500 py-8">No discounts found.</p>
          )
        ) : dispensaries.length ? (
          dispensaries.map((dispensary, index) => (
            <DispensaryCard 
              key={dispensary._id || `dispensary-${index}-${dispensary.name || 'unknown'}`} 
              dispensary={dispensary} 
            />
          ))
        ) : (
          <p key="no-dispensaries" className="col-span-full text-center text-gray-500 py-8">No dispensaries found.</p>
        )}
      </div>
    </div>
  );
}
