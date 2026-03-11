
'use server';

import dbConnect from '@/lib/db';
import GalleryItem, { IGalleryItem } from '@/lib/models/GalleryItem';

export async function getGalleryItems(filters?: {
  category?: string;
  mediaType?: 'image' | 'video';
  isActive?: boolean;
  isFeatured?: boolean;
}) {
  await dbConnect();
  try {
    const query: any = {};
    if (filters?.category && filters.category !== 'All') query.category = filters.category;
    if (filters?.mediaType && filters.mediaType !== 'all') query.mediaType = filters.mediaType;
    if (filters?.isActive !== undefined) query.isActive = filters.isActive;
    if (filters?.isFeatured !== undefined) query.isFeatured = filters.isFeatured;

    const items = await GalleryItem.find(query).sort({ sortOrder: 1, createdAt: -1 }).lean();
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
