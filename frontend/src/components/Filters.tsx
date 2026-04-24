'use client';

import { useState, useEffect } from 'react';

interface FiltersProps {
  filterValues: FilterValues;
  onFilterChange: (filters: FilterValues) => void;
  dispensaryAmenities?: string[];
  forType: 'deal' | 'dispensary';
}

export interface FilterValues {
  accessType: 'medical/recreational' | 'medical' | 'recreational' | '';
  radius: string;
  sortBy: 'priceAsc' | 'priceDesc' | 'ratingDesc' | 'newest' | '';
  amenities: string[];
  searchTerm?: string;
  zipCode?: string;
  thcMin?: number;
  thcMax?: number;
  cbdMin?: number;
  cbdMax?: number;
  strain?: string;
  category?: string;
  title?: string;
  brand?: string;
  tags?: string[];
}

export default function Filters({
  filterValues,
  onFilterChange,
  dispensaryAmenities = [],
  forType,
}: FiltersProps) {
  const [localFilters, setLocalFilters] = useState<FilterValues>(filterValues);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  useEffect(() => {
    setLocalFilters(filterValues);
  }, [filterValues]);

  const handleChange = <K extends keyof FilterValues>(field: K, value: FilterValues[K]) => {
    const updatedFilters = { ...localFilters, [field]: value };
    setLocalFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const moreFiltersActive = !!(localFilters.thcMin || localFilters.thcMax || localFilters.strain || localFilters.brand);

  return (
    <section className="max-w-7xl mx-auto px-6 py-6 bg-white rounded-lg shadow-md my-6">
      {/* Top-level filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Distance / Radius */}
        <div>
          <label htmlFor="radius" className="block text-sm font-semibold mb-1">Distance (miles)</label>
          <input
            type="number"
            id="radius"
            min="1"
            step="1"
            placeholder="Enter radius"
            value={localFilters.radius}
            onChange={(e) => handleChange('radius', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

        {/* Product Type (Category) */}
        {forType === 'deal' && (
          <div>
            <label className="block text-sm font-semibold mb-1">Product Type</label>
            <select
              value={localFilters.category ?? ''}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">All</option>
              <option value="flower">Flower</option>
              <option value="edibles">Edibles</option>
              <option value="concentrates">Concentrates</option>
              <option value="vapes">Vapes</option>
              <option value="topicals">Topicals</option>
              <option value="pre-roll">Pre-roll</option>
              <option value="tincture">Tincture</option>
              <option value="beverage">Beverage</option>
              <option value="capsule/pill">Capsule/Pill</option>
              <option value="other">Other</option>
            </select>
          </div>
        )}

        {/* Sort By */}
        <div>
          <label htmlFor="sortBy" className="block text-sm font-semibold mb-1">Sort By</label>
          <select
            id="sortBy"
            value={localFilters.sortBy}
            onChange={(e) => handleChange('sortBy', e.target.value as FilterValues['sortBy'])}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            <option value="">Default</option>
            {forType === 'deal' && (
              <>
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
              </>
            )}
            {forType === 'dispensary' && (
              <option value="ratingDesc">Rating: High to Low</option>
            )}
            <option value="newest">Newest</option>
          </select>
        </div>

        {/* More Filters toggle (deal only) */}
        {forType === 'deal' && (
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              className={`w-full px-3 py-2 rounded-md text-sm font-semibold border transition cursor-pointer ${
                showMoreFilters || moreFiltersActive
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
              }`}
            >
              {showMoreFilters ? 'Less Filters' : 'More Filters'}
              {moreFiltersActive && !showMoreFilters && ' *'}
            </button>
          </div>
        )}
      </div>

      {/* Discount Tags - full width row */}
      {forType === 'deal' && (
        <div className="mt-4">
          <label className="block text-sm font-semibold mb-1">Discount Tags</label>
          <div className="flex flex-wrap gap-2">
            {['Clearance', 'Manager Special', 'Overstock', 'Last-Chance', 'Weekend Drop', 'Daily Deal'].map((tag) => {
              const selected = (localFilters.tags || []).includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    const currentTags = localFilters.tags || [];
                    const newTags = selected
                      ? currentTags.filter(t => t !== tag)
                      : [...currentTags, tag];
                    handleChange('tags', newTags);
                  }}
                  className={`px-3 py-1 rounded-full border text-sm font-medium transition ${
                    selected
                      ? 'bg-orange-600 text-white border-orange-600'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-orange-100 hover:border-orange-400'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Amenities (dispensary only) */}
      {forType === 'dispensary' && dispensaryAmenities.length > 0 && (
        <div className="mt-4">
          <label className="block text-sm font-semibold mb-1">Amenities</label>
          <div className="flex flex-wrap gap-2">
            {dispensaryAmenities.map((amenity) => {
              const selected = localFilters.amenities.includes(amenity);
              return (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => {
                    const newAmenities = selected
                      ? localFilters.amenities.filter(a => a !== amenity)
                      : [...localFilters.amenities, amenity];
                    handleChange('amenities', newAmenities);
                  }}
                  className={`px-3 py-1 rounded-full border text-sm font-medium transition ${
                    selected
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-green-100 hover:border-green-400'
                  }`}
                >
                  {amenity}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* More Filters (collapsible) - THC, Strain, Brand */}
      {forType === 'deal' && showMoreFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* THC % */}
          <div>
            <label className="block text-sm font-semibold mb-1">THC %</label>
            <div className="flex space-x-2">
              <input
                type="number"
                placeholder="Min"
                value={localFilters.thcMin ?? ''}
                onChange={(e) => handleChange('thcMin', e.target.value ? Number(e.target.value) : undefined)}
                className="w-1/2 border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Max"
                value={localFilters.thcMax ?? ''}
                onChange={(e) => handleChange('thcMax', e.target.value ? Number(e.target.value) : undefined)}
                className="w-1/2 border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Strain */}
          <div>
            <label className="block text-sm font-semibold mb-1">Strain</label>
            <select
              value={localFilters.strain ?? ''}
              onChange={(e) => handleChange('strain', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">All</option>
              <option value="indica">Indica</option>
              <option value="indica-dominant hybrid">Indica-dominant hybrid</option>
              <option value="hybrid">Hybrid</option>
              <option value="sativa-dominant hybrid">Sativa-dominant hybrid</option>
              <option value="sativa">Sativa</option>
            </select>
          </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-semibold mb-1">Brand</label>
            <input
              type="text"
              placeholder="Enter brand"
              value={localFilters.brand ?? ''}
              onChange={(e) => handleChange('brand', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}
    </section>
  );
}
