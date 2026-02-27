
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
 * Resets and seeds the catalog with default products.
 */
export async function seedDefaultProducts(adminId: string) {
  await dbConnect();
  
  const defaultProducts = [
    {
      _id: new mongoose.Types.ObjectId("699026a8ae873e1fa69cb18a"),
      name: "Mor Stambh Ceramic Customized Pillar",
      slug: "mor_stambh",
      short_description: "Handmade traditional ceramic pillar for temple and home decor.",
      description: "Bahut sundar handmade ceramic pillar jo Bhagwan ke Jhula ke liye perfect hai. Traditional Indian cultural designs ke saath. Religious occasions jaise Diwali, Navratri ya ghar ke mandir decor ke liye best choice.",
      category_id: new mongoose.Types.ObjectId("699026a7ae873e1fa69cb187"),
      tags: ["decor", "pillar", "handmade", "ceramic", "temple"],
      images: [
        { url: "https://i.imgur.com/wqfAvmq.png", alt: "Mor Stambh Front View", is_primary: true },
        { url: "https://i.imgur.com/imOtW3n.png", alt: "Side View", is_primary: false }
      ],
      price: 1499,
      compare_at_price: 1999,
      currency: "INR",
      stock: 5,
      sku: "MS-001",
      is_active: true,
      is_featured: true,
      visibility_priority: 1,
      specifications: [
        { key: "Material", value: "Ceramic" },
        { key: "Finish", value: "Hand-painted" },
        { key: "Color", value: "Brown & Grey" },
        { key: "Usage", value: "Temple Decor / Home Decor" }
      ],
      shipping: {
        weight_kg: 1.2,
        package_dimensions_cm: { length: 40, width: 20, height: 20 }
      },
      seo: {
        meta_title: "Mor Stambh Ceramic Pillar – Handmade Temple Decor",
        meta_description: "Buy handmade ceramic Mor Stambh pillar for temple and festive decor.",
        meta_keywords: ["mor stambh", "ceramic pillar", "temple decor"]
      }
    },
    {
      _id: new mongoose.Types.ObjectId("699026a8ae873e1fa69cb18b"),
      name: "Handmade Ceramic Mirror",
      slug: "mirror",
      short_description: "Elegant handcrafted ceramic mirror for home decor.",
      description: "Elegant aur stylish handmade ceramic mirror with beautiful Indian motifs. Perfect for living rooms and festive decor.",
      category_id: new mongoose.Types.ObjectId("699026a7ae873e1fa69cb188"),
      tags: ["mirror", "home decor", "ceramic", "handmade"],
      images: [
        { url: "https://images.unsplash.com/photo-1594913785162-e6785b4cd352?q=80&w=800", alt: "Ceramic Mirror Front", is_primary: true }
      ],
      price: 999,
      compare_at_price: 2599,
      currency: "INR",
      stock: 5,
      sku: "CM-001",
      is_active: true,
      is_featured: true,
      visibility_priority: 2,
      specifications: [
        { key: "Material", value: "Ceramic + Mirror Glass" },
        { key: "Finish", value: "Glossy" },
        { key: "Usage", value: "Living Room / Bedroom Decor" }
      ],
      shipping: {
        weight_kg: 1.5,
        package_dimensions_cm: { length: 50, width: 50, height: 10 }
      },
      seo: {
        meta_title: "Handmade Ceramic Mirror – Decorative Wall Mirror",
        meta_description: "Premium handcrafted ceramic mirror for elegant home interiors.",
        meta_keywords: ["ceramic mirror", "handmade mirror", "wall decor"]
      }
    },
    {
      _id: new mongoose.Types.ObjectId("699026a8ae873e1fa69cb18c"),
      name: "Customized Ceramic Photo Frame",
      slug: "peacock_embrace_frame",
      short_description: "Personalized handmade ceramic photo frame.",
      description: "Personalized ceramic photo frame with lovely cultural designs – perfect for gifting and home decor.",
      category_id: new mongoose.Types.ObjectId("699026a8ae873e1fa69cb189"),
      tags: ["photo frame", "customized", "ceramic", "gift"],
      images: [
        { url: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?q=80&w=800", alt: "Ceramic Frame Front", is_primary: true }
      ],
      price: 699,
      compare_at_price: 999,
      currency: "INR",
      stock: 13,
      sku: "CF-001",
      is_active: true,
      is_featured: false,
      visibility_priority: 3,
      specifications: [
        { key: "Material", value: "Ceramic" },
        { key: "Finish", value: "Hand-painted" },
        { key: "Usage", value: "Home Decor / Gift" }
      ],
      shipping: {
        weight_kg: 0.8,
        package_dimensions_cm: { length: 35, width: 25, height: 10 }
      },
      seo: {
        meta_title: "Customized Ceramic Photo Frame – Handmade Gift",
        meta_description: "Buy personalized ceramic photo frame for gifting and decor.",
        meta_keywords: ["ceramic frame", "custom gift", "photo decor"]
      }
    },
    {
      _id: new mongoose.Types.ObjectId("699026a8ae873e1fa69cb18e"),
      name: "Handmade Ceramic Mandala Wheel",
      slug: "mandala_wheel",
      short_description: "Golden handmade ceramic mandala wheel for temple decor.",
      description: "Stunning handmade ceramic mandala wheel in golden finish with Laddu Gopal design. Perfect for temple and wall decor.",
      category_id: new mongoose.Types.ObjectId("699026a7ae873e1fa69cb187"),
      tags: ["decor", "mandala", "handmade", "ceramic", "temple"],
      images: [
        { url: "https://i.imgur.com/QkkCTmA.png", alt: "Mandala Front", is_primary: true }
      ],
      price: 2499,
      compare_at_price: 4999,
      currency: "INR",
      stock: 5,
      sku: "MW-001",
      is_active: true,
      is_featured: true,
      visibility_priority: 2,
      specifications: [
        { key: "Material", value: "Ceramic" },
        { key: "Finish", value: "Golden Hand-painted" },
        { key: "Usage", value: "Temple Decor / Wall Hanging" }
      ],
      shipping: {
        weight_kg: 1.8,
        package_dimensions_cm: { length: 45, width: 45, height: 10 }
      },
      seo: {
        meta_title: "Handmade Ceramic Mandala Wheel – Temple Decor",
        meta_description: "Golden ceramic mandala wheel with Laddu Gopal design.",
        meta_keywords: ["mandala wheel", "ceramic decor", "temple decor"]
      }
    },
    {
      _id: new mongoose.Types.ObjectId("699026a8ae873e1fa69cb18d"),
      name: "Handmade Ceramic Fridge Magnet – Indian Floral Motif",
      slug: "ceramic_fridge_magnet",
      short_description: "Cute handmade ceramic fridge magnet set.",
      description: "Cute set of handmade ceramic fridge magnets with traditional Indian patterns. Perfect for gifting and kitchen decor.",
      category_id: new mongoose.Types.ObjectId("699026a8ae873e1fa69cb189"),
      tags: ["gifts", "magnet", "handmade", "ceramic"],
      images: [
        { url: "https://i.imgur.com/CKp5j5S.png", alt: "Magnet Front", is_primary: true }
      ],
      price: 299,
      compare_at_price: 399,
      currency: "INR",
      stock: 5,
      sku: "FM-001",
      is_active: true,
      is_featured: false,
      visibility_priority: 4,
      specifications: [
        { key: "Material", value: "Ceramic" },
        { key: "Finish", value: "Hand-painted" },
        { key: "Usage", value: "Kitchen Decor / Gift" }
      ],
      shipping: {
        weight_kg: 0.2,
        package_dimensions_cm: { length: 15, width: 10, height: 5 }
      },
      seo: {
        meta_title: "Handmade Ceramic Fridge Magnet – Floral Motif",
        meta_description: "Decorative ceramic fridge magnets for gifting and decor.",
        meta_keywords: ["ceramic magnet", "handmade gift", "fridge decor"]
      }
    }
  ];

  try {
    // Clear existing products
    await Product.deleteMany({});
    
    // Insert new products
    await Product.insertMany(defaultProducts);
    
    await logAction(adminId, 'CATALOG_SEED', 'Product', 'all', 'Reset and seeded artisan catalog with 5 default pieces.');
    revalidatePath('/admin/products');
    revalidatePath('/products');
    revalidatePath('/');
    
    return { success: true };
  } catch (error: any) {
    console.error("Seed Catalog Error:", error);
    throw new Error(error.message || "Failed to seed catalog");
  }
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
