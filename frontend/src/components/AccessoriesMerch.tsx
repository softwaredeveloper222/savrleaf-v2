'use client';

interface AccessoriesMerchProps {
  text: string;
}

export default function AccessoriesMerch({ text }: AccessoriesMerchProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
      <div className="p-6 md:p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Accessories & Merch</h2>
        <p className="text-sm text-gray-600 whitespace-pre-line">{text}</p>
      </div>
    </div>
  );
}
