'use client';

import { Deal } from '@/types';
import { useState, useEffect } from 'react';
import { dealKeywords } from '@/constants/dealKeywords';

const SIZE_OPTIONS: Record<string, string[]> = {
  flower: ['1g', '3.5g (Eighth)', '7g (Quarter)', '14g (Half)', '28g (Ounce)'],
  concentrates: ['1g', '3.5g (Eighth)', '7g (Quarter)', '14g (Half)', '28g (Ounce)'],
  'pre-roll': ['0.5g', '1g', '0.5g x 5 pack', '0.5g x 10 pack', '1g x 3 pack'],
  vapes: ['500mg (0.5g)', '1000mg (1g)', '2000mg (2g)'],
  edibles: ['50mg', '100mg', '200mg', '300mg', '500mg'],
  tincture: ['15ml', '30ml', '60ml'],
  beverage: ['50mg', '100mg', '200mg'],
  'capsule/pill': ['50mg', '100mg', '200mg', '300mg', '500mg'],
  topicals: ['50mg', '100mg', '200mg', '500mg'],
  other: [],
};

interface DealFormProps {
  initialData?: Deal | null;
  dispensaryOptions: { _id: string; name: string; isActive: boolean; isPurchased: boolean }[];
  onSave: (deal: Deal) => void;
  onCancel: () => void;
  userId: string;
}

