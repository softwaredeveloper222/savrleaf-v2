import express from 'express';
import User from '../models/User.js';
import Deal from '../models/Deal.js';
import Dispensary from '../models/Dispensary.js';
import { getDistanceFromCoords } from '../utils/geocode.js';
import { ensureDealHasImage } from '../utils/defaultCategoryImages.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Spec: deal_price D, discount_pct P = discount_tier/100
// original_price_est = D/(1-P), savings_amount_est = original_price_est - D, savings_percent = discount_tier
function attachDealValueFields(deal) {
  const D = deal.salePrice;
  const discountTier = deal.discountTier;
  let original_price_est = deal.originalPrice;
  if (!original_price_est && typeof discountTier === 'number' && D != null) {
    const P = discountTier / 100;
    if (P < 1) original_price_est = Math.round((D / (1 - P)) * 100) / 100;
  }
  let savings_amount_est = null;
  if (original_price_est != null && D != null && original_price_est >= D) {
    savings_amount_est = Math.round((original_price_est - D) * 100) / 100;
  }
  let savings_percent = null;
  if (typeof discountTier === 'number') {
    savings_percent = discountTier;
  } else if (original_price_est && D != null && original_price_est > 0) {
    savings_percent = Math.round((1 - D / original_price_est) * 100);
  }
  return {
    ...deal,
    discountPercent: savings_percent,
    estimatedOriginalPrice: original_price_est ?? null,
    estimatedSavings: savings_amount_est,
  };
}

