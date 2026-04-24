'use client';

import { useForm, Controller } from 'react-hook-form';
import axios, { AxiosError } from 'axios';
import { useState } from 'react';
import { SubscriptionTier } from '@/types';
import { amenitiesOptions } from '@/constants/amenities';
import AddressAutocomplete from './AddressAutocomplete';

type DispensaryApplicationFormProps = {
  selectedTier: SubscriptionTier | null;
};

type ApplicationFormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dispensaryName: string;
  legalName: string;
  address: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
  };
  licenseNumber: string;
  phoneNumber?: string;
  websiteUrl?: string;
  description?: string;
  amenities: string[];
  subscriptionTier: string;
  additionalLocationsCount: number;
  accessType: 'medical' | 'recreational' | 'medical/recreational';
};

export default function DispensaryApplicationForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, control } = useForm<ApplicationFormData>({
    defaultValues: { 
      amenities: [],
      address: {
        street1: '',
        street2: '',
        city: '',
        state: '',
        zipCode: '',
      },
      additionalLocationsCount: 0,
      accessType: 'medical',
    }
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<ApplicationFormData | null>(null);

  async function onSubmit(data: ApplicationFormData) {
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const subscriptionTiers = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/subscription-tiers`);
      if (subscriptionTiers.status !== 200) {
        setErrorMessage('Failed to fetch subscription tier.');
        return;
      }
      const subscriptionTier = subscriptionTiers.data.find((tier: SubscriptionTier) => tier.name === 'main_location');
      // 1️⃣ Submit application
      const appResp = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/applications`, {
        ...data,
        subscriptionTier: subscriptionTier._id
      });
      const subscriptionId = appResp.data.subscriptionId;

      // 2️⃣ Create Stripe Checkout session
      const checkoutResp = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/create-subscription-session`,
        { subscriptionId }
      );

      const { url } = checkoutResp.data;
      if (url) {
        // 3️⃣ Redirect to Stripe
        window.location.href = url;
      } else {
        setErrorMessage('Failed to create Stripe Checkout session.');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || err.message || 'Something went wrong');
    }
  }

  // if (submittedData) {
  //   return (
  //     <div className="max-w-4xl mx-auto p-8 bg-white rounded shadow border border-orange-100">
  //       <h2 className="text-3xl font-semibold text-orange-600 mb-4">Thank you for your application!</h2>
  //       <p className="mb-6 text-gray-700">
  //         You will be notified when your application is approved so you can make your payment and access your dashboard.
  //       </p>

  //       <h3 className="text-xl font-semibold mb-2">Submission Summary:</h3>
  //       <div className="space-y-3 text-gray-800">
  //         <p><strong>Name:</strong> {submittedData.firstName} {submittedData.lastName}</p>
  //         <p><strong>Email:</strong> {submittedData.email}</p>
  //         <p><strong>Dispensary Name:</strong> {submittedData.dispensaryName}</p>
  //         <p><strong>Legal Name:</strong> {submittedData.legalName}</p>
  //         <p><strong>License Number:</strong> {submittedData.licenseNumber}</p>
  //         <p><strong>Phone Number:</strong> {submittedData.phoneNumber || 'N/A'}</p>
  //         <p><strong>Website URL:</strong> {submittedData.websiteUrl || 'N/A'}</p>
  //         <p><strong>Description:</strong> {submittedData.description || 'N/A'}</p>
  //         <p><strong>Address:</strong> {`${submittedData.address.street1}${submittedData.address.street2 ? ', ' + submittedData.address.street2 : ''}, ${submittedData.address.city}, ${submittedData.address.state} ${submittedData.address.zipCode}`}</p>
  //         <p><strong>Amenities:</strong> {submittedData.amenities.length ? submittedData.amenities.join(', ') : 'None'}</p>
  //         <p><strong>Subscription Tier:</strong> {selectedTier?.displayName}</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-white min-h-screen py-12 px-4 sm:px-6 lg:px-8 font-inter">
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-10 rounded-3xl shadow-2xl border border-orange-100">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
          {/* PERSONAL INFO */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-orange-500">Contact</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormField label="First Name*" error={errors.firstName?.message}>
                <input {...register('firstName', { required: 'First name is required' })} className="input" />
              </FormField>
              <FormField label="Last Name*" error={errors.lastName?.message}>
                <input {...register('lastName', { required: 'Last name is required' })} className="input" />
              </FormField>
              <FormField label="Email*" error={errors.email?.message} className="sm:col-span-2">
                <input
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+$/, message: 'Invalid email' },
                  })}
                  className="input"
                />
              </FormField>
              <FormField label="Password*" error={errors.password?.message} className="sm:col-span-2">
                <input
                  type="password"
                  {...register('password', { required: 'Password is required', minLength: 6 })}
                  className="input"
                />
              </FormField>
            </div>
          </section>

          {/* DISPENSARY INFO */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-orange-500">Dispensary Info</h2>
            <div className="grid grid-cols-1 sm:grid-cols-1 gap-0">
              <FormField label="Dispensary Name*">
                <input {...register('dispensaryName', { required: true })} className="input" />
              </FormField>
              {/* <FormField label="Legal Name*">
                <input {...register('legalName', { required: true })} className="input" />
              </FormField> */}
              <FormField label="License Number*" className="sm:col-span-2">
                <input {...register('licenseNumber', { required: true })} className="input" />
              </FormField>
              <FormField label="Phone Number" error={errors.phoneNumber?.message} className="sm:col-span-2">
                <input
                  type="tel"
                  {...register('phoneNumber', {
                    pattern: {
                      value: /^\+?[1-9]\d{1,14}$/,
                      message: 'Invalid phone number',
                    },
                  })}
                  className="input"
                />
              </FormField>
              <FormField label="Website URL" className="sm:col-span-2">
                <input type="url" {...register('websiteUrl')} className="input" />
              </FormField>
              <FormField label="Description" className="sm:col-span-2">
                <textarea {...register('description')} rows={4} className="input resize-y" />
              </FormField>
            </div>
          </section>

          {/* ADDRESS */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-orange-500">Address</h2>
            <Controller
              name="address"
              control={control}
              rules={{
                required: true,
                validate: (value) => {
                  if (!value?.street1 || !value?.city || !value?.state || !value?.zipCode) {
                    return 'All address fields are required';
                  }
                  const zipRegex = /^\d{5}(-\d{4})?$/;
                  if (!zipRegex.test(value.zipCode)) {
                    return 'Invalid zip code';
                  }
                  return true;
                },
              }}
              render={({ field }) => (
                <AddressAutocomplete
                  value={field.value || { street1: '', street2: '', city: '', state: '', zipCode: '' }}
                  onChange={field.onChange}
                  required
                />
              )}
            />
            {errors.address && (
              <p className="text-red-600 text-sm mt-1">
                {errors.address.message || 'Address is required'}
              </p>
            )}
          </section>

          {/* AMENITIES */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-orange-500">Amenities</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {amenitiesOptions.map((option) => (
                <label key={option} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    value={option}
                    {...register('amenities')}
                    className="form-checkbox text-orange-600 rounded"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </section>

          {/* AdditionalLocationsCount */}
          <section> 
            <h2 className="text-2xl font-semibold mb-4 text-orange-500">Additional Locations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-1 gap-0">
              <label className="block font-medium text-sm text-gray-800 mb-1">Additional Locations</label>
              <input type="number" min={0} step={1} {...register('additionalLocationsCount', { required: true, min: 0 })} className="input" />
            </div>  
          </section>
          

          {/* AccessType(Medical or Recreational or Both) */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-orange-500">Access Type</h2>
            <div className="grid grid-cols-1 sm:grid-cols-1 gap-0">
              <label className="block font-medium text-sm text-gray-800 mb-1">Access Type</label>
              <select {...register('accessType' as const)} className="input">
                <option value="medical">Medical</option>
                <option value="recreational">Recreational</option>
                <option value="medical/recreational">Medical & Recreational</option>
              </select>
            </div>
          </section>


          {errorMessage && (
            <div className="mb-6 p-4 text-red-700 bg-red-100 border border-red-300 rounded">
              {errorMessage}
            </div>
          )}
          <div className="pt-8">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({
  label,
  error,
  className = '',
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="block font-medium text-sm text-gray-800 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  );
}
