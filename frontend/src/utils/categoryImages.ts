// Default category images from Cloudinary
// Update these URLs with your actual Cloudinary image URLs
// These should match the URLs in backend/src/utils/defaultCategoryImages.js
export const categoryImageMap: Record<string, string> = {
  'flower': 'https://res.cloudinary.com/da6h7gmay/image/upload/v1766964555/flower_2_aa53nl.png',
  'edibles': 'https://res.cloudinary.com/da6h7gmay/image/upload/v1766964507/edibles_hcehm8.png',
  'concentrates': 'https://res.cloudinary.com/da6h7gmay/image/upload/v1767722029/concentrates_fbpwtb.png',
  'vapes': 'https://res.cloudinary.com/da6h7gmay/image/upload/v1767722028/vape_vsxl4a.png',
  'topicals': 'https://res.cloudinary.com/da6h7gmay/image/upload/v1766964436/topical_image_fvyxsa.png',
  'pre-roll': 'https://res.cloudinary.com/da6h7gmay/image/upload/v1766964459/pre-roll_kkqvgz.png',
  'tincture': 'https://res.cloudinary.com/da6h7gmay/image/upload/v1766964533/tincture_spfuz8.png',
  'beverage': 'https://res.cloudinary.com/da6h7gmay/image/upload/v1766964452/beverages_image_tvvmmz.png',
  'capsule/pill': 'https://res.cloudinary.com/da6h7gmay/image/upload/v1766964467/capsule_y7shbf.png',
  'other': 'https://res.cloudinary.com/da6h7gmay/image/upload/v1766964475/others_gvdmgl.png',
};

export function getCategoryImage(category: string, dealImages?: string[]): string {
  // If deal has images, use the first one
  if (dealImages && dealImages.length > 0 && dealImages[0]) {
    return dealImages[0];
  }
  
  // Otherwise, use category fallback
  return categoryImageMap[category] || categoryImageMap['other'];
}

