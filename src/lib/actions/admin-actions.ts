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
  
  // Permanent Super Admin Recognition
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
 * GOVERNANCE ACTIONS
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
  
  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { $set: { role: role } },
    { new: true }
  );

  if (!user) throw new Error("User with this email does not exist.");
  
  await logAction(actor, 'PROVISION_ADMIN', 'User', user.firebaseId, `Assigned role: ${role} to ${email}`);
  revalidatePath('/admin/settings');
}

export async function updateAdminRole(superAdminId: string, targetUserId: string, newRole: string) {
  const actor = await validateRole(superAdminId, ['super_admin']);
  await dbConnect();
  
  const user = await User.findByIdAndUpdate(targetUserId, { role: newRole }, { new: true });
  if (user) {
    await logAction(actor, 'UPDATE_ROLE', 'User', targetUserId, `Changed role to: ${newRole}`);
  }
  revalidatePath('/admin/settings');
}

export async function removeAdminAccess(superAdminId: string, targetUserId: string) {
  const actor = await validateRole(superAdminId, ['super_admin']);
  await dbConnect();
  
  const user = await User.findByIdAndUpdate(targetUserId, { role: 'buyer' }, { new: true });
  if (user) {
    await logAction(actor, 'REVOKE_ACCESS', 'User', targetUserId, `Removed administrative privileges`);
  }
  revalidatePath('/admin/settings');
}

/**
 * USER & ORDER MANAGEMENT
 */
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

export async function saveProduct(adminId: string, productData: any) {
  const actor = await validateRole(adminId, ['super_admin', 'admin']);
  await dbConnect();
  
  const price = Number(productData.price) || 0;
  const compareAtPrice = productData.compare_at_price ? Number(productData.compare_at_price) : undefined;

  // Manual Validation to replace problematic schema validator
  if (compareAtPrice !== undefined && compareAtPrice <= price) {
    throw new Error(`Validation Error: Compare Price (₹${compareAtPrice}) must be greater than Current Price (₹${price}).`);
  }

  // Sanitize incoming data to remove internal MongoDB fields that block updates
  const { _id, id, createdAt, updatedAt, __v, ...rest } = productData;
  const isNew = !_id;
  
  // Strict Schema Normalization & SEO Validation
  const validatedImages = (productData.images || []).map((img: any) => {
    if (img.url && (!img.alt || img.alt.length < 5)) {
      throw new Error(`SEO Error: Image [${img.url}] must have descriptive ALT text (min 5 chars).`);
    }
    return {
      url: img.url,
      alt: img.alt.trim(),
      is_primary: !!img.is_primary
    };
  }).filter((img: any) => img.url);

  if (validatedImages.length === 0) {
    throw new Error("At least one product image is required.");
  }

  // Handle Meta Keywords - Support both Array and Comma-separated String
  let keywordsArray: string[] = [];
  if (Array.isArray(productData.seo?.meta_keywords)) {
    keywordsArray = productData.seo.meta_keywords;
  } else if (typeof productData.seo?.meta_keywords === 'string') {
    keywordsArray = productData.seo.meta_keywords
      .split(',')
      .map((k: string) => k.trim())
      .filter((k: string) => k.length > 0);
  }

  const cleanedData: any = {
    ...rest,
    name: productData.name.trim(),
    slug: productData.slug.toLowerCase().trim(),
    price: price,
    compare_at_price: compareAtPrice,
    stock: Number(productData.stock) || 0,
    updated_by_admin: adminId,
    category_id: mongoose.isValidObjectId(productData.category_id) 
      ? new mongoose.Types.ObjectId(productData.category_id) 
      : new mongoose.Types.ObjectId(),
    images: validatedImages,
    specifications: (productData.specifications || []).filter((s: any) => s.key && s.value),
    faqs: (productData.faqs || []).filter((f: any) => f.question && f.answer),
    shipping: {
      weight_kg: Number(productData.shipping?.weight_kg) || 0,
      package_dimensions_cm: {
        length: Number(productData.shipping?.package_dimensions_cm?.length) || 0,
        width: Number(productData.shipping?.package_dimensions_cm?.width) || 0,
        height: Number(productData.shipping?.package_dimensions_cm?.height) || 0
      }
    },
    seo: {
      meta_title: productData.seo?.meta_title || '',
      meta_description: productData.seo?.meta_description || '',
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
    // Cast to ObjectId for reliable lookup
    const targetId = new mongoose.Types.ObjectId(_id);
    saved = await KalamicProduct.findByIdAndUpdate(
      targetId, 
      { $set: cleanedData }, 
      { new: true, runValidators: true }
    );
    
    if (!saved) throw new Error(`Product with ID ${_id} not found or update failed.`);
    await logAction(actor, 'UPDATE_PRODUCT', 'KalamicProduct', _id, `Updated: ${saved.name}`);
  }

  revalidatePath('/admin/products');
  revalidatePath(`/products/${saved.slug}`);
  revalidatePath('/');
  return JSON.parse(JSON.stringify(saved));
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

/**
 * DASHBOARD STATS
 */
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
