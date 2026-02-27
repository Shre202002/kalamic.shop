
'use server';

import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import Product from '@/lib/models/Product';
import AdminLog from '@/lib/models/AdminLog';
import OrderedItem from '@/lib/models/OrderedItem';
import { revalidatePath } from 'next/cache';
import dayjs from 'dayjs';

/**
 * CORE PERMISSION ENGINE
 */
async function validateRole(adminId: string, allowedRoles: string[]) {
  await dbConnect();
  const user = await User.findOne({ firebaseId: adminId });
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
 * GOVERNANCE ACTIONS (Super Admin Only)
 */
export async function provisionAdmin(superAdminId: string, email: string, role: string) {
  const actor = await validateRole(superAdminId, ['super_admin']);
  await dbConnect();
  
  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { $set: { role: role } },
    { new: true, upsert: false }
  );

  if (!user) throw new Error("User with this email does not exist in the system.");
  
  await logAction(actor, 'PROVISION_ADMIN', 'User', user.firebaseId, `Assigned role: ${role} to ${email}`);
  revalidatePath('/admin/settings');
  return JSON.parse(JSON.stringify(user));
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
  
  const user = await User.findByIdAndUpdate(targetUserId, { role: 'buyer' });
  if (user) {
    await logAction(actor, 'REVOKE_ACCESS', 'User', targetUserId, `Revoked admin privileges for ${user.email}`);
  }
  revalidatePath('/admin/settings');
}

/**
 * PRODUCT ACTIONS
 */
export async function getAdminProducts() {
  await dbConnect();
  const products = await Product.find({ is_deleted: { $ne: true } }).sort({ visibility_priority: -1, createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(products));
}

export async function saveProduct(adminId: string, productData: any) {
  const actor = await validateRole(adminId, ['super_admin', 'admin']);
  await dbConnect();
  
  const isNew = !productData._id;
  const cleanedData = {
    ...productData,
    price: Number(productData.price) || 0,
    stock: Number(productData.stock) || 0,
    updated_by_admin: adminId,
    images: (productData.images || []).map((img: any) => ({
      url: typeof img === 'string' ? img : (img.url || ""),
      alt: typeof img === 'string' ? "" : (img.alt || ""),
      is_primary: !!img.is_primary
    }))
  };

  let saved;
  if (isNew) {
    cleanedData.created_by_admin = adminId;
    saved = await Product.create(cleanedData);
    await logAction(actor, 'CREATE_PRODUCT', 'Product', saved._id.toString(), `Created: ${saved.name}`);
  } else {
    saved = await Product.findByIdAndUpdate(productData._id, cleanedData, { new: true });
    await logAction(actor, 'UPDATE_PRODUCT', 'Product', productData._id, `Updated: ${saved.name}`);
  }

  revalidatePath('/admin/products');
  revalidatePath(`/products/${saved.slug}`);
  return JSON.parse(JSON.stringify(saved));
}

export async function toggleProductVisibility(adminId: string, productId: string, isActive: boolean) {
  const actor = await validateRole(adminId, ['super_admin', 'admin']);
  await dbConnect();
  await Product.findByIdAndUpdate(productId, { is_active: isActive });
  await logAction(actor, 'TOGGLE_VISIBILITY', 'Product', productId, `Set visibility: ${isActive}`);
  revalidatePath('/admin/products');
}

export async function deleteProduct(adminId: string, productId: string) {
  const actor = await validateRole(adminId, ['super_admin']);
  await dbConnect();
  await Product.findByIdAndUpdate(productId, { is_deleted: true });
  await logAction(actor, 'ARCHIVE_PRODUCT', 'Product', productId, 'Moved to archive');
  revalidatePath('/admin/products');
}

/**
 * ORDER ACTIONS
 */
export async function getAllOrders() {
  await dbConnect();
  return JSON.parse(JSON.stringify(await OrderedItem.find().sort({ created_at: -1 }).lean()));
}

export async function updateOrderStatus(adminId: string, orderId: string, status: string) {
  const actor = await validateRole(adminId, ['super_admin', 'admin']);
  await dbConnect();
  const order = await OrderedItem.findByIdAndUpdate(orderId, { status });
  if (order) await logAction(actor, 'UPDATE_ORDER_STATUS', 'OrderedItem', order.order_number, `Status set to: ${status}`);
  revalidatePath('/admin/orders');
}

/**
 * DIRECTORY & LOGS
 */
export async function getAllUsers() {
  await dbConnect();
  return JSON.parse(JSON.stringify(await User.find().sort({ createdAt: -1 }).lean()));
}

export async function getAdminLogs() {
  await dbConnect();
  return JSON.parse(JSON.stringify(await AdminLog.find().sort({ timestamp: -1 }).limit(100).lean()));
}

export async function getAdmins() {
  await dbConnect();
  return JSON.parse(JSON.stringify(await User.find({ role: { $in: ['super_admin', 'admin', 'support'] } }).lean()));
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
  try {
    const last7Days = Array.from({ length: 7 }, (_, i) => dayjs().subtract(6 - i, 'day').format('YYYY-MM-DD'));
    const salesData = await OrderedItem.aggregate([
      { $match: { created_at: { $gte: dayjs().subtract(7, 'day').toDate() } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
          total: { $sum: "$total_amount" }
      }}
    ]);

    return {
      sales: last7Days.map(day => ({
        day: dayjs(day).format('DD MMM'),
        value: salesData.find(s => s._id === day)?.total || 0
      })),
      users: [],
      categories: [
        { id: 0, value: 45, label: 'Temple Decor' },
        { id: 1, value: 25, label: 'Wall Art' }
      ]
    };
  } catch (error) {
    return { sales: [], users: [], categories: [] };
  }
}
