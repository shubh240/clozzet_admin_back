import { Order } from "../models/order.model.js";
import { OrderItem } from "../models/orderItems.model.js";
import { Cart } from "../models/cart.model.js";
import { CartProduct } from "../models/cartProduct.model.js";
import { Product } from "../models/product.model.js";
import { ProductSize } from "../models/productSize.model.js";
import { CustomerAddress } from "../models/customerAddres.model.js";
import { Shipment } from "../models/shipment.model.js";
import { ShipmentProvider } from "../models/shipmentProvider.model.js";
import { ShipmentHistory } from "../models/shipmentHistory.model.js";
import { sendResponse } from "../common/index.js";
import { StoreInfo } from "../models/sellerStoreInfo.model.js";
import { Category } from "../models/category.model.js";
import { Subcategory } from "../models/subCategory.js";
import { Customer } from "../models/customer.model.js";
import { PaymentType } from "../models/paymentType.model.js";
import mongoose from 'mongoose';


/**
 *
 * Order List
 *
 */
export const listOrders = async (req, res) => {
  try {
    const { page, limit, customerId, sellerId, storeId, search } = req.body;
    const match = {};

    if (customerId) match.customerId = customerId;
    if (sellerId) match.sellerId = new mongoose.Types.ObjectId(sellerId);
    if (storeId) match.storeId = new mongoose.Types.ObjectId(storeId);

    if (search) {
      match.orderNumber = { $regex: search, $options: "i" };
    }
    let total = await Order.countDocuments(match);

    let ordersQuery = Order.find(match)
      .sort({ createdAt: -1 })
      .populate({ path: "storeId", select: "storeName city state " })
      .populate({ path: "sellerId", select: "userInfo userAuth.email " })
      .populate({ path: "customerId", select: "fullName email mobile" })
      .populate({ path: "customerAddressId" })
      .lean();

    // If page & limit are provided, apply pagination
    if (page && limit) {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      ordersQuery = ordersQuery.skip(skip).limit(parseInt(limit));
    }

    const orders = await ordersQuery;

    if (!orders.length) {
      return sendResponse(res, 404, false, "No orders found");
    }

    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const items = await OrderItem.find({ orderId: new mongoose.Types.ObjectId(order._id) })
          .populate({ path: "categoryId", select: "name" })
          .populate({ path: "subcategoryId", select: "name" })
          .populate({
            path: "productId",
            select: "name primaryImage description sellingPrice",
          })
          .populate({
            path: "productSizeId",
            select: "sku",
          })
          .lean();

        const enrichedItems = items.map((item) => ({
          ...item,
          productImage: item.productId?.image || null,
          categoryName: item.categoryId?.name || null,
          subcategoryName: item.subcategoryId?.name || null,
        }));

        const paymentType = await PaymentType.findOne({
          indexNumber: order.paymentTypeId,
          isDeleted: false,
        });

        return {
          ...order,
          items: enrichedItems,
          paymentType: paymentType?.name || "N/A",
        };
      })
    );

    return sendResponse(res, 200, true, "Orders fetched successfully", {
      ...(page && limit
        ? {totalOrders : total, totalPages: Math.ceil(total / limit), currentPage: parseInt(page) }
        : {}),
      orders: ordersWithDetails,
    });
  } catch (error) {
    console.error("List Orders Error:", error.message);
    return sendResponse(res, 500, false, error.message);
  }
};

/**
 *
 * Get Order Details by ID
 *
 */
export const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return sendResponse(res, 400, false, "Order ID is required");
    }

    // Find the order
    const order = await Order.findById(orderId)
      .populate({ path: "storeId", select: "storeName city state" })
      .populate({ path: "sellerId", select: "userInfo userAuth.email" })
      .populate({ path: "customerId", select: "fullName email mobile" })
      .populate({ path: "customerAddressId" })
      .lean();

    if (!order) {
      return sendResponse(res, 404, false, "Order not found");
    }

    // Fetch order items
    const items = await OrderItem.find({ orderId: order._id })
      .populate({ path: "categoryId", select: "name" })
      .populate({ path: "subcategoryId", select: "name" })
      .populate({
        path: "productId",
        select: "name primaryImage description sellingPrice",
      })
      .populate({
        path: "productSizeId",
        select: "sku",
      })
      .lean();

    const enrichedItems = items.map((item) => ({
      ...item,
      productImage: item.productId?.primaryImage || null,
      categoryName: item.categoryId?.name || null,
      subcategoryName: item.subcategoryId?.name || null,
    }));

    const paymentType = await PaymentType.findOne({
      indexNumber: order.paymentTypeId,
      isDeleted: false,
    }).select("name");

    let shipment = await Shipment.findOne({ orderId: order._id })
      .populate({
        path: "shipmentProviderId",
        select: "name indexNumber status",
      })
      .lean();

    let shipmentHistory = [];
    if (shipment?._id) {
      shipmentHistory = await ShipmentHistory.find({
        shipmentId: shipment._id,
      }).sort({ createdAt: -1 });
    }

    return sendResponse(res, 200, true, "Order details fetched successfully", {
      ...order,
      items: enrichedItems,
      paymentType: paymentType?.name,
      shipment,
      shipmentHistory,
    });
  } catch (error) {
    console.error("Get Order Details Error:", error.message);
    return sendResponse(res, 500, false, error.message);
  }
};