export default function DealForm({ initialData, dispensaryOptions, onSave, onCancel, userId }: DealFormProps) {
  const [form, setForm] = useState({
    title: '',
    brand: '',
    description: '',
    salePrice: '',
    originalPrice: '',
    tags: [] as string[],
    images: '', // comma-separated URLs
    dispensary: '',
    deal_purchase_link: '',
    startDate: '',
    endDate: '',
    manuallyActivated: false,
    category: '',
    strain: 'indica',
    thcContent: 0,
    subcategory: '',
    descriptiveKeywords: [] as string[],
    discountTier: '' as '' | '10' | '20' | '30' | '40' | '50',
    sizeOrStrength: '',
  });

  const [sizeManualEntry, setSizeManualEntry] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    if (initialData) {
      const imageUrls = initialData.images || [];
      setForm({
        title: initialData.title || '',
        brand: initialData.brand || '',
        description: initialData.description || '',
        salePrice: initialData.salePrice?.toString() || '',
        originalPrice: initialData.originalPrice?.toString() || '',
        tags: initialData.tags || [],
        images: imageUrls.join(', '),
        dispensary: typeof initialData.dispensary === 'string'
          ? initialData.dispensary
          : initialData.dispensary?._id || '',
        deal_purchase_link: initialData?.deal_purchase_link || '',
        startDate: initialData.startDate ? initialData.startDate.slice(0, 10) : '',
        endDate: initialData.endDate ? initialData.endDate.slice(0, 10) : '',
        manuallyActivated: initialData.manuallyActivated || false,
        category: initialData?.category || '',
        strain: initialData?.strain || 'indica',
        thcContent: initialData?.thcContent || 0,
        subcategory: initialData?.subcategory || '',
        descriptiveKeywords: initialData?.descriptiveKeywords || [],
        discountTier: (initialData.discountTier ? String(initialData.discountTier) : '') as '' | '10' | '20' | '30' | '40' | '50',
        sizeOrStrength: initialData?.sizeOrStrength || '',
      });
      setUploadedImages(imageUrls);
      setImagePreviews(imageUrls);
      // Check if existing sizeOrStrength matches a preset option
      const cat = initialData?.category || '';
      const presets = SIZE_OPTIONS[cat] || [];
      const val = initialData?.sizeOrStrength || '';
      setSizeManualEntry(val !== '' && presets.length > 0 && !presets.includes(val));
    }
  }, [initialData]);

  const [formError, setFormError] = useState('');

  const resetForm = () => {
    setForm({
      title: '',
      brand: '',
      description: '',
      salePrice: '',
      originalPrice: '',
      tags: [],
      images: '',
      dispensary: '',
      deal_purchase_link: '',
      startDate: '',
      endDate: '',
      manuallyActivated: false,
      category: '',
      strain: 'indica',
      thcContent: 0,
      subcategory: '',
      descriptiveKeywords: [],
      discountTier: '',
      sizeOrStrength: '',
    });
    setSizeManualEntry(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    const fieldValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    // Reset size selection when category changes
    if (name === 'category') {
      setSizeManualEntry(false);
      setForm((prev: typeof form) => ({ ...prev, category: value, sizeOrStrength: '' }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: fieldValue,
    }));
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setFormError('');

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('images', file);
      });
      formData.append('folder', 'savrleaf/deals');

      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/images`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.images) {
        const newImageUrls = data.images.map((img: { url: string }) => img.url);
        setUploadedImages((prev) => [...prev, ...newImageUrls]);
        setImagePreviews((prev) => [...prev, ...newImageUrls]);
        
        // Update form images field
        const allImages = [...uploadedImages, ...newImageUrls];
        setForm((prev) => ({
          ...prev,
          images: allImages.join(', '),
        }));
      } else {
        setFormError(data.message || 'Failed to upload images');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setFormError('Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    setImagePreviews(newPreviews);
    setForm((prev) => ({
      ...prev,
      images: newImages.join(', '),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!form.salePrice) {
      setFormError('Discount price is required.');
      return;
    }

    if (!form.discountTier) {
      setFormError('Discount tier is required.');
      return;
    }

    if (!form.sizeOrStrength?.trim()) {
      setFormError('Size / Strength is required.');
      return;
    }

    if (form.originalPrice && Number(form.salePrice) > Number(form.originalPrice)) {
      setFormError('Sale price must be less than or equal to original price.');
      return;
    }

    if (form.startDate && form.endDate && new Date(form.startDate) > new Date(form.endDate)) {
      setFormError('Start date must be before end date.');
      return;
    }

    // Combine uploaded images with manually entered URLs
    const manualUrls = form.images.split(',').map((i) => i.trim()).filter(Boolean);
    const allImages = [...uploadedImages, ...manualUrls.filter(url => !uploadedImages.includes(url))];

    if (allImages.length === 0) {
      setFormError('Please upload at least one image or provide an image URL.');
      return;
    }

    const payload = {
      ...form,
      salePrice: Number(form.salePrice),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      discountTier: form.discountTier ? Number(form.discountTier) : undefined,
      tags: form.tags,
      images: allImages,
      manuallyActivated: form.manuallyActivated,
      userId: userId,
      subcategory: form.subcategory || undefined,
      descriptiveKeywords: form.descriptiveKeywords,
      sizeOrStrength: form.sizeOrStrength.trim(),
    };

    const method = initialData?._id ? 'PUT' : 'POST';
    const url = initialData?._id
      ? `${process.env.NEXT_PUBLIC_API_URL}/deals/${initialData._id}`
      : `${process.env.NEXT_PUBLIC_API_URL}/deals`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        onSave(data.deal);
        resetForm();
        return;
      } else {
        setFormError(data.message || 'Error saving discount.');
      }
    } catch (err) {
      console.error(err);
      setFormError('Something went wrong. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h3 className="text-xl font-bold text-orange-700">
        {initialData?._id ? 'Edit Discount' : 'Create New Discount'}
      </h3>

      {/* Helper Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Quick Tips
        </h4>
        <div className="text-sm text-blue-800 space-y-2">
          <div>
            <strong>Required:</strong> <strong>Photo</strong>, <strong>Discount Price</strong>, <strong>Discount Tier</strong>, and <strong>Size / Strength</strong> are required. All other fields are optional.
          </div>
          <div>
            <strong>Discount:</strong> We’ll show “X% off” and “Save $X” from your discount price and chosen tier. Do not label any derived original as “regular price”; we display it as “Est. price” when shown.
          </div>
          <div>
            <strong>Image:</strong> Upload at least one image or paste an image URL. You can add more images or fill optional details (title, category, dates, etc.) if you like.
          </div>
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Discount title (optional)"
          className="border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 w-full rounded-lg"
        />
      </div>

      {/* Brand */}
      {/* <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
        <input
          name="brand"
          value={form.brand}
          onChange={handleChange}
          placeholder="Brand name"
          className="border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 w-full rounded-lg"
        />
      </div> */}

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 w-full rounded-lg"
        >
          <option value="" disabled>Select a category</option>
          <option value="flower">Flower</option>
          <option value="edibles">Edibles</option>
          <option value="concentrates">Concentrates</option>
          <option value="vapes">Vapes</option>
          <option value="topicals">Topicals</option>
          <option value="pre-roll">Pre-Roll</option>
          <option value="tincture">Tincture</option>
          <option value="beverage">Beverage</option>
          <option value="capsule/pill">Capsule/Pill</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Subcategory - Only show for Flower */}
      {form.category === 'flower' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subcategory (Optional)
          </label>
          <select
            name="subcategory"
            value={form.subcategory || ''}
            onChange={handleChange}
            className="border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 w-full rounded-lg"
          >
            <option value="">None</option>
            <option value="ground-flower">Ground Flower</option>
            <option value="baby-buds-popcorn">Baby Buds / Popcorn</option>
          </select>
        </div>
      )}

      {/* Descriptive Keywords */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descriptive Keywords (Select all that apply)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {dealKeywords.map((keyword) => (
            <label key={keyword} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.descriptiveKeywords.includes(keyword)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setForm(prev => ({
                      ...prev,
                      descriptiveKeywords: [...prev.descriptiveKeywords, keyword]
                    }));
                  } else {
                    setForm(prev => ({
                      ...prev,
                      descriptiveKeywords: prev.descriptiveKeywords.filter(k => k !== keyword)
                    }));
                  }
                }}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700 capitalize">{keyword.replace(/-/g, ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Short description of the discount"
          className="border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 w-full rounded-lg"
          rows={3}
        />
      </div>

      {/* Prices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price *</label>
          <input
            name="salePrice"
            type="number"
            step="0.01"
            value={form.salePrice}
            onChange={handleChange}
            placeholder="0.00"
            required
            className="border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 w-full rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Original Price (optional)
          </label>
          <input
            name="originalPrice"
            type="number"
            step="0.01"
            value={form.originalPrice}
            onChange={handleChange}
            placeholder="0.00"
            className="border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 w-full rounded-lg"
          />
        </div>
      </div>

      {/* Discount Tier */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Discount Tier *
        </label>
        <div className="flex flex-wrap gap-2">
          {['10', '20', '30', '40', '50'].map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() =>
                setForm((prev) => ({ ...prev, discountTier: tier as typeof prev.discountTier }))
              }
              className={`px-3 py-1 rounded-full text-sm font-semibold border cursor-pointer ${
                form.discountTier === tier
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {tier}% off
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Select the closest discount tier. We’ll estimate the original price from the discount price and tier.
        </p>
      </div>

      {/* Discount Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Discount Tags (optional, max 2)
        </label>
        <div className="flex flex-wrap gap-2">
          {['Clearance', 'Manager Special', 'Overstock', 'Last-Chance', 'Weekend Drop', 'Daily Deal'].map((tag) => {
            const selected = form.tags.includes(tag);
            const disabled = !selected && form.tags.length >= 2;
            return (
              <button
                key={tag}
                type="button"
                disabled={disabled}
                onClick={() => {
                  setForm((prev) => ({
                    ...prev,
                    tags: selected
                      ? prev.tags.filter((t) => t !== tag)
                      : [...prev.tags, tag],
                  }));
                }}
                className={`px-3 py-1 rounded-full text-sm font-semibold border cursor-pointer transition ${
                  selected
                    ? 'bg-orange-600 text-white border-orange-600'
                    : disabled
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Select up to 2 tags that describe the type of discount.
        </p>
      </div>

      {/* Size / Strength */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Size / Strength *</label>
        {(() => {
          const options = SIZE_OPTIONS[form.category] || [];
          const hasPresets = options.length > 0;

          return (
            <>
              {hasPresets && (
                <select
                  value={sizeManualEntry ? '__other__' : (options.includes(form.sizeOrStrength) ? form.sizeOrStrength : '')}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '__other__') {
                      setSizeManualEntry(true);
                      setForm((prev) => ({ ...prev, sizeOrStrength: '' }));
                    } else {
                      setSizeManualEntry(false);
                      setForm((prev) => ({ ...prev, sizeOrStrength: val }));
                    }
                  }}
                  className="border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 w-full rounded-lg"
                >
                  <option value="" disabled>Select size / strength</option>
                  {options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                  <option value="__other__">Other (manual entry)</option>
                </select>
              )}
              {(!hasPresets || sizeManualEntry) && (
                <input
                  name="sizeOrStrength"
                  value={form.sizeOrStrength}
                  onChange={handleChange}
                  placeholder="e.g. 3.5g, 100mg, 0.5g x 10 pack, 30ml"
                  className={`border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 w-full rounded-lg ${hasPresets ? 'mt-2' : ''}`}
                />
              )}
            </>
          );
        })()}
        <p className="mt-1 text-xs text-gray-500">
          {form.category ? 'Choose a common size or select "Other" for manual entry.' : 'Select a category first to see common sizes, or type manually.'}
        </p>
      </div>

      {/* Access Type */}
      {/* <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Access Type</label>
        <select
          name="accessType"
          value={form.accessType}
          onChange={handleChange}
          className="border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 w-full rounded-lg"
        >
          <option value="both">Med/Rec</option>
          <option value="medical">Medical</option>
          <option value="recreational">Recreational</option>
        </select>
      </div> */}

      {/* Strain */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Strain</label>
        <select
          name="strain"
          value={form.strain}
          onChange={handleChange}
          className="border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 w-full rounded-lg"
        >
          <option value="indica">Indica</option>
          <option value="indica-dominant hybrid">Indica-Dominant Hybrid</option>
          <option value="hybrid">Hybrid</option>
          <option value="sativa-dominant hybrid">Sativa-Dominant Hybrid</option>
          <option value="sativa">Sativa</option>
        </select>
      </div>

      {/* THC Content */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">THC Content *</label>
        <input
          name="thcContent"
          type="number"
          value={form.thcContent}
          onChange={handleChange}
          required
          min={0}
          max={100}
          className="border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 w-full rounded-lg"
        />
      </div>

      {/* Dispensary */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Dispensary *</label>
        <select
          name="dispensary"
          value={form.dispensary}
          onChange={handleChange}
          required
          className="border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 w-full rounded-lg"
        >
          <option value="" disabled>
            Select a dispensary
          </option>
          {dispensaryOptions.filter((d) => d.isActive && d.isPurchased).map((d) => (
            <option key={d._id} value={d._id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Purchase Link */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Link</label>
        <input
          name="deal_purchase_link"
          value={form.deal_purchase_link}
          onChange={handleChange}
          placeholder="Savrleaf.com"
          className="border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 w-full rounded-lg"          
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            name="startDate"
            type="date"
            value={form.startDate}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
            className="border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 w-full rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            name="endDate"
            type="date"
            value={form.endDate}
            onChange={handleChange}
            min={form.startDate || new Date().toISOString().split('T')[0]}
            className="border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 w-full rounded-lg"
          />
        </div>
      </div>

      

      {/* Images */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Images</label>
        
        {/* File Upload */}
        <div className="mb-3">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleImageUpload(e.target.files)}
            disabled={uploading}
            className="border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 w-full rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {uploading && (
            <p className="text-sm text-orange-600 mt-1">Uploading images...</p>
          )}
        </div>

        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
            {imagePreviews.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Manual URL Input (Optional) */}
        <textarea
          name="images"
          value={form.images}
          onChange={handleChange}
          placeholder="Or enter image URLs manually (comma separated)"
          className="border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 w-full rounded-lg"
          rows={2}
        />
        <p className="text-xs text-gray-500 mt-1">
          Upload images using the file input above, or enter image URLs manually.
        </p>
      </div>

      {/* Manually Activated */}
      {/* <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="manuallyActivated"
          checked={form.manuallyActivated}
          onChange={handleChange}
          id="manuallyActivated"
          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
        />
        <label htmlFor="manuallyActivated" className="text-sm text-gray-700">
          Manually Activate Deal
        </label>
      </div> */}

      {formError && (
        <div className="p-3 bg-red-100 text-red-800 rounded">{formError}</div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700 focus:ring focus:ring-orange-300 transition cursor-pointer"
        >
          {initialData?._id ? 'Update Discount' : 'Create Discount'}
        </button>
      </div>
    </form>
  );
}
