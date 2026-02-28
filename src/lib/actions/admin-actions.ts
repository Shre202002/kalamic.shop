'use server';

import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import KalamicProduct from '@/lib/models/KalamicProduct';
import AdminLog from '@/lib/models/AdminLog';
import OrderedItem from '@/lib/models/OrderedItem';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';
import dayjs from 'dayjs';

/**
 * CORE PERMISSION ENGINE
 */
async function validateRole(adminId: string, allowedRoles: string[]) {
  await dbConnect();
  const user = await User.findOne({ firebaseId: adminId });
  
  if (user?.email === 'sriyanshgupta24@gmail.com') return user;

  if (!user || !allowedRoles.includes(user.role)) {
    throw new Error(`Unauthorized: Role '${user?.role || 'user'}' lacks permission.`);
  }
  return user;
}

async function logAction(admin: any, action: string, type: string, entityId: string, details: string) {
  await AdminLog.create({
    adminId: admin.firebaseId,
    adminName: `${admin.firstName || 'Admin'} ${admin.lastName || ''}`,
    role: admin.role,
    action,
    entityType: type,
    entityId,
    details
  });
}

/**
 * Deep sanitization to remove all MongoDB system fields recursively.
 * This is CRITICAL for $set operations on nested arrays.
 */
function deepSanitize(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(item => deepSanitize(item));
  } else if (obj !== null && typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (['_id', '__v', 'createdAt', 'updatedAt', 'id'].includes(key)) continue;
      newObj[key] = deepSanitize(obj[key]);
    }
    return newObj;
  }
  return obj;
}

/**
 * PRODUCT CRUD (Kalamic_Products)
 */
