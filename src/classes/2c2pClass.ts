import db from "@/core/database";

export interface PaymentTransactionData {
  order_id: number;
  amount: number;
  payment_method: string;
  transaction_status: "pending" | "completed" | "failed" | "refunded";
  transaction_reference: string;
  payment_date?: Date;
  notes?: string;
}

export interface PaymentTransactionRecord {
  transaction_id: number;
  order_id: number;
  amount: number;
  payment_method: string;
  transaction_status: "pending" | "completed" | "failed" | "refunded";
  transaction_reference: string;
  payment_date: Date;
  notes?: string;
  created_at: Date;
}

class PaymentTransactionService {
  /**
   * Create a payment transaction log
   * Fixed: Ensure correct table structure and proper datetime handling
   */
  static async createPaymentLog(data: PaymentTransactionData) {
    try {
      // Helper function to format date for MySQL
      const formatMySQLDatetime = (date: Date | string | null | undefined): string => {
        if (!date) {
          // If no date provided, use current date
          return new Date().toISOString().slice(0, 19).replace('T', ' ');
        }

        let validDate: Date;
        
        if (typeof date === 'string') {
          // Try to parse string date
          validDate = new Date(date);
        } else if (date instanceof Date) {
          validDate = date;
        } else {
          // Fallback to current date for any other type
          validDate = new Date();
        }

        // Check if the date is valid
        if (isNaN(validDate.getTime())) {
          // If invalid date, use current date
          validDate = new Date();
        }

        // Format as MySQL datetime (YYYY-MM-DD HH:MM:SS)
        return validDate.toISOString().slice(0, 19).replace('T', ' ');
      };

      const query = `
        INSERT INTO payment_transactions (
          order_id, amount, payment_method, transaction_status, 
          transaction_reference, payment_date, notes, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      // Format the payment_date properly
      const formattedPaymentDate = formatMySQLDatetime(data.payment_date);

      const result = await db.execute(query, [
        data.order_id,
        data.amount,
        data.payment_method,
        data.transaction_status,
        data.transaction_reference,
        formattedPaymentDate,
        data.notes || null,
      ]);

      console.log(`💳 Payment transaction logged for order ${data.order_id}`);
      return result;
    } catch (error) {
      console.error("❌ Error creating payment log:", error);
      throw error;
    }
  }

  /**
   * Get payment transactions by order ID
   * Fixed: Use correct table and column names, removed updated_at
   */
  static async getPaymentTransactionsByOrderId(
    orderId: number
  ): Promise<PaymentTransactionRecord[]> {
    try {
      const query = `
        SELECT transaction_id, order_id, amount, payment_method, transaction_status,
               transaction_reference, payment_date, notes, created_at
        FROM payment_transactions 
        WHERE order_id = ? 
        ORDER BY created_at DESC
      `;

      const [rows] = await db.execute(query, [orderId]);
      return (rows as PaymentTransactionRecord[]) || [];
    } catch (error) {
      console.error("❌ Error fetching payment transactions:", error);
      throw error;
    }
  }

  /**
   * Update transaction status
   * Fixed: Removed updated_at column reference
   */
  static async updateTransactionStatus(
    transactionReference: string,
    status: "pending" | "completed" | "failed" | "refunded",
    notes?: string
  ) {
    try {
      const query = `
        UPDATE payment_transactions 
        SET transaction_status = ?, notes = ?
        WHERE transaction_reference = ?
      `;

      const result = await db.execute(query, [
        status,
        notes || null,
        transactionReference,
      ]);
      return result;
    } catch (error) {
      console.error("❌ Error updating transaction status:", error);
      throw error;
    }
  }

  /**
   * Get transaction by reference
   * Fixed: Use correct column names and proper type casting
   */
  static async getTransactionByReference(
    transactionReference: string
  ): Promise<PaymentTransactionRecord | null> {
    try {
      const query = `
        SELECT transaction_id, order_id, amount, payment_method, transaction_status,
               transaction_reference, payment_date, notes, created_at
        FROM payment_transactions 
        WHERE transaction_reference = ?
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const result = await db.execute(query, [transactionReference]);
      const rows = result[0] as PaymentTransactionRecord[];
      return rows[0] || null;
    } catch (error) {
      console.error("❌ Error fetching transaction by reference:", error);
      throw error;
    }
  }

  /**
   * Get all transactions for an order with summary
   * New method: Useful for order details page
   */
  static async getOrderTransactionSummary(orderId: number) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_transactions,
          SUM(CASE WHEN transaction_status = 'completed' THEN amount ELSE 0 END) as total_paid,
          SUM(CASE WHEN transaction_status = 'failed' THEN 1 ELSE 0 END) as failed_attempts,
          MAX(CASE WHEN transaction_status = 'completed' THEN created_at END) as last_successful_payment
        FROM payment_transactions 
        WHERE order_id = ?
      `;

      const result = await db.execute(query, [orderId]);
      const rows = result[0] as Array<{
        total_transactions: number;
        total_paid: number;
        failed_attempts: number;
        last_successful_payment: Date | null;
      }>;
      return (
        rows[0] || {
          total_transactions: 0,
          total_paid: 0,
          failed_attempts: 0,
          last_successful_payment: null,
        }
      );
    } catch (error) {
      console.error("❌ Error fetching transaction summary:", error);
      throw error;
    }
  }

  /**
   * Get transactions by status
   * Additional helper method
   */
  static async getTransactionsByStatus(
    status: "pending" | "completed" | "failed" | "refunded",
    limit: number = 100
  ): Promise<PaymentTransactionRecord[]> {
    try {
      const query = `
        SELECT transaction_id, order_id, amount, payment_method, transaction_status,
               transaction_reference, payment_date, notes, created_at
        FROM payment_transactions 
        WHERE transaction_status = ?
        ORDER BY created_at DESC
        LIMIT ?
      `;

      const [rows] = await db.execute(query, [status, limit]);
      return (rows as PaymentTransactionRecord[]) || [];
    } catch (error) {
      console.error("❌ Error fetching transactions by status:", error);
      throw error;
    }
  }

  /**
   * Get transaction count for a specific order
   * Additional helper method
   */
  static async getTransactionCount(orderId: number): Promise<number> {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM payment_transactions 
        WHERE order_id = ?
      `;

      const result = await db.execute(query, [orderId]);
      const rows = result[0] as Array<{ count: number }>;
      return rows[0]?.count || 0;
    } catch (error) {
      console.error("❌ Error fetching transaction count:", error);
      throw error;
    }
  }
}

export default PaymentTransactionService;
