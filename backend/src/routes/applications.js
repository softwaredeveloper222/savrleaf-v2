import express from 'express';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import Application from '../models/Application.js';
import Dispensary from '../models/Dispensary.js';
import authMiddleware, { adminMiddleware } from '../middleware/authMiddleware.js';
import { generateActivationToken, generateActivationLink, sendActivationLink } from '../utils/user.js';
import crypto from 'crypto';
const router = express.Router();

// Generate a random password
const generateRandomPassword = () => {
  return crypto.randomBytes(16).toString('hex');
};

// Generate unique email for additional location users
const generateLocationEmail = (baseEmail, locationNumber) => {
  const [localPart, domain] = baseEmail.split('@');
  return `${localPart}+location${locationNumber}@${domain}`;
};

router.post('/', async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    password,
    dispensaryName,
    address,
    licenseNumber,
    phoneNumber,
    websiteUrl,
    description,
    amenities,
    subscriptionTier,
    accessType,
    additionalLocationsCount,
  } = req.body;

  try {
    // 1️⃣ Hash password
    // const hashedPassword = await bcrypt.hash(password, 10);

    let user = await User.findOne({ email });
    // 2️⃣ Create Application
    
    // 3️⃣ Create User immediately but inactive
    const activationToken = generateActivationToken();
    const activationLink = generateActivationLink(activationToken);
    console.log("activationLink", activationLink);
    if (!user) {
      user = await User.create({
        firstName,
        lastName,
        email,
        password,
        activationToken,
        expirationTime: Date.now() + 1000 * 60 * 60 * 24, // 24 hours
        role: 'partner',
        isActive: false, // cannot log in until payment
        isActiveByLink: false,
        firstLogin: true,
      });
    } else {
      // Allow re-application if previous application was rejected
      const existingApp = await Application.findOne({ user: user._id }).sort({ createdAt: -1 });
      if (existingApp && existingApp.status === 'rejected') {
        // Reuse existing user, update their info
        user.firstName = firstName;
        user.lastName = lastName;
        user.isActive = false;
        user.activationToken = activationToken;
        user.expirationTime = Date.now() + 1000 * 60 * 60 * 24;
        await user.save();
      } else {
        return res.status(400).json({ error: `User already exists.` });
      }
    }
    
    const application = new Application({
      user: user._id,
      firstName,
      lastName,
      email,
      password,
      dispensaryName,
      address,
      licenseNumber,
      phoneNumber,
      websiteUrl,
      description,
      amenities,
      subscriptionTier,
      accessType,
      additionalLocationsCount,
      status: 'pending',
    });
    await application.save();
    // 4️⃣ Create pending subscription (Stripe session later)
    const subscription = await Subscription.create({
      user: user._id,
      tier: subscriptionTier,
      status: 'pending', // waiting for Stripe payment
      startDate: new Date(),
      metadata: { source: 'application_submission' },
      additionalLocationsCount: additionalLocationsCount,
    });
    
    const dispensary = await Dispensary.create({
      name: dispensaryName,
      application: application._id,
      address: address,
      licenseNumber: licenseNumber,
      phoneNumber: phoneNumber,
      websiteUrl: websiteUrl,
      description: description,
      amenities: amenities,
      status: 'pending',
      application: application._id,
      user: user._id,
      subscription: subscription._id,
      accessType: accessType,
      additionalLocationsCount: additionalLocationsCount,
    });
    await dispensary.save();

    user.subscription = subscription._id;
    await user.save();
    
    // Send activation email
    try {
        await sendActivationLink(email, activationLink);
    } catch (emailError) {
        console.error('Failed to send activation email:', emailError);
        // Continue even if email fails - user can request resend
    }
    
    // ✅ Return subscription ID for frontend Stripe integration
    res.status(201).json({
      message: 'Application submitted. User created. Proceed to payment.',
      application,
      user,
      subscriptionId: subscription._id, // 👈 important
    });

  } catch (error) {
    console.error(error);
    if (error.code === 11000 && error.keyValue?.email) {
      return res.status(400).json({ error: `Email ${error.keyValue.email} is already in use.` });
    }
    res.status(400).json({ error: 'Error submitting application' });
  }
});

