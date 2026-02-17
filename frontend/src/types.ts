export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface Coordinates {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface GenericDispensary {
  _id: string;
  name: string;
  address: Address;
  coordinates?: Coordinates;
  licenseNumber?: string;
  websiteUrl?: string;
  phoneNumber?: string;
  email?: string;
  description?: string;
  amenities: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Dispensary {
  _id: string;
  name: string;
  legalName?: string;
  address: Address;
  coordinates: Coordinates;
  licenseNumber: string;
  websiteUrl?: string;
  phoneNumber?: string;
  hours?: Record<string, string>;
  weeklyPromotions?: Record<string, string>;
  description?: string;
  amenities: string[];
  logo?: string;
  images?: string[];
  status?: 'pending' | 'approved' | 'rejected';
  application: string;
  user: string;
  subPartnerEmail?: string;
  subPartnerPassword?: string;
  subscription?: Subscription | null;
  adminNotes?: string;
  ratings?: number[];
  isActive?: boolean;
  skuLimit: number;
  isPurchased: boolean;
  type: 'main' | 'additional';
  usedSkus: number;
  extraLimit: number;
  additionalSkuLimit: number;
  accessType?: 'medical' | 'recreational' | 'medical/recreational';
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
  isGeneric?: boolean;
}

export interface Deal {
  _id: string;
  title: string;
  brand?: string;
  tags: string[];
  description?: string;
  originalPrice: number;
  salePrice: number;
  images: string[];
  dispensary: Dispensary | string;
  startDate: string;
  endDate: string;
  slug?: string;
  manuallyActivated: boolean;
  category: 'flower' | 'edibles' | 'concentrates' | 'vapes' | 'topicals' | 'pre-roll' | 'tincture' | 'beverage' | 'capsule/pill' | 'other';
  subcategory?: string; // For Flower: 'ground-flower', 'baby-buds-popcorn', or custom
  descriptiveKeywords?: string[]; // e.g., 'relaxing', 'focused', 'uplifting', 'calming', etc.
  strain?: "indica" | "indica-dominant hybrid" | "hybrid" | "sativa-dominant hybrid" | "sativa";
  thcContent?: number;
  cbdContent?: number;
  deal_purchase_link?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type SubscriptionTier = {
  _id: string;
  name: string;
  displayName: string;
  tier: number;
  baseSKULimit: number;
  monthlyPrice: number;
  annualPrice: number;
  annualBonusSKUs: number;
  description?: string;
  features: string[];
  isActive: boolean;
  sortOrder?: number;
};

export interface User {
  _id: string;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'partner' | 'admin';
  isActive: boolean;
  allowMultipleLocations: boolean;
  dispensaries?: string[];
  subscription?: {
    _id: string;
    status: string;
    additionalLocationsCount?: number;
    bonusSkus?: number;
    adminSkuOverride?: number | null;
    tier?: {
      _id: string;
      displayName: string;
      baseSKULimit?: number;
    };
  };
  usedSKUs?: number;
}

export interface Application {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  subscriptionTier: SubscriptionTier | string;
  dispensaryName: string;
  legalName: string;
  address: Address;
  licenseNumber: string;
  phoneNumber?: string;
  websiteUrl?: string;
  description?: string;
  amenities: string[];
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type SubscriptionStatus =
  | "inactive"
  | "active"
  | "trialing"
  | "past_due"
  | "unpaid"
  | "canceled";

export type BillingInterval = "month" | "year";

export interface Subscription {
  _id: string;
  dispensary: string;
  tier: SubscriptionTier;
  stripeSubscriptionId: string;
  // stripeCustomerId: string;
  status: SubscriptionStatus;
  startDate?: string;
  endDate?: string;
  currentPeriodEnd?: string;
  billingInterval: BillingInterval;
  bonusSkus: number;
  adminSkuOverride?: number | null;
  metadata: Record<string, string | number | boolean | object | null>;
  createdAt: string;
  updatedAt: string;
}
