'use server';

import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import Product from '@/lib/models/Product';
import AdminLog from '@/lib/models/AdminLog';
import WishlistItem from '@/lib/models/WishlistItem';
import OrderedItem from '@/lib/models/OrderedItem';
import { revalidatePath } from 'next/cache';
import dayjs from 'dayjs';
import mongoose from 'mongoose';

/**
 * Helper to log admin actions.
 */
async function logAction(adminId: string, action: string, type: string, entityId: string, details: string) {
  await dbConnect();
  const admin = await User.findOne({ firebaseId: adminId });
  await AdminLog.create({
    adminId,
    adminName: admin ? `${admin.firstName} ${admin.lastName}` : 'Unknown Admin',
    role: admin?.role || 'admin',
    action,
    entityType: type,
    entityId,
    details
  });
}

/**
 * Dashboard KPIs.
 */
export async function getAdminDashboardStats() {
  await dbConnect();
  const sevenDaysAgo = dayjs().subtract(7, 'days').toDate();
  
  const [
    totalRevenue,
    totalOrders,
    totalUsers,
    activeUsers,
    pendingOrders,
    wishlistStats
  ] = await Promise.all([
    OrderedItem.aggregate([{ $group: { _id: null, total: { $sum: "$total_amount" } } }]),
    OrderedItem.countDocuments(),
    User.countDocuments(),
    User.countDocuments({ lastLogin: { $gte: sevenDaysAgo } }),
    OrderedItem.countDocuments({ status: { $in: ['Placed', 'Crafting', 'Developing', 'Packed'] } }),
    WishlistItem.countDocuments()
  ]);

  return JSON.parse(JSON.stringify({
    revenue: totalRevenue[0]?.total || 0,
    orders: totalOrders,
    users: totalUsers,
    activeUsers,
    pendingOrders,
    wishlistActivity: wishlistStats,
    conversionRate: totalUsers > 0 ? ((totalOrders / totalUsers) * 100).toFixed(1) : 0
  }));
}

export async function getDashboardChartData() {
  await dbConnect();
  
  const salesTrend = await OrderedItem.aggregate([
    { $match: { created_at: { $gte: dayjs().subtract(7, 'days').toDate() } } },
    { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
        amount: { $sum: "$total_amount" }
    }},
    { $sort: { "_id": 1 } }
  ]);

  const categoryDistribution = await Product.aggregate([
    { $match: { is_deleted: { $ne: true } } },
    { $group: { _id: "$category_id", count: { $sum: 1 } } }
  ]);

  return JSON.parse(JSON.stringify({
    sales: salesTrend.map(s => ({ day: s._id, value: s.amount })),
    categories: categoryDistribution.map(c => ({ 
      label: c._id ? String(c._id) : 'Ceramic Art', 
      value: c.count 
    })),
    users: [
      { month: 'Jan', count: 12 },
      { month: 'Feb', count: 34 },
      { month: 'Mar', count: 56 },
    ]
  }));
}

/**
 * Order Management.
 */
export async function getAllOrders() {
  await dbConnect();
  const orders = await OrderedItem.find().sort({ created_at: -1 }).lean();
  return JSON.parse(JSON.stringify(orders));
}

export async function updateOrderStatus(adminId: string, orderId: string, status: string) {
  await dbConnect();
  const order = await OrderedItem.findById(orderId);
  if (!order) throw new Error("Order not found");

  const oldStatus = order.status;
  await OrderedItem.findByIdAndUpdate(orderId, { status });
  await logAction(adminId, 'UPDATE_ORDER_STATUS', 'OrderedItem', order.order_number, `Status: ${oldStatus} -> ${status}`);
  revalidatePath('/admin/orders');
}

/**
 * User Management.
 */
export async function getAllUsers() {
  await dbConnect();
  const users = await User.find().sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(users));
}

export async function toggleUserStatus(adminId: string, userId: string, status: 'active' | 'disabled') {
  await dbConnect();
  await User.findByIdAndUpdate(userId, { status });
  await logAction(adminId, 'TOGGLE_USER_STATUS', 'User', userId, `Changed to ${status}`);
  revalidatePath('/admin/users');
}

/**
 * Product Management (Full CRUD).
 */
export async function getAdminProducts() {
  await dbConnect();
  const products = await Product.find({ is_deleted: { $ne: true } }).sort({ visibility_priority: -1, createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(products));
}

export async function saveProduct(adminId: string, productData: any) {
  await dbConnect();
  try {
    const isNew = !productData._id;
    let savedProduct;

    if (isNew) {
      savedProduct = await Product.create({
        ...productData,
        created_by_admin: adminId,
        updated_by_admin: adminId
      });
      await logAction(adminId, 'CREATE_PRODUCT', 'Product', savedProduct._id.toString(), `Created piece: ${savedProduct.name}`);
    } else {
      const { _id, ...updateData } = productData;
      savedProduct = await Product.findByIdAndUpdate(
        _id,
        { ...updateData, updated_by_admin: adminId },
        { new: true, runValidators: true }
      );
      await logAction(adminId, 'UPDATE_PRODUCT', 'Product', _id, `Updated piece: ${savedProduct.name}`);
    }

    revalidatePath('/admin/products');
    return JSON.parse(JSON.stringify(savedProduct));
  } catch (error: any) {
    console.error("Save Product Error:", error);
    throw new Error(error.message || "Failed to save product");
  }
}

export async function toggleProductVisibility(adminId: string, productId: string, isActive: boolean) {
  await dbConnect();
  await Product.findByIdAndUpdate(productId, { is_active: isActive });
  await logAction(adminId, 'TOGGLE_VISIBILITY', 'Product', productId, `Active: ${isActive}`);
  revalidatePath('/admin/products');
}

export async function toggleProductFeature(adminId: string, productId: string, isFeatured: boolean) {
  await dbConnect();
  await Product.findByIdAndUpdate(productId, { is_featured: isFeatured });
  await logAction(adminId, 'TOGGLE_FEATURED', 'Product', productId, `Featured: ${isFeatured}`);
  revalidatePath('/admin/products');
}

export async function deleteProduct(adminId: string, productId: string) {
  await dbConnect();
  await Product.findByIdAndUpdate(productId, { is_deleted: true, is_active: false });
  await logAction(adminId, 'SOFT_DELETE', 'Product', productId, 'Moved to archived pieces');
  revalidatePath('/admin/products');
}

/**
 * Admin Governance.
 */
export async function getAdminLogs() {
  await dbConnect();
  const logs = await AdminLog.find().sort({ timestamp: -1 }).limit(100).lean();
  return JSON.parse(JSON.stringify(logs));
}

export async function getAdmins() {
  await dbConnect();
  return JSON.parse(JSON.stringify(await User.find({ role: { $in: ['admin', 'super_admin', 'support'] } }).lean()));
}
