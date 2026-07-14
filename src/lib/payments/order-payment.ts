import AdminNotification from '@/lib/models/AdminNotification';
import KalamicProduct from '@/lib/models/KalamicProduct';
import OrderedItem from '@/lib/models/OrderedItem';
import PromoCode from '@/lib/models/PromoCode';
import { clearCartAfterOrder, syncOrderToFirestore } from '@/lib/firebase-admin';

export function paymentResponse(order: any, message: string) {
  return {
    success: true,
    paymentVerified: order.paymentVerified,
    paymentStatus: order.paymentStatus,
    paymentId: order.paymentId || null,
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    ecommerce: order.paymentVerified ? {
      transactionId: order.orderNumber,
      value: order.totalAmount,
      tax: 0,
      shipping: order.charges?.shipping || 0,
      currency: 'INR',
      items: order.items.map((item: any) => ({
        item_id: String(item.productId),
        item_name: item.name,
        item_brand: 'Kalamic',
        price: item.price,
        quantity: item.quantity,
      })),
    } : undefined,
    message,
  };
}

export async function finalizePaidOrder(input: {
  order: any;
  paymentId: string;
  paidAt?: Date;
}) {
  const updatedOrder = await OrderedItem.findOneAndUpdate(
    { _id: input.order._id, paymentVerified: { $ne: true } },
    {
      $set: {
        paymentStatus: 'paid',
        paymentVerified: true,
        paymentId: input.paymentId,
        transactionId: input.paymentId,
        paymentTimestamp: input.paidAt || new Date(),
        orderStatus: 'Confirmed',
        updatedAt: new Date(),
      },
    },
    { new: true }
  );

  if (!updatedOrder) {
    return OrderedItem.findById(input.order._id);
  }

  // The payment state is the source of truth. Ancillary sync/notification tasks
  // must not turn a captured payment into a failed webhook response.
  const sideEffects = await Promise.allSettled([
    syncOrderToFirestore(updatedOrder),
    clearCartAfterOrder(updatedOrder.userId, updatedOrder.items),
    AdminNotification.create({
      type: 'order_placed',
      title: 'Razorpay Payment Verified',
      message: `${updatedOrder.userName} payment confirmed for ${updatedOrder.orderNumber}.`,
      link: '/admin/orders',
    }),
    updatedOrder.promoCode
      ? PromoCode.updateOne({ code: updatedOrder.promoCode }, { $inc: { usedCount: 1 } })
      : Promise.resolve(),
    ...updatedOrder.items.map((item: any) => KalamicProduct.findByIdAndUpdate(
      item.productId,
      { $inc: { 'analytics.total_orders': item.quantity } }
    )),
  ]);

  sideEffects.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(
        `[ORDER_PAYMENT_SIDE_EFFECT_FAILED] ${updatedOrder.orderNumber} task ${index}:`,
        result.reason
      );
    }
  });

  return updatedOrder;
}

export async function markOrderPaymentFailed(order: any) {
  if (order.paymentVerified) return order;

  return OrderedItem.findOneAndUpdate(
    { _id: order._id, paymentVerified: { $ne: true } },
    {
      $set: {
        paymentStatus: 'failed',
        orderStatus: 'Canceled',
        updatedAt: new Date(),
      },
    },
    { new: true }
  );
}
