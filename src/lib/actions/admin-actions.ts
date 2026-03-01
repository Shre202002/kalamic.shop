'use server';

import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import KalamicProduct from '@/lib/models/KalamicProduct';
import AdminLog from '@/lib/models/AdminLog';
import OrderedItem from '@/lib/models/OrderedItem';
import WishlistItem from '@/lib/models/WishlistItem';
import AdminNotification from '@/lib/models/AdminNotification';
import { revalidatePath } from 'next/cache';
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

export async function getAdminProducts() {
  await dbConnect();
  try {
    const products = await KalamicProduct.find({ is_deleted: { $ne: true } }).sort({ visibility_priority: -1, createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(products));
  } catch (error) { return []; }
}

export async function getAllOrders() {
  await dbConnect();
  const orders = await OrderedItem.find({}).sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(orders));
}

export async function getAdminDashboardStats() {
  await dbConnect();
  try {
    const [revenueData, orderCount, activeUsers, pendingOrders, totalUsers, wishlistActivity] = await Promise.all([
      OrderedItem.aggregate([
        { $match: { paymentStatus: 'paid', paymentVerified: true } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      OrderedItem.countDocuments({ paymentStatus: 'paid', paymentVerified: true }),
      User.countDocuments({ status: 'active' }),
      OrderedItem.countDocuments({ orderStatus: { $in: ['Placed', 'Confirmed', 'Preparing', 'Developing'] } }),
      User.countDocuments(),
      WishlistItem.countDocuments()
    ]);

    const revenue = revenueData[0]?.total || 0;
    const avgOrderValue = orderCount > 0 ? (revenue / orderCount).toFixed(0) : 0;
    const conversionRate = totalUsers > 0 ? ((orderCount / totalUsers) * 100).toFixed(1) : 0;

    return {
      revenue,
      orders: orderCount,
      activeUsers,
      users: totalUsers,
      pendingOrders,
      conversionRate,
      avgOrderValue,
      wishlistActivity
    };
  } catch (error) {
    return { revenue: 0, orders: 0, activeUsers: 0, users: 0, pendingOrders: 0, conversionRate: 0, avgOrderValue: 0, wishlistActivity: 0 };
  }
}

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

export async function getAdminNotifications() {
  await dbConnect();
  const notifications = await AdminNotification.find({}).sort({ createdAt: -1 }).limit(20).lean();
  return JSON.parse(JSON.stringify(notifications));
}

export async function markNotificationsAsRead() {
  await dbConnect();
  await AdminNotification.updateMany({ isRead: false }, { $set: { isRead: true } });
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

export async function getDashboardChartData() {
  await dbConnect();
  
  // 1. Sales Trend (Last 7 Days)
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = dayjs().subtract(i, 'day').startOf('day');
    last7Days.push({
      start: d.toDate(),
      end: d.endOf('day').toDate(),
      label: d.format('DD MMM')
    });
  }

  const salesTrend = await Promise.all(last7Days.map(async (slot) => {
    const result = await OrderedItem.aggregate([
      { $match: { createdAt: { $gte: slot.start, $lte: slot.end }, paymentStatus: 'paid', paymentVerified: true } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    return { day: slot.label, value: result[0]?.total || 0 };
  }));

  // 2. User Growth (Last 6 Months)
  const userGrowth = [];
  for (let i = 5; i >= 0; i--) {
    const d = dayjs().subtract(i, 'month').startOf('month');
    const end = d.endOf('month');
    const count = await User.countDocuments({ createdAt: { $gte: d.toDate(), $lte: end.toDate() } });
    userGrowth.push({ month: d.format('MMM'), count });
  }

  // 3. Product Popularity Mix (based on order items)
  const productMix = await OrderedItem.aggregate([
    { $match: { paymentStatus: 'paid', paymentVerified: true } },
    { $unwind: '$items' },
    { $group: { _id: '$items.name', value: { $sum: 1 } } },
    { $sort: { value: -1 } },
    { $limit: 5 }
  ]);

  const categories = productMix.map((p, i) => ({
    id: i,
    value: p.value,
    label: p._id.length > 15 ? p._id.substring(0, 12) + '...' : p._id
  }));

  return {
    sales: salesTrend,
    users: userGrowth,
    categories: categories.length > 0 ? categories : [{ id: 0, value: 1, label: 'None' }]
  };
}

export async function getProductPerformanceData() {
  await dbConnect();
  try {
    const products = await KalamicProduct.find({ is_deleted: { $ne: true } })
      .select('name price analytics images sku')
      .sort({ 'analytics.total_orders': -1, 'analytics.total_views': -1 })
      .lean();
    
    return JSON.parse(JSON.stringify(products));
  } catch (error) {
    return [];
  }
}

export async function saveProduct(adminId: string, product: any) {
  const actor = await validateRole(adminId, ['super_admin', 'admin']);
  await dbConnect();
  
  const id = product._id;
  const data = { ...product, updated_by_admin: actor.firebaseId };
  delete data._id;

  let result;
  if (id) {
    result = await KalamicProduct.findByIdAndUpdate(id, { $set: data }, { new: true });
    await logAction(actor, 'UPDATE_PRODUCT', 'Product', id, `Updated piece: ${product.name}`);
  } else {
    data.created_by_admin = actor.firebaseId;
    result = await KalamicProduct.create(data);
    await logAction(actor, 'CREATE_PRODUCT', 'Product', result._id, `Created new piece: ${product.name}`);
  }
  
  revalidatePath('/admin/products');
  revalidatePath('/products');
  return JSON.parse(JSON.stringify(result));
}

export async function deleteProduct(adminId: string, productId: string) {
  const actor = await validateRole(adminId, ['super_admin', 'admin']);
  await dbConnect();
  await KalamicProduct.findByIdAndUpdate(productId, { is_deleted: true });
  await logAction(actor, 'DELETE_PRODUCT', 'Product', productId, `Archived piece`);
  revalidatePath('/admin/products');
}

export async function toggleProductVisibility(adminId: string, productId: string, active: boolean) {
  const actor = await validateRole(adminId, ['super_admin', 'admin']);
  await dbConnect();
  await KalamicProduct.findByIdAndUpdate(productId, { is_active: active });
  await logAction(actor, 'TOGGLE_VISIBILITY', 'Product', productId, `Set visibility to: ${active}`);
  revalidatePath('/admin/products');
}

export async function updateAdminRole(actorId: string, targetId: string, role: string) {
  const actor = await validateRole(actorId, ['super_admin']);
  await dbConnect();
  await User.findByIdAndUpdate(targetId, { role });
  await logAction(actor, 'UPDATE_ADMIN_ROLE', 'User', targetId, `Changed role to: ${role}`);
}

export async function removeAdminAccess(actorId: string, targetId: string) {
  const actor = await validateRole(actorId, ['super_admin']);
  await dbConnect();
  await User.findByIdAndUpdate(targetId, { role: 'buyer' });
  await logAction(actor, 'REVOKE_ADMIN_ACCESS', 'User', targetId, `Revoked administrative clearance`);
}

export async function provisionAdmin(actorId: string, email: string, role: string) {
  const actor = await validateRole(actorId, ['super_admin']);
  await dbConnect();
  const user = await User.findOneAndUpdate({ email: email.toLowerCase() }, { role }, { new: true });
  if (!user) throw new Error("Collector not found. They must sign in once before being elevated.");
  await logAction(actor, 'PROVISION_ADMIN', 'User', user._id, `Granted ${role} status to ${email}`);
}
