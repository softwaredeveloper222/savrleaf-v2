import Modal from '@/components/Modal';
import DispensaryForm from '@/components/DispensaryForm';
import { Dispensary, Subscription, User } from '@/types';
import axios from 'axios';
import React, { useState } from 'react';

interface UserInfoProps {
  user: User | null;
  dispensaries?: Dispensary[];
}

export default function UserInfo({ user, dispensaries: dispensariesProp }: UserInfoProps) {
  // All hooks must be called before any early returns
  const [isOpen, setIsOpen] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email] = useState(user?.email ?? '');
  const [mainDispensary, setMainDispensary] = useState<Dispensary | null>(dispensariesProp?.[0] ?? null);
  const [dispensaryUpdated, setDispensaryUpdated] = useState(false);

  if (!user) {
    return (
      <p className="text-center text-gray-500 mt-8">
        User information not available.
      </p>
    );
  }

  const fullName =
    user.firstName || user.lastName
      ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
      : 'N/A';

  const subscription = user.subscription;
  const tier = subscription?.tier;
  const baseLimit = tier?.baseSKULimit ?? 0;
  const bonus = subscription?.bonusSkus ?? 0;
  const override = subscription?.adminSkuOverride ?? null;
  const maxSKUs = override !== null ? override : baseLimit + bonus;
  const usedSKUs = user.usedSKUs ?? 0;
  
  const onClose = () => {
    setIsOpen(false);
  };

  const handleDispensarySave = async (updatedDispensary: Dispensary) => {
    setMainDispensary(updatedDispensary);
    setDispensaryUpdated(true);
    // Optionally refresh the page or show success message
  };

  const handleUserInfoSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/users/${user?.id}/update-user-info`, { 
        firstName, 
        lastName, 
        mainDispensary: mainDispensary ? {
          name: mainDispensary.name,
          legalName: mainDispensary.legalName,
          address: mainDispensary.address,
          licenseNumber: mainDispensary.licenseNumber,
          phoneNumber: mainDispensary.phoneNumber,
          websiteUrl: mainDispensary.websiteUrl,
          description: mainDispensary.description,
          amenities: mainDispensary.amenities,
          logo: mainDispensary.logo,
          images: mainDispensary.images,
        } : null
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (res.data.success) {
        setIsOpen(false);
        // Optionally refresh the page or show success message
        window.location.reload();
      }
    } catch (err) {
      console.error('Error updating user:', err);
    }
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white max-w-md mx-auto p-6 rounded-2xl shadow-lg">
        <h2 className="text-3xl font-extrabold mb-6 text-orange-700">User Information</h2>

        <div className="space-y-4 text-gray-700">
          <p>
            <span className="font-semibold">Name:</span>{' '}
            <span className="text-gray-900">{fullName}</span>
          </p>

          <p>
            <span className="font-semibold">Email:</span>{' '}
            <span className="text-gray-900">{user.email}</span>
          </p>

          <p>
            <span className="font-semibold">Role:</span>{' '}
            <span className="capitalize text-gray-900">{user.role}</span>
          </p>
        </div>

        {/* --- Subscription Section ---
        {subscription ? (
          <div className="mt-8 border-t pt-6">
            <h3 className="text-xl font-bold text-orange-700 mb-4">Subscription</h3>

            <p>
              <span className="font-semibold">Status:</span>{' '}
              <span className="capitalize text-gray-900">{subscription.status}</span>
            </p>

            <p>
              <span className="font-semibold">Base SKU Limit:</span>{' '}
              {baseLimit}
            </p>

            <p>
              <span className="font-semibold">Bonus SKUs:</span>{' '}
              {bonus}
            </p>

            {override !== null && (
              <p>
                <span className="font-semibold">Admin Override:</span>{' '}
                {override}
              </p>
            )}
            <p className="mt-2 font-semibold text-gray-900">
              SKUs Used: {usedSKUs} / {maxSKUs}
            </p>
            <p className="mt-2 font-semibold text-gray-900">
              Total Allowed SKUs: {maxSKUs}
            </p>
          </div>
        ) : (
          <p className="mt-8 text-sm italic text-gray-500">
            No active subscription found.
          </p>
        )} */}

        <p className="mt-8 text-sm text-gray-500 italic text-center">
          If you need to make any changes to your information, feel free to{' '}
          <a
            href="mailto:support@savrleafdeals.com"
            className="text-orange-600 hover:underline"
          >
            reach out to us
          </a>
          .
        </p>
        {/* edit profile button */}
        <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700" onClick={() => setIsOpen(true)}>
          Edit Profile
        </button>
      </div>
      {/* edit profile modal */}
      <Modal isOpen={isOpen} onClose={onClose} maxWidth="4xl">
        <div className="space-y-8 p-6">
          <h3 className="text-2xl font-bold mb-6 text-orange-700">Edit Profile</h3>

          {/* User Information Section */}
          <form onSubmit={handleUserInfoSubmit} className="space-y-6">
            <div className="border-b border-gray-200 pb-2">
              <h4 className="text-lg font-semibold text-gray-800">User Information</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  disabled
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  value={email}
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
            </div>

            {/* Form Actions for User Info */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              >
                Save User Info
              </button>
            </div>
          </form>

          {/* Dispensary Information Section */}
          {mainDispensary && (
            <div className="space-y-6 border-t border-gray-200 pt-6">
              <div className="border-b border-gray-200 pb-2">
                <h4 className="text-lg font-semibold text-gray-800">Dispensary Information</h4>
              </div>
              <DispensaryForm
                initialData={mainDispensary}
                onSave={handleDispensarySave}
                onCancel={() => {
                  // Don't close modal, just allow user to continue editing
                }}
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}