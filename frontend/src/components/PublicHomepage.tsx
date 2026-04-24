'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import axios from 'axios';
import { Deal, Dispensary, TickerData } from '@/types';
import HeroSection from './HeroSection';
import DealsDispensariesTabs from './DealsDispensariesTabs';
import Filters, { FilterValues } from '@/components/Filters';
import DealsMapView from './DealsMapView';
import { calculateDistanceInMiles, getCoordinatesForZip } from '@/utils/distance';
import { amenitiesOptions } from '@/constants/amenities';

const DISPENSARY_PER_PAGE = 12;

interface PublicHomepageProps {
  ticker: TickerData | null;
}

export default function PublicHomepage({ ticker }: PublicHomepageProps) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [dispensaries, setDispensaries] = useState<Dispensary[]>([]);
  const [dispensariesLoading, setDispensariesLoading] = useState(false);
  const [dispensaryPage, setDispensaryPage] = useState(1);
  const [dispensaryPagination, setDispensaryPagination] = useState<{ total: number; page: number; pages: number; perPage: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filters, setFilters] = useState<FilterValues>({
    accessType: '',
    radius: '25',
    sortBy: '',
    amenities: [],
    searchTerm: '',
    zipCode: '',
    title: '',
    brand: '',
    strain: '',
    category: '',
    tags: [],
  });
  const [activeTab, setActiveTab] = useState<'deal' | 'dispensary'>('deal');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [zipCode, setZipCode] = useState('');
  const [userLocation, setUserLocation] = useState<GeolocationCoordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [zipCoordinates, setZipCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [valueSort, setValueSort] = useState<'under20' | 'under25' | 'biggestSavings' | ''>('');

  // Geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation(pos.coords),
        (err) => setLocationError(err.message)
      );
    } else {
      setLocationError('Geolocation not supported');
    }
  }, []);

  useEffect(() => {
    if (filters.zipCode && filters.zipCode.length === 5) {
      getCoordinatesForZip(filters.zipCode).then(coords => {
        if (coords) {
          setZipCoordinates(coords);
        } else {
          setZipCoordinates(null);
        }
      });
    } else {
      setZipCoordinates(null);
    }
  }, [filters.zipCode]);
  
  // Determine location
  const currentLocation = useMemo(() => {
    return zipCoordinates || userLocation;
  }, [zipCoordinates, userLocation]);

  // Convert location to format expected by DealCard
  const userLocationForCards = useMemo(() => {
    if (!currentLocation) return undefined;
    if ('latitude' in currentLocation && 'longitude' in currentLocation) {
      return { lat: (currentLocation as GeolocationCoordinates).latitude, lng: (currentLocation as GeolocationCoordinates).longitude };
    }
    if ('lat' in currentLocation && 'lng' in currentLocation) {
      return { lat: (currentLocation as { lat: number; lng: number }).lat, lng: (currentLocation as { lat: number; lng: number }).lng };
    }
    return undefined;
  }, [currentLocation]);
  // Fetch deals with filters
  useEffect(() => {
    const fetchDeals = async () => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = {};

        // Add filter parameters
        // if (filters.accessType) params.accessType = filters.accessType;
        if (filters.category) params.category = filters.category;
        if (filters.brand) params.brand = filters.brand;
        if (filters.title) params.title = filters.title;
        if (filters.strain) params.strain = filters.strain;
        if (filters.thcMin !== undefined) params.thcMin = filters.thcMin;
        if (filters.thcMax !== undefined) params.thcMax = filters.thcMax;
        if (filters.searchTerm) params.search = filters.searchTerm;
        if (filters.tags && filters.tags.length > 0) params.tags = filters.tags.join(',');

        // Add location-based filtering only when location is available
        if (currentLocation && filters.radius) {
          const radius = Number(filters.radius);
          if (radius > 0) {
            params.lat = currentLocation.latitude;
            params.lng = currentLocation.longitude;
            params.distance = radius;
          }
        }

        // Price quick chips
        if (valueSort === 'under20') {
          params.maxSalePrice = 20;
        } else if (valueSort === 'under25') {
          params.maxSalePrice = 25;
        }

        // Sort
        if (valueSort === 'biggestSavings') {
          params.sortBy = 'biggest_savings';
        } else if (filters.sortBy === 'priceAsc') {
          params.sortBy = 'price_asc';
        } else if (filters.sortBy === 'priceDesc') {
          params.sortBy = 'price_desc';
        } else if (filters.sortBy === 'newest') {
          params.sortBy = 'newest';
        } else if (currentLocation && filters.radius && Number(filters.radius) > 0) {
          params.sortBy = 'distance';
        }

        if (!Object.keys(params).length) return;

        const dealsRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/deals`, { params });
        console.log(">>>>", params);
        console.log(">>>>>>>>>>>>>>>>", dealsRes.data)
        setDeals(dealsRes.data?.deals || []);
      } catch (err: unknown) {
        console.error('Failed to fetch deals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, [filters, currentLocation, valueSort]);

  // Reset dispensary page to 1 when search, radius, or location changes
  const prevDispensaryFilterRef = useRef('');
  useEffect(() => {
    const sig = `${filters.searchTerm}|${filters.radius}|${currentLocation?.latitude ?? ''}|${currentLocation?.longitude ?? ''}`;
    if (prevDispensaryFilterRef.current && prevDispensaryFilterRef.current !== sig) {
      setDispensaryPage(1);
    }
    prevDispensaryFilterRef.current = sig;
  }, [filters.searchTerm, filters.radius, currentLocation?.latitude, currentLocation?.longitude]);

  // Fetch dispensaries (real + generic from API; supports search, lat/lng, distance, pagination)
  useEffect(() => {
    const fetchDispensaries = async () => {
      setDispensariesLoading(true);
      try {
        const params: Record<string, string | number> = {
          page: dispensaryPage,
          limit: DISPENSARY_PER_PAGE,
        };
        if (filters.searchTerm) params.search = filters.searchTerm;
        if (currentLocation && filters.radius && Number(filters.radius) > 0) {
          params.lat = currentLocation.latitude;
          params.lng = currentLocation.longitude;
          params.distance = Number(filters.radius);
        }
        const dispensariesRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/dispensaries`, { params });
        setDispensaries(dispensariesRes.data?.dispensaries || []);
        setDispensaryPagination(dispensariesRes.data?.pagination ?? null);
      } catch (err: unknown) {
        console.error('Failed to fetch dispensaries:', err);
        setDispensaryPagination(null);
      } finally {
        setDispensariesLoading(false);
      }
    };

    fetchDispensaries();
  }, [filters.searchTerm, filters.radius, currentLocation, dispensaryPage]);


  // ======== Filter Dispensaries (client-side: amenities, sort; API already does search + geo) ========
  const filteredDispensaries = useMemo(() => {
    let result = [...dispensaries];

    if (filters.amenities.length > 0) {
      result = result.filter(d => filters.amenities.every(a => (d.amenities || []).includes(a)));
    }

    if (filters.searchTerm && filters.searchTerm.length > 0) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(d =>
        d.name?.toLowerCase().includes(term) ||
        (d as { legalName?: string }).legalName?.toLowerCase().includes(term)
      );
    }

    if (currentLocation) {
      result = result.filter(d => {
        if (!d.coordinates?.coordinates) return false;
        const [longitude, latitude] = d.coordinates.coordinates;
        const distance = calculateDistanceInMiles(
          currentLocation.latitude,
          currentLocation.longitude,
          latitude,
          longitude
        );
        return distance <= Number(filters.radius);
      });
    }

    // Primary: real dispensaries first, then generic. Secondary: selected sort (rating or newest).
    const realFirst = (a: Dispensary, b: Dispensary) =>
      ((a as { isGeneric?: boolean }).isGeneric ? 1 : 0) - ((b as { isGeneric?: boolean }).isGeneric ? 1 : 0);

    if (filters.sortBy === 'ratingDesc') {
      result.sort((a, b) => {
        const byReal = realFirst(a, b);
        if (byReal !== 0) return byReal;
        const ra = a.ratings?.length ? a.ratings.reduce((s, r) => s + r, 0) / a.ratings.length : 0;
        const rb = b.ratings?.length ? b.ratings.reduce((s, r) => s + r, 0) / b.ratings.length : 0;
        return rb - ra;
      });
    } else if (filters.sortBy === 'newest') {
      result.sort((a, b) => {
        const byReal = realFirst(a, b);
        if (byReal !== 0) return byReal;
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    } else {
      // No explicit sort (e.g. distance from API): still enforce real first
      result.sort(realFirst);
    }

    return result;
  }, [dispensaries, filters, currentLocation]);

  const handleSearch = () => {
    console.log('searchTerm', searchTerm);
    console.log('zipCode', zipCode);
    setFilters(prev => ({
      ...prev,
      searchTerm: searchTerm.trim(),
      zipCode: zipCode.trim(),
    }));
  };

  return (
    <div>
      <HeroSection
        userLocation={userLocation}
        locationError={locationError}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        zipCode={zipCode}
        handleZipCodeChange={(e) => setZipCode(e.target.value)}
        handleSearch={handleSearch}
        ticker={ticker}
      />

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100">
              <div className="flex items-center mb-4">
                <div className="bg-orange-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg mr-4">
                  1
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Search for Discounts</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Use the search bar to find discounted cannabis items by title, category, or brand. Enter your ZIP code or use your current location to find discounts near you. Filter by distance, price, strain, and more to find exactly what you're looking for.
              </p>
            </div>
            <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100">
              <div className="flex items-center mb-4">
                <div className="bg-orange-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg mr-4">
                  2
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Click to Visit Dispensary</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                When you find a discount you like, click on it to view details. Clicking on a discount will redirect you to the dispensary's website where you can complete your purchase. All purchases are made directly through the licensed dispensary.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Filters
        filterValues={filters}
        onFilterChange={setFilters}
        forType={activeTab}
        dispensaryAmenities={amenitiesOptions}
      />

      {/* View Toggle - Only show for deals tab */}
      {activeTab === 'deal' && (
        <div className="max-w-7xl mx-auto px-6 mb-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-gray-800">
                {loading ? 'Loading...' : `${deals.length} ${deals.length === 1 ? 'Discount' : 'Discounts'} Found`}
              </h2>
              <div className="flex space-x-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    viewMode === 'list'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  List View
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    viewMode === 'map'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Map View 
                </button>
              </div>
            </div>

            {/* Price Quick Chips */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setValueSort(valueSort === 'under20' ? '' : 'under20')}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold border cursor-pointer ${
                  valueSort === 'under20'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Under $20
              </button>
              <button
                type="button"
                onClick={() => setValueSort(valueSort === 'under25' ? '' : 'under25')}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold border cursor-pointer ${
                  valueSort === 'under25'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Under $25
              </button>
              <button
                type="button"
                onClick={() => setValueSort(valueSort === 'biggestSavings' ? '' : 'biggestSavings')}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold border cursor-pointer ${
                  valueSort === 'biggestSavings'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Biggest Savings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map View or List View */}
      {activeTab === 'deal' && viewMode === 'map' ? (
        <div className="max-w-7xl mx-auto px-6">
          {loading ? (
            <div className="w-full h-[calc(100vh-300px)] min-h-[500px] rounded-lg overflow-hidden shadow-lg border border-gray-200 bg-gray-100 flex items-center justify-center">
              <div className="text-gray-500">Loading discounts...</div>
            </div>
          ) : (
            <DealsMapView 
              deals={deals} 
              userLocation={currentLocation}
              radius={currentLocation && filters.radius ? Number(filters.radius) : undefined}
            />
          )}
        </div>
      ) : (
        <>
          {activeTab === 'dispensary' && (
            <div className="max-w-7xl mx-auto px-6 mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {dispensariesLoading ? 'Loading...' : `${dispensaryPagination?.total ?? filteredDispensaries.length} ${(dispensaryPagination?.total ?? filteredDispensaries.length) === 1 ? 'Dispensary' : 'Dispensaries'} Found`}
              </h2>
            </div>
          )}
          <DealsDispensariesTabs
            deals={deals}
            dispensaries={filteredDispensaries}
            loading={activeTab === 'deal' ? loading : dispensariesLoading}
            activeTab={activeTab === 'deal' ? 'deals' : 'dispensaries'}
            setActiveTab={(tab) => {
              setActiveTab(tab === 'deals' ? 'deal' : 'dispensary');
              // Reset to list view when switching to dispensaries
              if (tab === 'dispensaries') {
                setViewMode('list');
              }
            }}
            userLocation={userLocationForCards}
          />
          {activeTab === 'dispensary' && dispensaryPagination && dispensaryPagination.pages > 1 && (
            <div className="max-w-7xl mx-auto px-6 mt-6 mb-10 flex flex-wrap items-center justify-center gap-4">
              <span className="text-sm text-gray-600">
                {dispensaryPagination.total} {dispensaryPagination.total === 1 ? 'dispensary' : 'dispensaries'} · Page {dispensaryPagination.page} of {dispensaryPagination.pages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDispensaryPage((p) => Math.max(1, p - 1))}
                  disabled={dispensaryPagination.page <= 1 || dispensariesLoading}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => setDispensaryPage((p) => Math.min(dispensaryPagination.pages, p + 1))}
                  disabled={dispensaryPagination.page >= dispensaryPagination.pages || dispensariesLoading}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
