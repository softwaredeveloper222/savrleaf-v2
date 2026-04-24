import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';

const envFileName =
  process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
const envPath = path.resolve(process.cwd(), envFileName);
dotenv.config({ path: envPath });

import User from '../src/models/User.js';
import Application from '../src/models/Application.js';
import Deal from '../src/models/Deal.js';
import Dispensary from '../src/models/Dispensary.js';
import Subscription from '../src/models/Subscription.js';
import SubscriptionTier from '../src/models/SubscriptionTier.js';

async function fixEmailIndex() {
  await mongoose.connect(process.env.MONGODB_URI);

  const collection = mongoose.connection.collection('applications');
  const indexes = await collection.indexes();
  const emailIndex = indexes.find(idx => idx.name === 'email_1');
  if (emailIndex) {
    console.log('Dropping unique email index...');
    await collection.dropIndex('email_1');
  }

  console.log('Creating non-unique index on email...');
  await collection.createIndex({ email: 1 });

  console.log('✅ Done fixing email index');
  await mongoose.disconnect();
}

// Slug generator using short random string
function randomSlug(base, dispensaryId, dealIndex) {
  const randStr = Math.random().toString(36).substring(2, 8);
  return `${base.toLowerCase().replace(/\s+/g, '-')}-${dispensaryId.toString().slice(-5)}-${dealIndex}-${randStr}`;
}

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);

  console.log('📦 Clearing collections...');
  await Promise.all([
    User.deleteMany(),
    Application.deleteMany(),
    Deal.deleteMany(),
    Dispensary.deleteMany(),
    Subscription.deleteMany(),
    SubscriptionTier.deleteMany(),
  ]);

  // Drop indexes on deals to avoid unique slug conflicts
  const dealCollection = mongoose.connection.collection('deals');
  try {
    await dealCollection.dropIndexes();
    console.log('Dropped indexes on deals collection');
  } catch (err) {
    if (err.codeName === 'NamespaceNotFound') {
      console.log('No indexes to drop on deals collection');
    } else {
      throw err;
    }
  }

  console.log('👑 Creating admin user...');
  await User.create({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin',
  });

  console.log('💎 Creating subscription tiers...');
  const tiers = await SubscriptionTier.insertMany([
    {
      name: 'starter',
      displayName: 'Starter',
      tier: 1,
      monthlyPrice: 79.99,
      annualPrice: 959.88,
      baseSKULimit: 9999,
      features: ['Unlimited active discounts'],
    },
    {
      name: 'growth',
      displayName: 'Growth',
      tier: 2,
      monthlyPrice: 129,
      annualPrice: 1548,
      baseSKULimit: 25,
      features: ['Up to 25 active discounts'],
    },
    {
      name: 'pro',
      displayName: 'Pro',
      tier: 3,
      monthlyPrice: 189,
      annualPrice: 2268,
      baseSKULimit: 40,
      features: ['Up to 40 active discounts'],
    },
  ]);

  const categories = ['flower', 'edibles', 'concentrates', 'vapes', 'topicals', 'accessories', 'other'];
  const brands = ['High Spirits', 'Green Wave', 'Herbal Bliss', 'Cloud Nine', 'Pure Leaf'];
  const strains = ['OG Kush', 'Sour Diesel', 'Blue Dream', 'Pineapple Express', 'Gelato'];

  // create a dispensary + 5 deals for a given partner
  async function createDispensaryWithDeals(user, appIndex, suffix = '') {
    const application = await Application.create({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: 'password123',
      dispensaryName: `Dispensary ${appIndex}${suffix}`,
      legalName: `Dispensary ${appIndex}${suffix} LLC`,
      address: {
        street1: `${100 + appIndex} Bud Lane`,
        street2: '',
        city: 'New York',
        state: 'NY',
        zipCode: `1000${appIndex}`,
      },
      licenseNumber: `LIC${appIndex}${suffix}23456`,
      phoneNumber: `+12345678${appIndex}0`,
      websiteUrl: `https://dispensary${appIndex}${suffix}.example.com`,
      description: `A great dispensary number ${appIndex}${suffix}`,
      amenities: ['Parking', 'Wheelchair Accessible'],
      status: 'approved',
      adminNotes: 'Seed data',
      // store the tier used for this partner for visibility in the application record
      subscriptionTier: user.subscription ? user.subscription.tier : null,
    });

    const dispensary = await Dispensary.create({
      name: application.dispensaryName,
      legalName: application.legalName,
      address: application.address,
      licenseNumber: application.licenseNumber,
      status: 'approved',
      application: application._id,
      user: user._id,
      phoneNumber: application.phoneNumber,
      websiteUrl: application.websiteUrl,
      description: application.description,
      amenities: application.amenities,
      adminNotes: 'Created from seed',
    });

    // create some deals for the dispensary
    for (let d = 1; d <= 5; d++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const brand = brands[Math.floor(Math.random() * brands.length)];
      const strain = strains[Math.floor(Math.random() * strains.length)];
      const originalPrice = Math.floor(Math.random() * 50) + 10;
      const salePrice = Math.floor(originalPrice * 0.7);

      await Deal.create({
        title: `${brand} ${strain} Deal ${d}`,
        slug: randomSlug(`${brand}-${strain}-deal`, dispensary._id, d),
        description: `Special deal ${d} at ${application.dispensaryName}`,
        brand,
        category,
        subcategory: category === 'flower' ? 'indica' : '',
        strain,
        thcContent: Math.floor(Math.random() * 30),
        cbdContent: Math.floor(Math.random() * 10),
        tags: ['discount', category, 'limited time'],
        originalPrice,
        salePrice,
        images: [`https://picsum.photos/seed/${appIndex}${suffix}-${d}/400/300`],
        dispensary: dispensary._id,
        startDate: new Date(),
        endDate: new Date(Date.now() + (7 + d) * 24 * 60 * 60 * 1000),
        accessType: 'medical',
        manuallyActivated: false,
      });
    }

    // add dispensary to user's dispensaries array
    user.dispensaries = user.dispensaries || [];
    user.dispensaries.push(dispensary._id);
    await user.save();

    return dispensary;
  }

  console.log('🤝 Creating partners, subscriptions, dispensaries, and deals...');
  for (let i = 1; i <= 3; i++) {
    // create partner
    const partner = await User.create({
      firstName: `Partner${i}`,
      lastName: 'User',
      email: `partner${i}@example.com`,
      password: 'password123',
      role: 'partner',
    });

    // pick a random tier for this partner
    const chosenTier = tiers[Math.floor(Math.random() * tiers.length)];

    // create ONE subscription per partner
    const subscription = await Subscription.create({
      // use a user field on the subscription (you said you'd move subscription to user)
      user: partner._id,
      tier: chosenTier._id,
      stripeSubscriptionId: `sub_${i}_abcdef123456`,
      stripeCustomerId: `cus_${i}_abcdef123456`,
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      billingInterval: 'month',
      bonusSkus: 0,
      metadata: { source: 'seed script' },
    });

    // attach subscription to the partner
    partner.subscription = subscription._id;
    await partner.save();

    // create one dispensary (and deals)
    await createDispensaryWithDeals(partner, i);

    // optionally create a second dispensary for partner 1 to test multi-dispensary owner
    if (i === 1) {
      await createDispensaryWithDeals(partner, i, '-B');
    }
  }

  console.log('✅ Seeded all data successfully');
  await mongoose.disconnect();
}

fixEmailIndex()
  .then(() => seed())
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