router.post('/:id/approve', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    if (application.status === 'approved') {
      return res.status(400).json({ message: 'Already approved' });
    }

    // Find the associated user
    const user = await User.findOne({ email: application.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found for this application' });
    }

    // Check if payment has been completed (subscription should be active)
    const subscription = await Subscription.findOne({ user: user._id });
    if (!subscription || subscription.status !== 'active') {
      return res.status(400).json({ 
        message: 'Payment not completed. Cannot approve application until payment is received.' 
      });
    }

    // Update application status
    application.status = 'approved';
    await application.save();

    // Activate user
    user.isActive = true;
    await user.save();

    const additionalLocationsCount = application.additionalLocationsCount || 0;
    const accessType = application.accessType || 'medical';
    const totalLocations = 1 + additionalLocationsCount; // 1 main + additional
    const createdDispensaries = [];

    // Delete any existing dispensaries for this application (cleanup)
    await Dispensary.deleteMany({ application: application._id });

    const createdUsers = []; // Track created users for additional locations

    // Create all locations: 1 main + additionalLocationsCount additional
    for (let i = 0; i < totalLocations; i++) {
      const isMain = i === 0;
      const locationNumber = !isMain ? ` - Location ${i + 1}` : '';
      const dispensaryName = !isMain 
        ? `${application.dispensaryName}${locationNumber}`
        : application.dispensaryName;

      let dispensaryUser = user; // Default to main user
      
      // Create a new user for each additional location
      const locationEmail = generateLocationEmail(application.email, i);
      const randomPassword = generateRandomPassword();
      if (!isMain) {
        
        // Check if user with this email already exists
        let existingLocationUser = await User.findOne({ email: locationEmail });
        
        if (!existingLocationUser) {
          dispensaryUser = await User.create({
            firstName: application.firstName,
            lastName: application.lastName,
            email: locationEmail,
            password: randomPassword,
            role: 'partner',
            isSubPartner: true,
            isActive: true, // Active immediately
            isActiveByLink: true,
            firstLogin: true,
            subscription: subscription._id,
          });
          createdUsers.push({
            email: locationEmail,
            password: randomPassword,
            dispensaryName: dispensaryName,
          });
        } else {
          // If user exists, use it and ensure it's active
          dispensaryUser = existingLocationUser;
          dispensaryUser.isActive = true;
          await dispensaryUser.save();
        }
      }

      const dispensary = await Dispensary.create({
        name: dispensaryName,
        address: {
          street1: application.address.street1,
          street2: application.address.street2,
          city: application.address.city,
          state: application.address.state,
          zipCode: application.address.zipCode,
        },
        subPartnerEmail: isMain ? "" : dispensaryUser.email,
        subPartnerPassword: isMain ? "" : randomPassword,
        application: application._id,
        licenseNumber: application.licenseNumber,
        websiteUrl: application.websiteUrl,
        phoneNumber: application.phoneNumber,
        description: application.description,
        amenities: application.amenities,
        user: isMain ? user._id : dispensaryUser._id,
        application: application._id,
        status: 'approved',
        skuLimit: 21, // Each location gets 21 SKUs
        isActive: true,
        isPurchased: true,
        type: isMain ? 'main' : 'additional',
        usedSkus: 0,
        extraLimit: 0,
        additionalSkuLimit: 0,
        subscription: subscription._id,
        accessType: accessType, // Each location can have its own accessType
      });

      createdDispensaries.push(dispensary);
    }

    res.json({
      message: `Application approved. Created ${totalLocations} location(s) (1 main + ${additionalLocationsCount} additional) with 15 SKUs each. Access type: ${accessType}.`,
      application,
      dispensaries: createdDispensaries,
      count: createdDispensaries.length,
      accessType,
      createdUsers: createdUsers.length > 0 ? createdUsers : undefined, // Include created users info
    });
  } catch (err) {
    console.error('Error approving application:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/:id/reject', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'Application not found' });

    const user = await User.findOne({ email: app.email });
    const dispensary = await Dispensary.findOne({ application: app._id });

    app.status = 'rejected';
    await app.save();

    if (dispensary) {
      dispensary.status = 'rejected';
      await dispensary.save();
    }

    if (user) {
      user.isActive = false;
      await user.save();

      // Cancel associated subscription
      const subscription = await Subscription.findOne({ user: user._id });
      if (subscription && subscription.status !== 'canceled') {
        subscription.status = 'canceled';
        await subscription.save();
      }
    }

    res.json({ message: 'Application, user, dispensary, and subscription rejected', application: app });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset rejected application back to pending (admin only)
router.post('/:id/reset', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    if (application.status !== 'rejected') {
      return res.status(400).json({ message: 'Only rejected applications can be reset' });
    }

    // Reset application status
    application.status = 'pending';
    await application.save();

    // Reactivate user
    const user = await User.findOne({ email: application.email });
    if (user) {
      user.isActive = false; // keep inactive until re-approved
      await user.save();

      // Reactivate subscription so approval check passes
      const subscription = await Subscription.findOne({ user: user._id });
      if (subscription && subscription.status !== 'active') {
        subscription.status = 'active';
        await subscription.save();
      }
    }

    // Reset dispensary status
    const dispensary = await Dispensary.findOne({ application: application._id });
    if (dispensary) {
      dispensary.status = 'pending';
      await dispensary.save();
    }

    res.json({ message: 'Application reset to pending. Ready for re-approval.', application });
  } catch (err) {
    console.error('Error resetting application:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Archive/unarchive application (admin only)
router.patch('/:id/archive', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    application.isArchived = true;
    await application.save();
    res.json({ message: 'Application archived', application });
  } catch (err) {
    console.error('Error archiving application:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/unarchive', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    application.isArchived = false;
    await application.save();
    res.json({ message: 'Application unarchived', application });
  } catch (err) {
    console.error('Error unarchiving application:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