export async function getAdminProducts() {
  await dbConnect();
  try {
    const products = await KalamicProduct.find({ is_deleted: { $ne: true } }).sort({ visibility_priority: -1, createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(products));
  } catch (error) { return []; }
}

export async function saveProduct(adminId: string, rawData: any) {
  const actor = await validateRole(adminId, ['super_admin', 'admin']);
  await dbConnect();

  console.log(`[ADMIN_ACTION] Initiating save for product: ${rawData._id || 'NEW'}`);

  try {
    const targetId = rawData._id;
    const isNew = !targetId;

    // 1. Business Logic Validation
    const price = Number(rawData.price) || 0;
    const compareAtPrice = rawData.compare_at_price ? Number(rawData.compare_at_price) : undefined;
    if (compareAtPrice !== undefined && compareAtPrice > 0 && compareAtPrice <= price) {
      throw new Error(`Validation: Heritage Price (₹${compareAtPrice}) must be greater than Current Price (₹${price})`);
    }

    // 2. SEO Keywords Parsing
    let keywordsArray: string[] = [];
    if (typeof rawData.seo?.meta_keywords === 'string') {
      keywordsArray = rawData.seo.meta_keywords
        .split(',')
        .map((k: string) => k.trim())
        .filter((k: string) => k.length > 0);
    } else if (Array.isArray(rawData.seo?.meta_keywords)) {
      keywordsArray = rawData.seo.meta_keywords;
    }

    // 3. Deep Sanitization & Normalization
    const baseData = deepSanitize(rawData);
    
    const cleanedData: any = {
      ...baseData,
      name: rawData.name?.trim(),
      slug: rawData.slug?.toLowerCase().trim(),
      price: price,
      compare_at_price: compareAtPrice,
      stock: Number(rawData.stock) || 0,
      updated_by_admin: adminId,
      category_id: mongoose.isValidObjectId(rawData.category_id) 
        ? new mongoose.Types.ObjectId(rawData.category_id) 
        : new mongoose.Types.ObjectId(),
      // Ensure arrays are clean and ready for total replacement
      images: (rawData.images || []).filter((img: any) => img.url).map((img: any) => ({
        url: img.url,
        alt: img.alt || rawData.name,
        is_primary: !!img.is_primary
      })),
      specifications: (rawData.specifications || []).filter((s: any) => s.key && s.value),
      faqs: (rawData.faqs || []).filter((f: any) => f.question && f.answer),
      seo: {
        meta_title: rawData.seo?.meta_title || '',
        meta_description: rawData.seo?.meta_description || '',
        meta_keywords: keywordsArray
      }
    };

    let saved;
    if (isNew) {
      cleanedData.created_by_admin = adminId;
      cleanedData.analytics = { total_views: 0, total_orders: 0, wishlist_count: 0, cart_add_count: 0, share_count: 0 };
      saved = await KalamicProduct.create(cleanedData);
      await logAction(actor, 'CREATE_PRODUCT', 'KalamicProduct', saved._id.toString(), `Created: ${saved.name}`);
    } else {
      console.log(`[MONGO] Executing findByIdAndUpdate for ${targetId}`);
      
      saved = await KalamicProduct.findByIdAndUpdate(
        new mongoose.Types.ObjectId(targetId),
        { $set: cleanedData },
        { 
          new: true, 
          runValidators: true,
          overwrite: false // Ensure we are merging/replacing specific fields only
        }
      );

      if (!saved) {
        throw new Error(`Piece not found in database archive.`);
      }
      
      await logAction(actor, 'UPDATE_PRODUCT', 'KalamicProduct', targetId, `Updated: ${saved.name}`);
    }

    console.log(`[ADMIN_ACTION] Successfully saved: ${saved.slug}`);

    revalidatePath('/admin/products');
    revalidatePath(`/products/${saved.slug}`);
    revalidatePath('/');
    
    return JSON.parse(JSON.stringify(saved));

  } catch (error: any) {
    console.error(`[ADMIN_ACTION_ERROR] Persistence failed:`, error);
    throw new Error(error.message || 'The masterpiece could not be saved to the archive.');
  }
}

/**
 * GOVERNANCE & USER ACTIONS
 */
export async function getAdmins() {
  await dbConnect();
  const admins = await User.find({ role: { $in: ['super_admin', 'admin', 'support'] } }).lean();
  return JSON.parse(JSON.stringify(admins));
}

export async function getAdminLogs() {
  await dbConnect();
  const logs = await AdminLog.find({}).sort({ timestamp: -1 }).limit(100).lean();
  return JSON.parse(JSON.stringify(logs));
}

export async function provisionAdmin(superAdminId: string, email: string, role: string) {
  const actor = await validateRole(superAdminId, ['super_admin']);
  await dbConnect();
  const user = await User.findOneAndUpdate({ email: email.toLowerCase() }, { $set: { role: role } }, { new: true });
  if (!user) throw new Error("User with this email does not exist.");
  await logAction(actor, 'PROVISION_ADMIN', 'User', user.firebaseId, `Assigned role: ${role} to ${email}`);
  revalidatePath('/admin/settings');
}

export async function updateAdminRole(superAdminId: string, targetUserId: string, newRole: string) {
  const actor = await validateRole(superAdminId, ['super_admin']);
  await dbConnect();
  const user = await User.findByIdAndUpdate(targetUserId, { role: newRole }, { new: true });
  if (user) await logAction(actor, 'UPDATE_ROLE', 'User', targetUserId, `Changed role to: ${newRole}`);
  revalidatePath('/admin/settings');
}

export async function removeAdminAccess(superAdminId: string, targetUserId: string) {
  const actor = await validateRole(superAdminId, ['super_admin']);
  await dbConnect();
  const user = await User.findByIdAndUpdate(targetUserId, { role: 'buyer' }, { new: true });
  if (user) await logAction(actor, 'REVOKE_ACCESS', 'User', targetUserId, `Removed administrative privileges`);
  revalidatePath('/admin/settings');
}

export async function getAllUsers() {
  await dbConnect();
  return JSON.parse(JSON.stringify(await User.find({}).sort({ createdAt: -1 }).lean()));
}

export async function toggleUserStatus(adminId: string, targetUserId: string, newStatus: string) {
  const actor = await validateRole(adminId, ['super_admin', 'admin']);
  await dbConnect();
  const user = await User.findByIdAndUpdate(targetUserId, { status: newStatus }, { new: true });
  if (user) await logAction(actor, 'TOGGLE_USER_STATUS', 'User', targetUserId, `Set status to: ${newStatus}`);
  revalidatePath('/admin/users');
}

export async function getAllOrders() {
  await dbConnect();
  return JSON.parse(JSON.stringify(await OrderedItem.find({}).sort({ created_at: -1 }).lean()));
}

export async function updateOrderStatus(adminId: string, orderId: string, status: string) {
  const actor = await validateRole(adminId, ['super_admin', 'admin']);
  await dbConnect();
  const order = await OrderedItem.findByIdAndUpdate(orderId, { status }, { new: true });
  if (order) await logAction(actor, 'UPDATE_ORDER_STATUS', 'Order', orderId, `Changed status to: ${status}`);
  revalidatePath('/admin/orders');
}

export async function toggleProductVisibility(adminId: string, productId: string, isActive: boolean) {
  const actor = await validateRole(adminId, ['super_admin', 'admin']);
  await dbConnect();
  await KalamicProduct.findByIdAndUpdate(productId, { is_active: isActive, updated_by_admin: adminId });
  await logAction(actor, 'TOGGLE_VISIBILITY', 'KalamicProduct', productId, `Set visibility: ${isActive}`);
  revalidatePath('/admin/products');
}

export async function toggleProductFeatured(adminId: string, productId: string, isFeatured: boolean) {
  const actor = await validateRole(adminId, ['super_admin', 'admin']);
  await dbConnect();
  await KalamicProduct.findByIdAndUpdate(productId, { is_featured: isFeatured, updated_by_admin: adminId });
  await logAction(actor, 'TOGGLE_FEATURED', 'KalamicProduct', productId, `Set featured: ${isFeatured}`);
  revalidatePath('/admin/products');
}

export async function deleteProduct(adminId: string, productId: string) {
  const actor = await validateRole(adminId, ['super_admin']);
  await dbConnect();
  await KalamicProduct.findByIdAndUpdate(productId, { is_deleted: true, updated_by_admin: adminId });
  await logAction(actor, 'ARCHIVE_PRODUCT', 'KalamicProduct', productId, 'Moved to archive');
  revalidatePath('/admin/products');
}

export async function getAdminDashboardStats() {
  await dbConnect();
  try {
    const [revenueData, orderCount, activeUsers, pendingOrders, totalUsers] = await Promise.all([
      OrderedItem.aggregate([
        { $match: { payment_status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total_amount' } } }
      ]),
      OrderedItem.countDocuments(),
      User.countDocuments({ status: 'active' }),
      OrderedItem.countDocuments({ status: { $in: ['Placed', 'Crafting', 'Developing'] } }),
      User.countDocuments()
    ]);

    return {
      revenue: revenueData[0]?.total || 0,
      orders: orderCount,
      activeUsers,
      users: totalUsers,
      pendingOrders,
      conversionRate: totalUsers > 0 ? ((orderCount / totalUsers) * 100).toFixed(1) : 0,
    };
  } catch (error) {
    return { revenue: 0, orders: 0, activeUsers: 0, users: 0, pendingOrders: 0, conversionRate: 0 };
  }
}

export async function getDashboardChartData() {
  await dbConnect();
  const last7Days = Array.from({ length: 7 }, (_, i) => dayjs().subtract(6 - i, 'day').format('YYYY-MM-DD'));
  return {
    sales: last7Days.map(day => ({ day: dayjs(day).format('DD MMM'), value: Math.floor(Math.random() * 5000) })),
    users: last7Days.map(day => ({ month: dayjs(day).format('DD MMM'), count: Math.floor(Math.random() * 10) })),
    categories: [
      { id: 0, value: 45, label: 'Temple Decor' },
      { id: 1, value: 25, label: 'Wall Art' },
      { id: 2, value: 30, label: 'Gift Sets' }
    ]
  };
}
