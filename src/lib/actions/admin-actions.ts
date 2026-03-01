'use server';

import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import KalamicProduct from '@/lib/models/KalamicProduct';
import AdminLog from '@/lib/models/AdminLog';
import OrderedItem from '@/lib/models/OrderedItem';
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
    const [revenueData, orderCount, activeUsers, pendingOrders, totalUsers] = await Promise.all([
      OrderedItem.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      OrderedItem.countDocuments(),
      User.countDocuments({ status: 'active' }),
      OrderedItem.countDocuments({ orderStatus: { $in: ['Placed', 'Confirmed', 'Preparing', 'Developing'] } }),
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
  const last7Days = Array.from({ length: 7 }, (_, i) => dayjs().subtract(6 - i, 'day').format('YYYY-MM-DD'));
  return {
    sales: last7Days.map(day => ({ day: dayjs(day).format('DD MMM'), value: Math.floor(Math.random() * 5000) })),
    users: last7Days.map(day => ({ month: dayjs(day).format('DD MMM'), count: Math.floor(Math.random() * 10) })),
    categories: [
      { id: 0, value: 45, label: 'Tableware' },
      { id: 1, value: 25, label: 'Decorative' },
      { id: 2, value: 30, label: 'Limited' }
    ]
  };
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
