
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
    Order.countDocuments({ orderStatus: 'pending' }),
    WishlistItem.countDocuments()
  ]);

  return {
    revenue: totalRevenue[0]?.total || 0,
    orders: totalOrders,
    users: totalUsers,
    activeUsers,
    pendingOrders,
    wishlistActivity: wishlistStats,
    cartAbandonmentRate: 15.5 // Placeholder for MVP
  };
}

/**
 * Fetches data for Dashboard Charts.
 */
export async function getDashboardChartData() {
  await dbConnect();
  
  // Sales Trend (Last 7 Days)
  const salesTrend = await Order.aggregate([
    { $match: { createdAt: { $gte: dayjs().subtract(7, 'days').toDate() } } },
    { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        amount: { $sum: "$totalAmount" }
    }},
    { $sort: { "_id": 1 } }
  ]);

  return {
    sales: salesTrend.map(s => ({ day: s._id, value: s.amount })),
    // Mock user growth if empty
    users: [
      { month: 'Jan', count: 10 },
      { month: 'Feb', count: 25 },
      { month: 'Mar', count: 45 },
    ]
  };
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

export async function updateProductPriority(adminId: string, productId: string, priority: number) {
  await dbConnect();
  // Ensure your product model has a priority field
  await Product.findByIdAndUpdate(productId, { $set: { displayPriority: priority } });
  await logAction(adminId, 'UPDATE_PRIORITY', 'Product', productId, `Set priority to ${priority}`);
  revalidatePath('/admin/products');
}
