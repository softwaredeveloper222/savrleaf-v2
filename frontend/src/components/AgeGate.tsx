'use client';

import { useAgeGate } from '@/context/AgeGateContext';
import Image from 'next/image';
import { useState } from 'react';

export default function AgeGateOverlay() {
  const { is21, setIs21 } = useAgeGate();
  const [isProcessing, setIsProcessing] = useState(false);

  if (is21 === true) return null;
  if (is21 === false) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-90 text-white flex items-center justify-center">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold">Access Denied</h1>
          <p className="text-lg">You must be 21 or older to enter this site.</p>
        </div>
      </div>
    );
  }

  const handleYes = () => {
    setIsProcessing(true);
    // Delay so age gate does not advance too quickly (1 second)
    setTimeout(() => {
      setIs21(true);
    }, 1000);
  };

  const handleNo = () => {
    setIs21(false);
  };

  return (
    <div className="fixed inset-0 z-50">
<div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/forest-bg.jpg')" }}>
  <div className="absolute inset-0 bg-green-10 bg-opacity-50 backdrop-blur-sm" />
</div>

      <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center p-6">
        <Image
          src="/logo.png"
          alt="Logo"
          width={120}
          height={120}
          className="mb-6"
        />
        <h2 className="text-4xl font-extrabold mb-8 drop-shadow-md">
          Are you 21+ and ready for discounts?
        </h2>
        <div className="flex space-x-6">
          <button
            className="px-8 py-4 bg-orange-500 hover:bg-orange-400 text-white text-lg font-semibold rounded-xl shadow-lg transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleYes}
            disabled={isProcessing}
          >
            Yes — Show me discounts
          </button>
          <button
            className="px-8 py-4 bg-gray-600 hover:bg-gray-500 text-white text-lg font-semibold rounded-xl shadow-lg transition cursor-pointer"
            onClick={handleNo}
          >
            No — Exit
          </button>
        </div>
      </div>
    </div>
  );
}