router.get('/', async (req, res) => {
  try {
    const {
      category,
      priceRange,
      brand,
      title,
      search,
      lat,
      lng,
      distance = 25, // miles
      sortBy = 'distance',
      limit = 50,
      page = 1,
      dispensaryId,
      accessType,
      thcMin,
      thcMax,
      strain,
      maxSalePrice,
      tags,
    } = req.query;

    const filters = {};
    
    // Handle location-based filtering first
    let nearbyDispensaryIds = null;
    if (lat && lng && distance) {
      const distanceMeters = Number(distance) * 1609.34;

      const nearbyDispensaries = await Dispensary.find({
        coordinates: {
          $nearSphere: {
            $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
            $maxDistance: distanceMeters,
          },
        },
      }).select('_id');
      nearbyDispensaryIds = nearbyDispensaries.map((d) => d._id.toString());
      if (nearbyDispensaryIds.length === 0) {
        // No dispensaries in range, return empty results
        filters.dispensary = { $in: [] };
      }
    }
    // Apply dispensary filter (either specific ID or nearby ones)
    if (nearbyDispensaryIds && nearbyDispensaryIds.length > 0) {
      if (dispensaryId) {
        // Check if specific dispensary is in range
        if (nearbyDispensaryIds.includes(dispensaryId.toString())) {
          filters.dispensary = dispensaryId;
        } else {
          // Specific dispensary is not in range, return empty
          filters.dispensary = { $in: [] };
        }
      } else {
        // Filter by nearby dispensaries
        filters.dispensary = { $in: nearbyDispensaryIds };
      }
    } else if (dispensaryId && (!lat || !lng || !distance)) {
      // Only apply specific dispensary filter if location filtering is not active
      filters.dispensary = dispensaryId;
    }

    // Other filters
    if (category) filters.category = category;
    if (brand) filters.brand = { $regex: brand, $options: 'i' };
    if (title) filters.title = { $regex: title, $options: 'i' };
    if (accessType) filters.accessType = accessType;

    // THC Content filter
    if (thcMin !== undefined || thcMax !== undefined) {
      filters.thcContent = {};
      if (thcMin !== undefined) filters.thcContent.$gte = Number(thcMin);
      if (thcMax !== undefined) filters.thcContent.$lte = Number(thcMax);
    }

    // Strain filter
    if (strain) {
      filters.strain = strain;
    }

    // Tags filter (comma-separated)
    if (tags) {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      if (tagList.length > 0) {
        filters.tags = { $in: tagList };
      }
    }

    if (priceRange) {
      if (priceRange.includes('+')) {
        const minPrice = Number(priceRange.replace('+', ''));
        filters.salePrice = { $gte: minPrice };
      } else {
        const [min, max] = priceRange.split('-').map(Number);
        filters.salePrice = { $gte: min, $lte: max };
      }
    }

    if (maxSalePrice) {
      const max = Number(maxSalePrice);
      if (!Number.isNaN(max)) {
        filters.salePrice = { ...(filters.salePrice || {}), $lte: max };
      }
    }

    if (search) {
      filters.$or = [
        { title: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const perPage = Math.min(Number(limit), 100);
    const currentPage = Math.max(Number(page), 1);
    const skip = (currentPage - 1) * perPage;

    let query = Deal.find(filters).skip(skip).limit(perPage).populate('dispensary');

    if (sortBy === 'price_asc') {
      query = query.sort({ salePrice: 1 });
    } else if (sortBy === 'price_desc') {
      query = query.sort({ salePrice: -1 });
    } else if (sortBy !== 'distance') {
      query = query.sort({ createdAt: -1 });
    }
    
    const deals = await query.exec();

    
    
    let sortedDeals = deals;
    if (sortBy === 'distance' && lat && lng) {
      const userCoord = [Number(lng), Number(lat)];

      sortedDeals = deals.slice().sort((a, b) => {
        const aCoord = a.dispensary?.coordinates?.coordinates || [0, 0];
        const bCoord = b.dispensary?.coordinates?.coordinates || [0, 0];

        const aDist = getDistanceFromCoords(userCoord, aCoord);
        const bDist = getDistanceFromCoords(userCoord, bCoord);

        return aDist - bDist;
      });
    }

    // Value-based sorts applied after fetching
    if (sortBy === 'best_value') {
      sortedDeals = sortedDeals.slice().sort((a, b) => {
        const aPct = typeof a.discountTier === 'number'
          ? a.discountTier
          : (a.originalPrice && a.salePrice && a.originalPrice > 0
            ? (1 - a.salePrice / a.originalPrice) * 100
            : 0);
        const bPct = typeof b.discountTier === 'number'
          ? b.discountTier
          : (b.originalPrice && b.salePrice && b.originalPrice > 0
            ? (1 - b.salePrice / b.originalPrice) * 100
            : 0);
        return (bPct || 0) - (aPct || 0);
      });
    } else if (sortBy === 'biggest_savings') {
      sortedDeals = sortedDeals.slice().sort((a, b) => {
        const aOrig = a.originalPrice || (typeof a.discountTier === 'number'
          ? a.salePrice / (1 - a.discountTier / 100)
          : 0);
        const bOrig = b.originalPrice || (typeof b.discountTier === 'number'
          ? b.salePrice / (1 - b.discountTier / 100)
          : 0);
        const aSavings = aOrig && a.salePrice ? aOrig - a.salePrice : 0;
        const bSavings = bOrig && b.salePrice ? bOrig - b.salePrice : 0;
        return bSavings - aSavings;
      });
    } else if (sortBy === 'trending') {
      // Trending currently falls back to newest; engagement-based ordering is handled elsewhere.
      sortedDeals = sortedDeals.slice().sort((a, b) => {
        const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bCreated - aCreated;
      });
    }

    const countFilters = { ...filters };
    const totalCount = await Deal.countDocuments(countFilters);

    const now = new Date();
    sortedDeals = sortedDeals
      .map(deal => deal.toObject())
      .map(deal => {
        const withActive = {
          ...deal,
          active:
            deal.manuallyActivated ||
            (deal.startDate &&
             deal.endDate &&
             new Date(deal.startDate) <= now &&
             new Date(deal.endDate) >= now),
        };
        return attachDealValueFields(withActive);
      });


    res.json({
      success: true,
      deals: sortedDeals,
      pagination: {
        total: totalCount,
        page: currentPage,
        pages: Math.ceil(totalCount / perPage),
        perPage,
      },
    });
  } catch (err) {
    console.error('Error fetching filtered deals:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      originalPrice,
      salePrice,
      category,
      brand,
      startDate,
      endDate,
      tags,
      dispensary,
      images,
      userId,
      strain,
      thcContent,
      subcategory,
      descriptiveKeywords,
      deal_purchase_link,
      discountTier,
      sizeOrStrength,
    } = req.body;

    // const user = await User.findById(userId)
    //   .populate({
    //     path: 'subscription',
    //     populate: { path: 'tier' },
    //     strictPopulate: false
    //   })
    //   .populate('dispensaries');


    // if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    // if (!user.subscription) return res.status(400).json({ success: false, message: 'No subscription found for partner' });

    // const dispensaryIds = user.dispensaries.map(d => d._id);

    // const dealCount = await Deal.countDocuments({ dispensary: { $in: dispensaryIds } });

    // const baseLimit = user.subscription.tier?.baseSKULimit || 0;
    // const bonusSkus = user.subscription.bonusSkus || 0;
    // const adminBonusSkus = user.subscription.adminBonusSkus || 0;

    // const maxLimit = baseLimit + bonusSkus + adminBonusSkus;


    const dispensaryObject = await Dispensary.findById(dispensary);
    if (!dispensaryObject) {
      return res.status(404).json({ success: false, message: 'Dispensary not found' });
    }
    // SKU limit removed — unlimited per location
    // if (dispensaryObject.usedSkus >= dispensaryObject.skuLimit + dispensaryObject.additionalSkuLimit) {
    //   return res.status(400).json({ success: false, message: 'Discount limit reached' });
    // }

    // if (dealCount >= maxLimit) {
    //   return res.status(400).json({
    //     success: false,
    //     message: `Deal limit reached for your subscription tier. You can only create ${maxLimit} deals (current: ${dealCount})`
    //   });
    // }

    // Ensure deal has at least one image (use default category image if none provided)
    const dealImages = ensureDealHasImage(images, category);

    // Compute original price from sale price and discount tier when needed
    let effectiveOriginalPrice = originalPrice;
    if (!effectiveOriginalPrice && typeof discountTier === 'number' && salePrice) {
      const fraction = 1 - discountTier / 100;
      if (fraction > 0) {
        const est = salePrice / fraction;
        effectiveOriginalPrice = Math.round(est * 100) / 100;
      }
    }

    const newDeal = new Deal({
      title,
      description,
      originalPrice: effectiveOriginalPrice,
      salePrice,
      category,
      subcategory,
      brand,
      startDate,
      endDate,
      tags,
      dispensary,
      images: dealImages,
      strain,
      thcContent,
      descriptiveKeywords: descriptiveKeywords || [],
      deal_purchase_link,
      isActive: true,
      discountTier,
      sizeOrStrength: sizeOrStrength?.trim() || undefined,
    });

    const savedDeal = await newDeal.save();
    await savedDeal.populate('dispensary');
    dispensaryObject.usedSkus += 1;
    await dispensaryObject.save();
    res.status(201).json({ success: true, deal: savedDeal });

  } catch (err) {
    console.error('Error creating deal:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Savings ticker: aggregate savings and discount from active deals
router.get('/savings-ticker', async (req, res) => {
  try {
    const now = new Date();
    const { lat, lng, distance = 25 } = req.query;

    // Build active deal query
    const activeQuery = {
      $or: [
        { manuallyActivated: true },
        { startDate: { $lte: now }, endDate: { $gte: now } },
      ],
    };

    // If location provided, restrict to nearby dispensaries
    if (lat && lng) {
      const distanceMeters = Number(distance) * 1609.34;
      const nearbyDispensaries = await Dispensary.find({
        coordinates: {
          $nearSphere: {
            $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
            $maxDistance: distanceMeters,
          },
        },
      }).select('_id');
      const nearbyIds = nearbyDispensaries.map(d => d._id);
      if (nearbyIds.length > 0) {
        activeQuery.dispensary = { $in: nearbyIds };
      }
    }

    const deals = await Deal.find(activeQuery)
      .select('salePrice originalPrice discountTier manuallyActivated startDate endDate');

    const activeDeals = deals.filter(deal => {
      if (deal.manuallyActivated) return true;
      if (!deal.startDate || !deal.endDate) return false;
      return deal.startDate <= now && deal.endDate >= now;
    });

    // Spec: total_savings = SUM(savings_amount_est), avg_discount = AVERAGE(discount_tier), active_deals = COUNT(active with pricing + tier)
    let totalSavings = 0;
    let totalDiscountPct = 0;
    let discountCount = 0;
    let activeDealsWithPricingAndTier = 0;
    let maxDiscount = 0;

    activeDeals.forEach(deal => {
      const D = deal.salePrice;
      const discountTier = deal.discountTier;
      let original_price_est = deal.originalPrice;
      if (!original_price_est && typeof discountTier === 'number' && D != null) {
        const P = discountTier / 100;
        if (P < 1) original_price_est = Math.round((D / (1 - P)) * 100) / 100;
      }

      const savings_amount_est =
        original_price_est != null && D != null && original_price_est >= D
          ? Math.round((original_price_est - D) * 100) / 100
          : 0;
      if (savings_amount_est > 0) totalSavings += savings_amount_est;

      let pct = null;
      if (typeof discountTier === 'number') {
        pct = discountTier;
      } else if (original_price_est && D != null && original_price_est > 0) {
        pct = (1 - D / original_price_est) * 100;
      }

      const hasPricingAndTier = D != null && (typeof discountTier === 'number' || (deal.originalPrice != null && deal.originalPrice > 0));
      if (hasPricingAndTier) activeDealsWithPricingAndTier += 1;
      if (pct != null) {
        totalDiscountPct += pct;
        discountCount += 1;
        if (pct > maxDiscount) maxDiscount = pct;
      }
    });

    const roundedTotalSavings = Math.round(totalSavings * 100) / 100;
    const avgDiscount = discountCount > 0 ? Math.round((totalDiscountPct / discountCount) * 10) / 10 : 0;

    // Fetch top 3 deals by discountTier (highest first), same location filter
    const topDealsRaw = await Deal.find({ ...activeQuery, discountTier: { $exists: true, $ne: null } })
      .sort({ discountTier: -1 })
      .limit(3)
      .select('title discountTier salePrice category dispensary')
      .populate('dispensary', 'name');

    const topDeals = topDealsRaw.map(d => ({
      title: d.title || d.category || 'Discount',
      discountTier: d.discountTier,
      salePrice: d.salePrice,
      dispensaryName: typeof d.dispensary === 'object' ? d.dispensary?.name : null,
    }));

    res.json({
      success: true,
      totalSavings: roundedTotalSavings,
      avgDiscount,
      activeDeals: activeDealsWithPricingAndTier,
      maxDiscount: Math.round(maxDiscount),
      topDeals,
    });
  } catch (err) {
    console.error('Error computing savings ticker:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    // Get existing deal to check category if images are being updated
    const existingDeal = await Deal.findById(req.params.id);
    if (!existingDeal) {
      return res.status(404).json({ success: false, message: 'Discount not found' });
    }

    // If images are being updated, ensure at least one image exists
    if (req.body.images !== undefined) {
      const category = req.body.category || existingDeal.category;
      req.body.images = ensureDealHasImage(req.body.images, category);
    }

    const updatedDeal = await Deal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate("dispensary");

    res.json({ success: true, deal: updatedDeal });
  } catch (err) {
    console.error('Error updating deal:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const deletedDeal = await Deal.findByIdAndDelete(req.params.id);

    if (!deletedDeal) {
      return res.status(404).json({ success: false, message: 'Discount not found' });
    }
    const dispensary = await Dispensary.findById(deletedDeal.dispensary);
    if (dispensary) {
      dispensary.usedSkus -= 1;
      await dispensary.save();
    }

    res.json({ success: true, message: 'Discount deleted successfully' });
  } catch (err) {
    console.error('Error deleting deal:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
