
'use server';

import dbConnect from '@/lib/db';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
import Product from '@/lib/models/Product';
import AdminLog from '@/lib/models/AdminLog';
import WishlistItem from '@/lib/models/WishlistItem';
import { revalidatePath } from 'next/cache';
import dayjs from 'dayjs';

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
 * Fetches Dashboard KPIs.
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
    Order.aggregate([{ $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
    Order.countDocuments(),
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ lastLogin: { $gte: sevenDaysAgo } }),
    Order.countDocuments({ orderStatus: { $in: ['pending', 'placed', 'pending_payment'] } }),
    WishlistItem.countDocuments()
  ]);

  const stats = {
    revenue: totalRevenue[0]?.total || 0,
    orders: totalOrders,
    users: totalUsers,
    activeUsers,
    pendingOrders,
    wishlistActivity: wishlistStats,
    conversionRate: totalUsers > 0 ? ((totalOrders / totalUsers) * 100).toFixed(1) : 0
  };

  return JSON.parse(JSON.stringify(stats));
}

/**
 * Fetches data for Dashboard Charts.
 */
export async function getDashboardChartData() {
  await dbConnect();
  
  const salesTrend = await Order.aggregate([
    { $match: { createdAt: { $gte: dayjs().subtract(7, 'days').toDate() } } },
    { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        amount: { $sum: "$totalAmount" }
    }},
    { $sort: { "_id": 1 } }
  ]);

  const categoryDistribution = await Product.aggregate([
    { $group: { _id: "$category_id", count: { $sum: 1 } } }
  ]);

  const data = {
    sales: salesTrend.map(s => ({ day: s._id, value: s.amount })),
    categories: categoryDistribution.map(c => ({ 
      label: c._id ? String(c._id) : 'Uncategorized', 
      value: c.count 
    })),
    users: [
      { month: 'Jan', count: 12 },
      { month: 'Feb', count: 34 },
      { month: 'Mar', count: 56 },
    ]
  };

  return JSON.parse(JSON.stringify(data));
}

/**
 * Order Management Actions
 */
export async function getAllOrders() {
  await dbConnect();
  const orders = await Order.find().sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(orders));
}

export async function updateOrderStatus(adminId: string, orderId: string, status: string) {
  await dbConnect();
  await Order.findByIdAndUpdate(orderId, { orderStatus: status });
  await logAction(adminId, 'UPDATE_STATUS', 'Order', orderId, `Changed to ${status}`);
  revalidatePath('/admin/orders');
}

/**
 * User Management Actions
 */
export async function getAllUsers() {
  await dbConnect();
  const users = await User.find({ role: 'user' }).sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(users));
}

export async function toggleUserStatus(adminId: string, userId: string, status: 'active' | 'disabled') {
  await dbConnect();
  await User.findByIdAndUpdate(userId, { status });
  await logAction(adminId, 'TOGGLE_STATUS', 'User', userId, `Changed to ${status}`);
  revalidatePath('/admin/users');
}

/**
 * Product Management Actions
 */
export async function getAdminProducts() {
  await dbConnect();
  const products = await Product.find().sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(products));
}

export async function toggleProductVisibility(adminId: string, productId: string, isActive: boolean) {
  await dbConnect();
  await Product.findByIdAndUpdate(productId, { is_active: isActive });
  await logAction(adminId, 'TOGGLE_VISIBILITY', 'Product', productId, `Set visibility to ${isActive}`);
  revalidatePath('/admin/products');
}

export async function deleteProduct(adminId: string, productId: string) {
  await dbConnect();
  await Product.findByIdAndDelete(productId);
  await logAction(adminId, 'DELETE', 'Product', productId, 'Deleted piece from catalog');
  revalidatePath('/admin/products');
}

/**
 * Admin Management & Logs
 */
export async function getAdminLogs() {
  await dbConnect();
  const logs = await AdminLog.find().sort({ timestamp: -1 }).limit(100).lean();
  return JSON.parse(JSON.stringify(logs));
}

export async function getAdmins() {
  await dbConnect();
  const admins = await User.find({ role: { $in: ['admin', 'super_admin', 'support'] } }).lean();
  return JSON.parse(JSON.stringify(admins));
}
