import { ProductModel } from "../models/ProductsModel";
import db from "@/core/database";
import { RowDataPacket, FieldPacket } from "mysql2";

class ReportService {
  // Get products count
  async getProductSummary(): Promise<{
    totalProducts: number;
    activeProducts: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) AS total_products,
        SUM(CASE WHEN p.is_active = 1 THEN 1 ELSE 0 END) AS active_products
      FROM products p;
    `;

    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query<RowDataPacket[]>(query);
      return {
        totalProducts: rows[0].total_products,
        activeProducts: rows[0].active_products,
      };
    } catch (error) {
      console.error("Failed to fetch product summary:", error);
      throw new Error("Failed to fetch product summary");
    } finally {
      conn.release();
    }
  }

  // Get all categories count
  async getCategorySummary(): Promise<{
    totalCategories: number;
    activeCategories: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) AS total_categories,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_categories
      FROM product_categories;
    `;

    const conn = await db.getConnection();
    try {
      const [rows]: [RowDataPacket[], FieldPacket[]] = await conn.query(query);
      return {
        totalCategories: rows[0].total_categories,
        activeCategories: rows[0].active_categories,
      };
    } catch (error) {
      console.error("Failed to fetch category summary:", error);
      throw new Error("Failed to fetch category summary");
    } finally {
      conn.release();
    }
  }
  // Get all solutions count
  async getSolutionSummary(): Promise<{
    totalSolutions: number;
    closedToday: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) AS total_solutions,
        0 AS closed_today
      FROM solution_categories;
    `;

    const conn = await db.getConnection();
    try {
      const [rows]: [RowDataPacket[], FieldPacket[]] = await conn.query(query);
      return {
        totalSolutions: rows[0].total_solutions,
        closedToday: 0, // Since there is no `updated_at` column, we assume 0 for now
      };
    } catch (error) {
      console.error("Failed to fetch solution summary:", error);
      throw new Error("Failed to fetch solution summary");
    } finally {
      conn.release();
    }
  }

  async getWeeklyOrderSummary(): Promise<{
    totalOrders: number;
    bulkOrders: number;
    orderStatusBreakdown: {
      pending: number;
      awaitingPayment: number;
      paid: number;
      processing: number;
      shipped: number;
      delivered: number;
      cancelled: number;
    };
    dailyOrders: { day: string; count: number }[];
  }> {
    const conn = await db.getConnection();
    try {
      const summaryQuery = `
        SELECT 
          COUNT(*) AS totalOrders,
          SUM(CASE WHEN is_bulk_order = 1 THEN 1 ELSE 0 END) AS bulkOrders,
          SUM(CASE WHEN order_status = 'pending' THEN 1 ELSE 0 END) AS pending,
          SUM(CASE WHEN order_status = 'awaiting_payment' THEN 1 ELSE 0 END) AS awaitingPayment,
          SUM(CASE WHEN order_status = 'paid' THEN 1 ELSE 0 END) AS paid,
          SUM(CASE WHEN order_status = 'processing' THEN 1 ELSE 0 END) AS processing,
          SUM(CASE WHEN order_status = 'shipped' THEN 1 ELSE 0 END) AS shipped,
          SUM(CASE WHEN order_status = 'delivered' THEN 1 ELSE 0 END) AS delivered,
          SUM(CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
        FROM orders
        WHERE YEARWEEK(created_at, 1) = YEARWEEK(NOW(), 1);
      `;

      const dailyQuery = `
        SELECT 
          DAYNAME(created_at) AS day,
          COUNT(*) AS count
        FROM orders
        WHERE YEARWEEK(created_at, 1) = YEARWEEK(NOW(), 1)
        GROUP BY day
        ORDER BY FIELD(day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');
      `;

      const [summaryRows] = await conn.query<RowDataPacket[]>(summaryQuery);
      const [dailyRows] = await conn.query<RowDataPacket[]>(dailyQuery);

      return {
        totalOrders: summaryRows[0].totalOrders,
        bulkOrders: summaryRows[0].bulkOrders,
        orderStatusBreakdown: {
          pending: summaryRows[0].pending,
          awaitingPayment: summaryRows[0].awaitingPayment,
          paid: summaryRows[0].paid,
          processing: summaryRows[0].processing,
          shipped: summaryRows[0].shipped,
          delivered: summaryRows[0].delivered,
          cancelled: summaryRows[0].cancelled,
        },
        dailyOrders: dailyRows.map((row) => ({
          day: row.day,
          count: row.count,
        })),
      };
    } catch (error) {
      console.error("Failed to fetch weekly summary:", error);
      throw new Error("Failed to fetch weekly summary");
    } finally {
      conn.release();
    }
  }

  async getMonthlyOrderSummary(): Promise<{
    totalOrders: number;
    bulkOrders: number;
    orderStatusBreakdown: {
      pending: number;
      awaitingPayment: number;
      paid: number;
      processing: number;
      shipped: number;
      delivered: number;
      cancelled: number;
    };
    dailyOrders: { day: number; count: number }[]; // day = day of month
  }> {
    const conn = await db.getConnection();
    try {
      const summaryQuery = `
        SELECT 
          COUNT(*) AS totalOrders,
          SUM(CASE WHEN is_bulk_order = 1 THEN 1 ELSE 0 END) AS bulkOrders,
          SUM(CASE WHEN order_status = 'pending' THEN 1 ELSE 0 END) AS pending,
          SUM(CASE WHEN order_status = 'awaiting_payment' THEN 1 ELSE 0 END) AS awaitingPayment,
          SUM(CASE WHEN order_status = 'paid' THEN 1 ELSE 0 END) AS paid,
          SUM(CASE WHEN order_status = 'processing' THEN 1 ELSE 0 END) AS processing,
          SUM(CASE WHEN order_status = 'shipped' THEN 1 ELSE 0 END) AS shipped,
          SUM(CASE WHEN order_status = 'delivered' THEN 1 ELSE 0 END) AS delivered,
          SUM(CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
        FROM orders
        WHERE YEAR(created_at) = YEAR(NOW()) AND MONTH(created_at) = MONTH(NOW());
      `;

      const dailyQuery = `
        SELECT 
          DAY(created_at) AS day,
          COUNT(*) AS count
        FROM orders
        WHERE YEAR(created_at) = YEAR(NOW()) AND MONTH(created_at) = MONTH(NOW())
        GROUP BY day
        ORDER BY day;
      `;

      const [summaryRows] = await conn.query<RowDataPacket[]>(summaryQuery);
      const [dailyRows] = await conn.query<RowDataPacket[]>(dailyQuery);

      return {
        totalOrders: summaryRows[0].totalOrders,
        bulkOrders: summaryRows[0].bulkOrders,
        orderStatusBreakdown: {
          pending: summaryRows[0].pending,
          awaitingPayment: summaryRows[0].awaitingPayment,
          paid: summaryRows[0].paid,
          processing: summaryRows[0].processing,
          shipped: summaryRows[0].shipped,
          delivered: summaryRows[0].delivered,
          cancelled: summaryRows[0].cancelled,
        },
        dailyOrders: dailyRows.map((row) => ({
          day: row.day,
          count: row.count,
        })),
      };
    } catch (error) {
      console.error("Failed to fetch monthly summary:", error);
      throw new Error("Failed to fetch monthly summary");
    } finally {
      conn.release();
    }
  }

  async getYearlyOrderSummary(): Promise<{
    totalOrders: number;
    bulkOrders: number;
    orderStatusBreakdown: {
      pending: number;
      awaitingPayment: number;
      paid: number;
      processing: number;
      shipped: number;
      delivered: number;
      cancelled: number;
    };
    monthlyOrders: { month: string; count: number }[];
  }> {
    const conn = await db.getConnection();
    try {
      const summaryQuery = `
        SELECT 
          COUNT(*) AS totalOrders,
          SUM(CASE WHEN is_bulk_order = 1 THEN 1 ELSE 0 END) AS bulkOrders,
          SUM(CASE WHEN order_status = 'pending' THEN 1 ELSE 0 END) AS pending,
          SUM(CASE WHEN order_status = 'awaiting_payment' THEN 1 ELSE 0 END) AS awaitingPayment,
          SUM(CASE WHEN order_status = 'paid' THEN 1 ELSE 0 END) AS paid,
          SUM(CASE WHEN order_status = 'processing' THEN 1 ELSE 0 END) AS processing,
          SUM(CASE WHEN order_status = 'shipped' THEN 1 ELSE 0 END) AS shipped,
          SUM(CASE WHEN order_status = 'delivered' THEN 1 ELSE 0 END) AS delivered,
          SUM(CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
        FROM orders
        WHERE YEAR(created_at) = YEAR(NOW());
      `;

      const monthlyQuery = `
         SELECT 
    MONTH(created_at) AS month_number,
    MONTHNAME(created_at) AS month,
    COUNT(*) AS count
  FROM orders
  WHERE YEAR(created_at) = YEAR(NOW())
  GROUP BY MONTH(created_at), MONTHNAME(created_at)
  ORDER BY MONTH(created_at);
      `;

      const [summaryRows] = await conn.query<RowDataPacket[]>(summaryQuery);
      const [monthlyRows] = await conn.query<RowDataPacket[]>(monthlyQuery);

      return {
        totalOrders: summaryRows[0].totalOrders,
        bulkOrders: summaryRows[0].bulkOrders,
        orderStatusBreakdown: {
          pending: summaryRows[0].pending,
          awaitingPayment: summaryRows[0].awaitingPayment,
          paid: summaryRows[0].paid,
          processing: summaryRows[0].processing,
          shipped: summaryRows[0].shipped,
          delivered: summaryRows[0].delivered,
          cancelled: summaryRows[0].cancelled,
        },
        monthlyOrders: monthlyRows.map((row) => ({
          month: row.month,
          count: row.count,
        })),
      };
    } catch (error) {
      console.error("Failed to fetch yearly summary:", error);
      throw new Error("Failed to fetch yearly summary");
    } finally {
      conn.release();
    }
  }

  async getMostOrderedCategories(week: "this" | "last"): Promise<{
    categoryBreakdown: { category: string; totalOrdered: number }[];
    mostOrders: { category: string; totalOrdered: number };
    leastOrders: { category: string; totalOrdered: number };
  }> {
    const conn = await db.getConnection();

    const dateCondition =
      week === "this"
        ? "YEARWEEK(o.created_at, 1) = YEARWEEK(NOW(), 1)"
        : "YEARWEEK(o.created_at, 1) = YEARWEEK(NOW() - INTERVAL 1 WEEK, 1)";

    const query = `
      SELECT 
        pc.name AS category,
        SUM(oi.quantity) AS totalOrdered
      FROM order_items oi
      JOIN orders o ON o.order_id = oi.order_id
      JOIN products p ON p.product_id = oi.product_id
      JOIN product_categories pc ON pc.category_id = p.product_category_id
      WHERE ${dateCondition}
      GROUP BY pc.category_id
      ORDER BY totalOrdered DESC;
    `;

    try {
      const [rows] = await conn.query<RowDataPacket[]>(query);

      if (rows.length === 0) {
        return {
          categoryBreakdown: [],
          mostOrders: { category: "", totalOrdered: 0 },
          leastOrders: { category: "", totalOrdered: 0 },
        };
      }

      return {
        categoryBreakdown: rows.map((r) => ({
          category: r.category,
          totalOrdered: r.totalOrdered,
        })),
        mostOrders: rows[0] as { category: string; totalOrdered: number },
        leastOrders: {
          category: rows[rows.length - 1].category,
          totalOrdered: rows[rows.length - 1].totalOrdered,
        },
      };
    } catch (error) {
      console.error("Failed to fetch most ordered categories:", error);
      throw new Error("Failed to fetch most ordered categories");
    } finally {
      conn.release();
    }
  }
}

export default new ReportService();
