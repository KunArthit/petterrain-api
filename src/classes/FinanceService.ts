import db from "@/core/database";

interface StatementData {
  spent: number;
  minimum: number;
}

class FinanceService {
  private MINIMUM_PERCENTAGE = 0.269;

  async getStatementData(): Promise<{
    previous: {
      total_amount: number;
      shipping_cost: number;
      tax_amount: number;
      income: number; // total - tax - shipping
    };
    current: {
      total_amount: number;
      shipping_cost: number;
      tax_amount: number;
      income: number;
    };
  }> {
    const conn = await db.getConnection();

    const now = new Date();
    const firstDayOfCurrentMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );
    
    const firstDayOfPreviousMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );

    const formatDate = (date: Date) => date.toISOString().slice(0, 10);

    try {
      const [prevRows]: any[] = await conn.query(
        `SELECT 
         SUM(total_amount) AS total_amount,
         SUM(shipping_cost) AS shipping_cost,
         SUM(tax_amount) AS tax_amount
       FROM orders
       WHERE created_at >= '${formatDate(firstDayOfPreviousMonth)}'
         AND created_at < '${formatDate(firstDayOfCurrentMonth)}'
         AND order_status = 'paid';`
      );

      const [currentRows]: any[] = await conn.query(
        `SELECT 
         SUM(total_amount) AS total_amount,
         SUM(shipping_cost) AS shipping_cost,
         SUM(tax_amount) AS tax_amount
       FROM orders
       WHERE created_at >= '${formatDate(firstDayOfCurrentMonth)}'
         AND order_status = 'paid';`
      );

      const prev = prevRows[0] || {};
      const curr = currentRows[0] || {};

      return {
        previous: {
          total_amount: prev.total_amount || 0,
          shipping_cost: prev.shipping_cost || 0,
          tax_amount: prev.tax_amount || 0,
          income:
            (prev.total_amount || 0) -
            (prev.shipping_cost || 0) -
            (prev.tax_amount || 0),
        },
        current: {
          total_amount: curr.total_amount || 0,
          shipping_cost: curr.shipping_cost || 0,
          tax_amount: curr.tax_amount || 0,
          income:
            (curr.total_amount || 0) -
            (curr.shipping_cost || 0) -
            (curr.tax_amount || 0),
        },
      };
    } catch (error) {
      console.error("Failed to get statement data:", error);
      throw new Error("Failed to fetch finance data");
    } finally {
      conn.release();
    }
  }

  async getAccountBalanceData(): Promise<{
    averageMonthlyIncome: number;
    averageMonthlyGrowth: number;
    monthlyTotals: { month: string; total: number }[];
  }> {
    const conn = await db.getConnection();

    try {
      const result: { [key: string]: any }[] = [];

      const now = new Date();
      const monthlyTotals: { month: string; total: number }[] = [];

      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

        const [rows]: any[] = await conn.query(
          `SELECT SUM(total_amount) AS total 
         FROM orders 
         WHERE created_at >= ? AND created_at < ? AND order_status = 'completed';`,
          [monthStart, monthEnd]
        );

        const total = rows[0]?.total || 0;
        const monthLabel = monthStart.toLocaleString("en-US", {
          month: "short",
          year: "numeric",
        });

        monthlyTotals.push({ month: monthLabel, total });
      }

      const avgMonthlyIncome =
        monthlyTotals.reduce((sum, m) => sum + m.total, 0) / 12;

      // Calculate monthly growth from previous to current month
      let totalGrowth = 0;
      for (let i = 1; i < monthlyTotals.length; i++) {
        const prev = monthlyTotals[i - 1].total;
        const curr = monthlyTotals[i].total;
        const growth = prev === 0 ? 0 : ((curr - prev) / prev) * 100;
        totalGrowth += growth;
      }
      const avgGrowth = totalGrowth / (monthlyTotals.length - 1);

      return {
        averageMonthlyIncome: parseFloat(avgMonthlyIncome.toFixed(2)),
        averageMonthlyGrowth: parseFloat(avgGrowth.toFixed(2)),
        monthlyTotals,
      };
    } catch (error) {
      console.error("Failed to fetch account balance data:", error);
      throw new Error("Failed to fetch account balance data");
    } finally {
      conn.release();
    }
  }

  async getRecentTransactions(limit = 5): Promise<
    {
      transaction_id: string;
      date: string;
      amount: number;
      status: string;
      user_name?: string; // Optional if you want to join users
    }[]
  > {
    const conn = await db.getConnection();
    try {
      const [rows]: any[] = await conn.query(
        `SELECT pt.transaction_reference AS transaction_id,
                pt.payment_date AS date,
                pt.amount,
                pt.transaction_status AS status,
                u.full_name AS user_name
         FROM payment_transactions pt
         LEFT JOIN orders o ON pt.order_id = o.order_id
         LEFT JOIN users u ON o.user_id = u.user_id
         ORDER BY pt.payment_date DESC
         LIMIT ?;`,
        [limit]
      );

      return rows.map((row: any) => ({
        transaction_id: row.transaction_id,
        date: new Date(row.date).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }),
        amount: row.amount,
        status: row.status.toUpperCase(),
        name: row.user_name || "—",
      }));
    } catch (error) {
      console.error("Failed to fetch recent transactions:", error);
      throw new Error("Failed to fetch recent transactions");
    } finally {
      conn.release();
    }
  }
}

export default new FinanceService();
