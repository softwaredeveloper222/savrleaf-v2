'use client';

import { useState, useEffect } from 'react';
import { Dispensary } from '@/types';
import { amenitiesOptions } from '@/constants/amenities';
import AddressAutocomplete from './AddressAutocomplete';

interface DispensaryFormProps {
  initialData?: Dispensary | null;
  onSave: (dispensary: Dispensary) => void;
  onCancel: () => void;
  /**
   * When provided (admin flow), the dispensary will be created for this user instead of the current authed user.
   */
  userIdOverride?: string;
}

export default function DispensaryForm({ initialData, onSave, onCancel, userIdOverride }: DispensaryFormProps) {
  const [form, setForm] = useState({
    name: '',
    legalName: '',
    address: {
      street1: '',
      street2: '',
      city: '',
      state: '',
      zipCode: '',
    },
    licenseNumber: '',
    phoneNumber: '',
    websiteUrl: '',
    description: '',
    amenities: [] as string[],
    logo: '',
    images: '', // comma-separated URLs
    hours: {} as Record<string, string>,
    accessType: 'medical' as 'medical' | 'recreational' | 'medical/recreational',
    accessoriesMerch: '',
  });

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedLogo, setUploadedLogo] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [logoPreview, setLogoPreview] = useState<string>('');

  const [hoursForm, setHoursForm] = useState({
    monday: '',
    tuesday: '',
    wednesday: '',
    thursday: '',
    friday: '',
    saturday: '',
    sunday: '',
  });

  const [promotionsForm, setPromotionsForm] = useState({
    monday: '',
    tuesday: '',
    wednesday: '',
    thursday: '',
    friday: '',
    saturday: '',
    sunday: '',
  });

  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (initialData) {
      const imageUrls = initialData.images || [];
      const logoUrl = initialData.logo || '';
      setForm({
        name: initialData.name || '',
        legalName: initialData.legalName || '',
        address: {
          street1: initialData.address?.street1 || '',
          street2: initialData.address?.street2 || '',
          city: initialData.address?.city || '',
          state: initialData.address?.state || '',
          zipCode: initialData.address?.zipCode || '',
        },
        licenseNumber: initialData.licenseNumber || '',
        phoneNumber: initialData.phoneNumber || '',
        websiteUrl: initialData.websiteUrl || '',
        description: initialData.description || '',
        amenities: initialData.amenities || [],
        logo: logoUrl,
        images: imageUrls.join(', '),
        hours: initialData.hours || {},
        accessType: initialData.accessType || 'medical',
        accessoriesMerch: initialData.accessoriesMerch || '',
      });

      setUploadedImages(imageUrls);
      setUploadedLogo(logoUrl);
      setImagePreviews(imageUrls);
      setLogoPreview(logoUrl);

      if (initialData.hours) {
        setHoursForm({
          monday: initialData.hours.monday || '',
          tuesday: initialData.hours.tuesday || '',
          wednesday: initialData.hours.wednesday || '',
          thursday: initialData.hours.thursday || '',
          friday: initialData.hours.friday || '',
          saturday: initialData.hours.saturday || '',
          sunday: initialData.hours.sunday || '',
        });
      }

      if (initialData.weeklyPromotions) {
        setPromotionsForm({
          monday: initialData.weeklyPromotions.monday || '',
          tuesday: initialData.weeklyPromotions.tuesday || '',
          wednesday: initialData.weeklyPromotions.wednesday || '',
          thursday: initialData.weeklyPromotions.thursday || '',
          friday: initialData.weeklyPromotions.friday || '',
          saturday: initialData.weeklyPromotions.saturday || '',
          sunday: initialData.weeklyPromotions.sunday || '',
        });
      }
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setForm((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value,
        },
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setHoursForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePromotionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPromotionsForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAmenityChange = (amenity: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleLogoUpload = async (file: File | null) => {
    if (!file) return;

    setUploadingLogo(true);
    setFormError('');

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('folder', 'savrleaf/dispensaries/logos');

      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.url) {
        setUploadedLogo(data.url);
        setLogoPreview(data.url);
        setForm((prev) => ({
          ...prev,
          logo: data.url,
        }));
      } else {
        setFormError(data.message || 'Failed to upload logo');
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      setFormError('Failed to upload logo. Please try again.');
    } finally {
      setUploadingLogo(false);
    }
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
      formData.append('folder', 'savrleaf/dispensaries');

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

  const handleRemoveLogo = () => {
    setUploadedLogo('');
    setLogoPreview('');
    setForm((prev) => ({
      ...prev,
      logo: '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!form.name || !form.address.street1 || !form.address.city || !form.address.state || !form.address.zipCode || !form.licenseNumber) {
      setFormError('Please fill in all required fields.');
      return;
    }

    // Validate zip code format
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(form.address.zipCode)) {
      setFormError('Please enter a valid zip code (e.g., 12345 or 12345-6789).');
      return;
    }

    // Build hours object (only include non-empty values)
    const hours: Record<string, string> = {};
    Object.entries(hoursForm).forEach(([day, time]) => {
      if (time.trim()) {
        hours[day] = time.trim();
      }
    });

    // Build weeklyPromotions object (only include non-empty values)
    const weeklyPromotions: Record<string, string> = {};
    Object.entries(promotionsForm).forEach(([day, text]) => {
      if (text.trim()) {
        weeklyPromotions[day] = text.trim();
      }
    });

    // Combine uploaded images with manually entered URLs
    const manualUrls = form.images.split(',').map((i) => i.trim()).filter(Boolean);
    const allImages = [...uploadedImages, ...manualUrls.filter(url => !uploadedImages.includes(url))];

    const payload = {
      name: form.name,
      legalName: form.legalName,
      address: form.address,
      licenseNumber: form.licenseNumber,
      phoneNumber: form.phoneNumber || undefined,
      websiteUrl: form.websiteUrl || undefined,
      description: form.description || undefined,
      amenities: form.amenities,
      logo: uploadedLogo || form.logo || undefined,
      images: allImages,
      hours: Object.keys(hours).length > 0 ? hours : undefined,
      weeklyPromotions: Object.keys(weeklyPromotions).length > 0 ? weeklyPromotions : {},
      accessoriesMerch: form.accessoriesMerch.trim() || '',
      accessType: form.accessType,
      // Allow admins to create a dispensary on behalf of a partner
      ...(userIdOverride ? { userId: userIdOverride } : {}),
    };

    const isEdit = !!initialData?._id;
    const url = isEdit
      ? `${process.env.NEXT_PUBLIC_API_URL}/dispensaries/${initialData._id}`
      : `${process.env.NEXT_PUBLIC_API_URL}/dispensaries`;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success || res.status === 201) {
        // For create, the backend returns { success: true, dispensary, subscription }
        // For update, it returns { success: true, dispensary }
        const dispensaryToSave = data.dispensary || data;
        onSave(dispensaryToSave);
        return;
      } else {
        setFormError(data.message || (isEdit ? 'Error updating dispensary.' : 'Error creating dispensary.'));
      }
    } catch (err) {
      console.error(err);
      setFormError('Something went wrong. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 px-2">
      <h3 className="text-xl font-bold text-orange-700">
        {initialData?._id ? 'Edit Dispensary' : 'Create Dispensary'}
      </h3>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Dispensary Name *</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Dispensary name"
          required
          className="border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 w-full rounded-lg"
        />
      </div>

      {/* Legal Name */}
      {/* <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Legal Name *</label>
        <input
          name="legalName"
          value={form.legalName}
          onChange={handleChange}
          placeholder="Legal business name"
          required
          className="border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 w-full rounded-lg"
        />
      </div> */}

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
        <AddressAutocomplete
          value={form.address}
          onChange={(address) => {
            setForm((prev) => ({
              ...prev,
              address: {
                ...address,
                street2: address.street2 ?? '',
              },
            }));
          }}
          required
        />
      </div>

      {/* License Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">License Number *</label>
        <input
          name="licenseNumber"
          value={form.licenseNumber}
          onChange={handleChange}
          placeholder="License number"
          required
          className="border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 w-full rounded-lg"
        />
      </div>

      {/* Phone & Website */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input
            name="phoneNumber"
            value={form.phoneNumber}
            onChange={handleChange}
            placeholder="Phone number"
            className="border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 w-full rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
          <input
            name="websiteUrl"
            type="url"
            value={form.websiteUrl}
            onChange={handleChange}
            placeholder="https://example.com"
            className="border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 w-full rounded-lg"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description of your dispensary"
          className="border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 w-full rounded-lg"
          rows={3}
        />
      </div>

      {/* Hours */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Operating Hours (optional)</label>
        <div className="space-y-2">
          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
            <div key={day} className="flex items-center gap-2">
              <label className="w-24 text-sm capitalize">{day}:</label>
              <input
                name={day}
                value={hoursForm[day as keyof typeof hoursForm]}
                onChange={handleHoursChange}
                placeholder="e.g., 9:00 AM - 5:00 PM"
                className="flex-1 border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 rounded-lg"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Promotions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Weekly Promotions (optional)</label>
        <p className="text-xs text-gray-500 mb-2">Add daily specials or recurring promotions for each day of the week.</p>
        <div className="space-y-2">
          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
            <div key={day} className="flex items-center gap-2">
              <label className="w-24 text-sm capitalize">{day}:</label>
              <input
                name={day}
                value={promotionsForm[day as keyof typeof promotionsForm]}
                onChange={handlePromotionsChange}
                placeholder="e.g., 20% off all edibles"
                className="flex-1 border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 rounded-lg"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Accessories & Merch */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Accessories & Merch (optional)</label>
        <p className="text-xs text-gray-500 mb-2">Highlight discounted non-cannabis items like rolling papers, apparel, glassware, etc. This does not count toward your deal/SKU limit.</p>
        <textarea
          name="accessoriesMerch"
          value={form.accessoriesMerch}
          onChange={handleChange}
          placeholder="e.g., 20% off all rolling papers this week&#10;Buy 2 get 1 free on branded apparel&#10;New glassware arrivals — 15% off"
          className="border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 w-full rounded-lg"
          rows={4}
        />
      </div>

      {/* Access Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Access Type *
        </label>
        <select
          name="accessType"
          value={form.accessType}
          onChange={handleChange}
          required
          className="border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 w-full rounded-lg"
        >
          <option value="medical">Medical</option>
          <option value="recreational">Recreational</option>
          <option value="medical/recreational">Medical & Recreational</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">Each location can independently set its access type</p>
      </div>

      {/* Amenities */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {amenitiesOptions.map((amenity) => (
            <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.amenities.includes(amenity)}
                onChange={() => handleAmenityChange(amenity)}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">{amenity}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Logo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
        
        {/* Logo Preview */}
        {logoPreview && (
          <div className="mb-3 relative inline-block">
            <img
              src={logoPreview}
              alt="Logo preview"
              className="w-32 h-32 object-contain border border-gray-300 rounded-lg"
            />
            <button
              type="button"
              onClick={handleRemoveLogo}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
              aria-label="Remove logo"
            >
              ×
            </button>
          </div>
        )}

        {/* Logo Upload */}
        <div className="mb-2">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleLogoUpload(e.target.files?.[0] || null)}
            disabled={uploadingLogo}
            className="border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 w-full rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {uploadingLogo && (
            <p className="text-sm text-orange-600 mt-1">Uploading logo...</p>
          )}
        </div>

        {/* Manual URL Input (Optional) */}
        <input
          name="logo"
          type="url"
          value={form.logo}
          onChange={handleChange}
          placeholder="Or enter logo URL manually"
          className="border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 w-full rounded-lg"
        />
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

      {formError && (
        <div className="p-3 bg-red-100 text-red-800 rounded">{formError}</div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 justify-end pb-4">
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
          {initialData?._id ? 'Update Dispensary' : 'Create Dispensary'}
        </button>
      </div>
    </form>
  );
}
