
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
 * Restore the baseline handcrafted collection if the collection was dropped.
 */
export async function seedInitialCatalog(adminId: string) {
  await dbConnect();
  try {
    const products = [
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
        images: [{ url: "https://i.imgur.com/CjkQ8p3.png", alt: "Ceramic Mirror Front", is_primary: true }],
        price: 999,
        compare_at_price: 2599,
        currency: "INR",
        stock: 5,
        sku: "CM-001",
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
        category_id: new mongoose.Types.ObjectId("699026a7ae873e1fa69cb189"),
        tags: ["photo frame", "customized", "ceramic", "gift"],
        images: [{ url: "https://i.imgur.com/CjkQ8p3.png", alt: "Ceramic Frame Front", is_primary: true }],
        price: 699,
        compare_at_price: 999,
        currency: "INR",
        stock: 13,
        sku: "CF-001",
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
        images: [{ url: "https://i.imgur.com/QkkCTmA.png", alt: "Mandala Front", is_primary: true }],
        price: 2499,
        compare_at_price: 4999,
        currency: "INR",
        stock: 5,
        sku: "MW-001",
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
        category_id: new mongoose.Types.ObjectId("699026a7ae873e1fa69cb189"),
        tags: ["gifts", "magnet", "handmade", "ceramic"],
        images: [{ url: "https://i.imgur.com/CKp5j5S.png", alt: "Magnet Front", is_primary: true }],
        price: 299,
        compare_at_price: 399,
        currency: "INR",
        stock: 5,
        sku: "FM-001",
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

    await Product.deleteMany({});
    await Product.insertMany(products.map(p => ({ ...p, is_active: true, is_deleted: false })));
    
    await logAction(adminId, 'SEED_CATALOG', 'Product', 'all', 'Restored dropped collection with artisan baseline.');
    
    revalidatePath('/admin/products');
    revalidatePath('/products');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error("Seeding Error:", error);
    throw new Error("Failed to restore catalog.");
  }
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
    
    const cleanedData = {
      name: String(productData.name || ""),
      slug: String(productData.slug || ""),
      short_description: String(productData.short_description || ""),
      description: String(productData.description || ""),
      price: Number(productData.price) || 0,
      compare_at_price: productData.compare_at_price ? Number(productData.compare_at_price) : undefined,
      stock: Number(productData.stock) || 0,
      sku: String(productData.sku || ""),
      is_active: productData.is_active !== undefined ? !!productData.is_active : true,
      is_featured: !!productData.is_featured,
      visibility_priority: Number(productData.visibility_priority) || 0,
      images: (productData.images || []).map((img: any) => ({
        url: typeof img === 'string' ? img : (img.url || ""),
        alt: typeof img === 'string' ? "" : (img.alt || ""),
        is_primary: typeof img === 'string' ? false : !!img.is_primary
      })),
      specifications: (productData.specifications || []).map((spec: any) => ({
        key: String(spec.key || ""),
        value: String(spec.value || "")
      })),
      shipping: {
        weight_kg: Number(productData.shipping?.weight_kg) || 0,
        package_dimensions_cm: {
          length: Number(productData.shipping?.package_dimensions_cm?.length) || 0,
          width: Number(productData.shipping?.package_dimensions_cm?.width) || 0,
          height: Number(productData.shipping?.package_dimensions_cm?.height) || 0,
        }
      },
      seo: {
        meta_title: String(productData.seo?.meta_title || ""),
        meta_description: String(productData.seo?.meta_description || ""),
        meta_keywords: Array.isArray(productData.seo?.meta_keywords) ? productData.seo.meta_keywords : []
      }
    };

    let savedProduct;
    if (isNew) {
      savedProduct = await Product.create({
        ...cleanedData,
        created_by_admin: adminId,
        updated_by_admin: adminId
      });
      await logAction(adminId, 'CREATE_PRODUCT', 'Product', savedProduct._id.toString(), `Created piece: ${savedProduct.name}`);
    } else {
      savedProduct = await Product.findByIdAndUpdate(
        productData._id,
        { ...cleanedData, updated_by_admin: adminId },
        { new: true, runValidators: true }
      );
      if (!savedProduct) throw new Error("Product not found");
      await logAction(adminId, 'UPDATE_PRODUCT', 'Product', productData._id, `Updated piece: ${savedProduct.name}`);
    }

    revalidatePath('/admin/products');
    revalidatePath(`/products/${savedProduct.slug}`);
    revalidatePath('/products');
    revalidatePath('/');
    
    return JSON.parse(JSON.stringify(savedProduct));
  } catch (error: any) {
    console.error("Save Product Error:", error);
    throw new Error(error.message || "Failed to save masterpiece.");
  }
}

