  'use client';

  import { Search } from 'lucide-react';

  interface SearchBarProps {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    zipCode: string;
    handleZipCodeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSearch: () => void;
    className?: string;
  }

  export default function SearchBar({
    searchTerm,
    setSearchTerm,
    zipCode,
    handleZipCodeChange,
    handleSearch,
    className = '',
  }: SearchBarProps) {
    return (
      <div className={`max-w-full mx-auto mb-8 px-6 sm:px-8 flex flex-row items-center justify-center ${className}`}>
        <div className="flex flex-col items-center justify-center min-w-70">

          <span className="block mt-1 text-gray-700 font-light font-semibold max-w-2xl text-center">Use filters to narrow discounts - or browse all discounts near you.</span>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch gap-5 justify-center">
          {/* Search input */}

          <div className="relative flex-1">
            <Search
              className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search products, brands, dispensaries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              className="w-full pl-14 pr-2 py-4 rounded-2xl bg-white border border-gray-300 shadow-sm text-gray-900 text-lg placeholder:text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:ring-offset-1 transition min-w-100"
              aria-label="Search products, brands, dispensaries"
            />
          </div>

          {/* ZIP input and search button */}
          <div className="flex gap-5 items-center">
            <input
              type="text"
              placeholder="ZIP Code"
              value={zipCode}
              onChange={handleZipCodeChange}
              maxLength={5}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              className="w-28 px-4 py-4 rounded-2xl bg-white border border-gray-300 shadow-sm text-gray-900 text-lg placeholder:text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:ring-offset-1 transition"
              aria-label="Enter ZIP code"
            />
            <button
              onClick={handleSearch}
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-2xl font-semibold flex items-center justify-center gap-3 shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-orange-600 focus:ring-offset-1"
              aria-label="Search"
            >
              <Search size={20} />
              Search
            </button>
          </div>
        </div>
      </div>
    );
  }
