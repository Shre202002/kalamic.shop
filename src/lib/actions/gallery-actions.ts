'use server';

import dbConnect from '@/lib/db';
import GalleryItem, { IGalleryItem } from '@/lib/models/GalleryItem';
import { requireAdmin } from '@/lib/server-auth';

export async function getGalleryItems(filters?: {
  category?: string;
  mediaType?: 'all' | 'image' | 'video';
  isActive?: boolean;
  isFeatured?: boolean;
  includeInactive?: boolean;
}) {
  if (filters?.includeInactive) {
    await requireAdmin(['super_admin', 'admin', 'support']);
  }
  await dbConnect();
  try {
    const query: any = {};
    if (filters?.category && filters.category !== 'All') query.category = filters.category;
    if (filters?.mediaType && filters.mediaType !== 'all') query.mediaType = filters.mediaType;
    if (filters?.isActive !== undefined) query.isActive = filters.isActive;
    if (filters?.isFeatured !== undefined) query.isFeatured = filters.isFeatured;

    // Public callers remain restricted to active items. Admin Studio opts in
    // to pending review media so it can moderate and activate it.
    const finalQuery = filters?.includeInactive ? query : { isActive: true, ...query };
    const items = await GalleryItem.find(finalQuery).sort({ sortOrder: 1, createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(items)) as IGalleryItem[];
  } catch (error) {
    console.error("Error fetching gallery items:", error);
    return [];
  }
}

export async function getFeaturedGalleryItems() {
  await dbConnect();
  try {
    const items = await GalleryItem.find({ isActive: true, isFeatured: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .limit(12)
      .lean();
    return JSON.parse(JSON.stringify(items)) as IGalleryItem[];
  } catch (error) {
    console.error("Error fetching featured gallery items:", error);
    return [];
  }
}