export async function toggleProductVisibility(adminId: string, productId: string, isActive: boolean) {
  await dbConnect();
  const product = await Product.findByIdAndUpdate(productId, { is_active: isActive });
  await logAction(adminId, 'TOGGLE_VISIBILITY', 'Product', productId, `Active: ${isActive}`);
  revalidatePath('/admin/products');
  if (product) revalidatePath(`/products/${product.slug}`);
}

export async function deleteProduct(adminId: string, productId: string) {
  await dbConnect();
  await Product.findByIdAndUpdate(productId, { is_deleted: true, is_active: false });
  await logAction(adminId, 'SOFT_DELETE', 'Product', productId, 'Moved to archived pieces');
  revalidatePath('/admin/products');
}

export async function getAllOrders() {
  await dbConnect();
  return JSON.parse(JSON.stringify(await OrderedItem.find().sort({ created_at: -1 }).lean()));
}

export async function updateOrderStatus(adminId: string, orderId: string, status: string) {
  await dbConnect();
  const order = await OrderedItem.findByIdAndUpdate(orderId, { status });
  if (order) await logAction(adminId, 'UPDATE_ORDER_STATUS', 'OrderedItem', order.order_number, `Status set to ${status}`);
  revalidatePath('/admin/orders');
}

export async function getAllUsers() {
  await dbConnect();
  return JSON.parse(JSON.stringify(await User.find().sort({ createdAt: -1 }).lean()));
}

export async function toggleUserStatus(adminId: string, userId: string, status: string) {
  await dbConnect();
  await User.findByIdAndUpdate(userId, { status });
  await logAction(adminId, 'TOGGLE_USER_STATUS', 'User', userId, `Changed to ${status}`);
  revalidatePath('/admin/users');
}

export async function getAdminLogs() {
  await dbConnect();
  return JSON.parse(JSON.stringify(await AdminLog.find().sort({ timestamp: -1 }).limit(100).lean()));
}

export async function getAdmins() {
  await dbConnect();
  return JSON.parse(JSON.stringify(await User.find({ role: { $in: ['admin', 'super_admin'] } }).lean()));
}

/**
 * Analytics & Dashboard Data
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

    const wishlistTotal = await Product.aggregate([
      { $group: { _id: null, total: { $sum: '$analytics.wishlist_count' } } }
    ]);

    return {
      revenue: revenueData[0]?.total || 0,
      orders: orderCount,
      activeUsers,
      users: totalUsers,
      pendingOrders,
      conversionRate: totalUsers > 0 ? ((orderCount / totalUsers) * 100).toFixed(1) : 0,
      wishlistActivity: wishlistTotal[0]?.total || 0
    };
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return { revenue: 0, orders: 0, activeUsers: 0, users: 0, pendingOrders: 0, conversionRate: 0, wishlistActivity: 0 };
  }
}

export async function getDashboardChartData() {
  await dbConnect();
  try {
    // 7 day sales trend
    const last7Days = Array.from({ length: 7 }, (_, i) => dayjs().subtract(6 - i, 'day').format('YYYY-MM-DD'));
    const salesData = await OrderedItem.aggregate([
      { $match: { created_at: { $gte: dayjs().subtract(7, 'day').toDate() } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
          total: { $sum: "$total_amount" }
      }}
    ]);

    const salesChart = last7Days.map(day => ({
      day: dayjs(day).format('DD MMM'),
      value: salesData.find(s => s._id === day)?.total || 0
    }));

    // User growth (simplified aggregation)
    const monthlyUsers = await User.aggregate([
      { $group: {
          _id: { $dateToString: { format: "%b", date: "$createdAt" } },
          count: { $sum: 1 }
      }},
      { $limit: 6 }
    ]);

    const categoryDistribution = [
      { id: 0, value: 45, label: 'Temple Decor' },
      { id: 1, value: 25, label: 'Wall Art' },
      { id: 2, value: 20, label: 'Custom Gifts' },
      { id: 3, value: 10, label: 'Accents' },
    ];

    return {
      sales: salesChart,
      users: monthlyUsers.length > 0 ? monthlyUsers.map(u => ({ month: u._id, count: u.count })) : [
        { month: 'Jan', count: 0 },
        { month: 'Feb', count: 0 },
        { month: 'Mar', count: 0 }
      ],
      categories: categoryDistribution
    };
  } catch (error) {
    console.error("Chart data error:", error);
    return { sales: [], users: [], categories: [] };
  }
}
