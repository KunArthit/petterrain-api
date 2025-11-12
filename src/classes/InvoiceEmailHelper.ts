import EmailService from "./EmailService";
import OrderService from "./OrderClass";
import UserService from "./UserClass";
import ProductsClass from "./ProductsClass";

interface InvoiceEmailParams {
  orderId: number;
  invoiceNo: string;
  amount: number;
  currency?: string;
  paymentMethod?: string;
}

interface OrderItemWithProduct {
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  productName: string;
  productSku: string;
}

class InvoiceEmailHelper {
  /**
   * Main function to send invoice email - This is the split function you requested
   */
  static async sendInvoiceEmailForOrder(params: InvoiceEmailParams): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      console.log(
        `📧 Starting invoice email process for order ${params.orderId}, invoice ${params.invoiceNo}`
      );

      // Step 1: Get order details
      const orderDetails = await this.getOrderDetails(params.orderId);
      if (!orderDetails) {
        return {
          success: false,
          message: `Order not found: ${params.orderId}`,
        };
      }

      // Step 2: Get customer information
      const customerInfo = await this.getCustomerInfo(orderDetails.user_id);
      if (!customerInfo || !customerInfo.email) {
        return {
          success: false,
          message: `Customer email not found for user: ${orderDetails.user_id}`,
        };
      }

      // Step 3: Get order items with product details
      const orderItemsWithProducts = await this.getOrderItemsWithProducts(
        params.orderId
      );

      // Step 4: Prepare email data
      const emailData = await this.prepareInvoiceEmailData({
        ...params,
        orderDetails,
        customerInfo,
        orderItemsWithProducts,
      });

      // Step 5: Send the email
      const emailSent = await EmailService.sendInvoiceEmail(emailData);

      if (emailSent) {
        console.log(
          `✅ Invoice email sent successfully for order ${params.orderId}`
        );
        return {
          success: true,
          message: "Invoice email sent successfully",
          details: {
            recipient: customerInfo.email,
            invoiceNo: params.invoiceNo,
            amount: params.amount,
          },
        };
      } else {
        return {
          success: false,
          message: "Failed to send invoice email",
        };
      }
    } catch (error) {
      console.error(
        `❌ Error sending invoice email for order ${params.orderId}:`,
        error
      );
      return {
        success: false,
        message: "Error occurred while sending invoice email",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get order details from database
   */
  private static async getOrderDetails(orderId: number): Promise<any> {
    try {
      const order = await OrderService.getOrderById(orderId);
      return order;
    } catch (error) {
      console.error(`❌ Failed to get order details for ${orderId}:`, error);
      return null;
    }
  }

  /**
   * Get customer information including email
   */
  private static async getCustomerInfo(
    userId: number
  ): Promise<{ email: string; name: string } | null> {
    try {
      // UserService is exported as an instance
      const user = await UserService.getUserById(userId);

      if (!user) {
        return null;
      }

      return {
        email: user.email || user.username + "@example.com", // Fallback if email not available
        name:
          user.first_name && user.last_name
            ? `${user.first_name} ${user.last_name}`
            : user.username || "Customer",
      };
    } catch (error) {
      console.error(
        `❌ Failed to get customer info for user ${userId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Get order items with product details
   */
  private static async getOrderItemsWithProducts(
    orderId: number
  ): Promise<OrderItemWithProduct[]> {
    try {
      const order = await OrderService.getOrderById(orderId);
      if (!order || !order.items) {
        return [];
      }

      const itemsWithProducts: OrderItemWithProduct[] = [];

      for (const item of order.items) {
        try {
          const productDetails = await ProductsClass.getProductDetails(
            item.product_id
          );

          itemsWithProducts.push({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.subtotal,
            productName: productDetails?.name || `Product ${item.product_id}`,
            productSku: productDetails?.sku || "",
          });
        } catch (productError) {
          console.error(
            `⚠️ Failed to get product details for ${item.product_id}:`,
            productError
          );
          // Add item with basic info even if product details fail
          itemsWithProducts.push({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.subtotal,
            productName: `Product ${item.product_id}`,
            productSku: "",
          });
        }
      }

      return itemsWithProducts;
    } catch (error) {
      console.error(`❌ Failed to get order items for ${orderId}:`, error);
      return [];
    }
  }

  /**
   * Prepare email data structure
   */
  private static async prepareInvoiceEmailData(params: {
    orderId: number;
    invoiceNo: string;
    amount: number;
    currency?: string;
    paymentMethod?: string;
    orderDetails: any;
    customerInfo: { email: string; name: string };
    orderItemsWithProducts: OrderItemWithProduct[];
  }): Promise<any> {
    return {
      userEmail: params.customerInfo.email,
      userName: params.customerInfo.name,
      invoiceNo: params.invoiceNo,
      amount: params.amount,
      currency: params.currency || "THB",
      orderItems: params.orderItemsWithProducts.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        subtotal: item.subtotal,
      })),
      orderDate: new Date(params.orderDetails.created_at || new Date()),
      paymentMethod: params.paymentMethod || "Credit Card",
    };
  }

  /**
   * Send payment confirmation email (separate function for payment success)
   */
  static async sendPaymentConfirmationForOrder(params: {
    orderId: number;
    invoiceNo: string;
    amount: number;
    currency?: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      console.log(
        `🎉 Sending payment confirmation for order ${params.orderId}`
      );

      // Get order and customer details
      const orderDetails = await this.getOrderDetails(params.orderId);
      if (!orderDetails) {
        return { success: false, message: "Order not found" };
      }

      const customerInfo = await this.getCustomerInfo(orderDetails.user_id);
      if (!customerInfo || !customerInfo.email) {
        return { success: false, message: "Customer email not found" };
      }

      // Send payment confirmation
      const emailSent = await EmailService.sendPaymentConfirmationEmail(
        customerInfo.email,
        customerInfo.name,
        params.invoiceNo,
        params.amount,
        params.currency || "THB"
      );

      if (emailSent) {
        console.log(`✅ Payment confirmation sent for order ${params.orderId}`);
        return {
          success: true,
          message: "Payment confirmation sent successfully",
        };
      } else {
        return {
          success: false,
          message: "Failed to send payment confirmation",
        };
      }
    } catch (error) {
      console.error(
        `❌ Error sending payment confirmation for order ${params.orderId}:`,
        error
      );
      return {
        success: false,
        message: "Error occurred while sending payment confirmation",
      };
    }
  }

  /**
   * Utility function to validate email parameters
   */
  static validateInvoiceEmailParams(params: InvoiceEmailParams): {
    isValid: boolean;
    error?: string;
  } {
    if (!params.orderId || params.orderId <= 0) {
      return { isValid: false, error: "Invalid order ID" };
    }

    if (!params.invoiceNo || params.invoiceNo.trim().length === 0) {
      return { isValid: false, error: "Invoice number is required" };
    }

    if (!params.amount || params.amount <= 0) {
      return { isValid: false, error: "Invalid amount" };
    }

    return { isValid: true };
  }
}

export default InvoiceEmailHelper;
export type { InvoiceEmailParams, OrderItemWithProduct };
