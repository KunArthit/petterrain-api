import { Elysia, t } from "elysia";
import OrderItemService from "../classes/OrderItemClass";
import { OrderItemModel } from "@/models/OrderItemModel";

const orderItemController = new Elysia({
  prefix: "/order-items",
  tags: ["Order-items"],
})
  // Get all order items
  .get("/", async () => {
    try {
      return await OrderItemService.getAllOrderItems();
    } catch (error) {
      throw new Error("Failed to fetch order items");
    }
  })

  // Get order item by ID
  .get("/:id", async ({ params }) => {
    try {
      const orderItem = await OrderItemService.getOrderItemById(
        Number(params.id)
      );
      if (!orderItem) throw new Error("Order item not found");
      return orderItem;
    } catch (error) {
      throw new Error("Failed to fetch order item");
    }
  })

  // Get order items by Order ID
  .get("/order/:order_id", async ({ params }) => {
    try {
      return await OrderItemService.getOrderItemsByOrderId(
        Number(params.order_id)
      );
    } catch (error) {
      throw new Error("Failed to fetch order items for order");
    }
  })

  .get("/date/:startDate/:endDate", async ({ params }) => {
    try {
      // 1. ดึงค่า startDate และ endDate จาก params
      const { startDate, endDate } = params;

      // 2. ส่งค่าทั้งสองตัวเข้าไปใน Service function
      return await OrderItemService.getOrderItemToChartAndSumProductItem(
        startDate,
        endDate
      );
    } catch (error) {
      // ปรับปรุง Error message ให้สื่อความหมายมากขึ้น
      throw new Error("Failed to fetch chart data for order items");
    }
  })

  // Create order item
  .post(
    "/",
    async ({ body }) => {
      try {
        const orderItemId = await OrderItemService.createOrderItem(body);
        return { message: "Order item created", item_id: orderItemId };
      } catch (error) {
        throw new Error("Failed to create order item");
      }
    },
    {
      body: t.Object({
        order_id: t.Number(),
        product_id: t.Number(),
        quantity: t.Number(),
        unit_price: t.Number(),
        subtotal: t.Number(),
      }),
    }
  )

  // Update order item
  .put(
    "/:id",
    async ({
      params,
      body,
    }: {
      params: { id: string };
      body: Partial<Omit<OrderItemModel, "item_id">>;
    }) => {
      try {
        const success = await OrderItemService.updateOrderItem(
          Number(params.id),
          body
        );
        if (!success) throw new Error("Order item update failed");
        return { message: "Order item updated" };
      } catch (error) {
        throw new Error("Failed to update order item");
      }
    }
  )

  // Delete order item
  .delete("/:id", async ({ params }) => {
    try {
      const success = await OrderItemService.deleteOrderItem(Number(params.id));
      if (!success) throw new Error("Order item deletion failed");
      return { message: "Order item deleted" };
    } catch (error) {
      throw new Error("Failed to delete order item");
    }
  });

export default orderItemController;
