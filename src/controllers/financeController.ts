import { Elysia } from "elysia";
import FinanceService from "../classes/FinanceService";

const financeController = new Elysia({
  prefix: "/finance",
  tags: ["Finance"],
})
  // Get finance dashboard data
  .get("/finance", async () => {
    try {
      const data = await FinanceService.getStatementData();
      return data;
    } catch (error) {
      console.error("Failed to fetch finance dashboard data:", error);
      throw new Error("Failed to fetch finance dashboard data");
    }
  })
  .get("/account-balance", async () => {
    try {
      return await FinanceService.getAccountBalanceData();
    } catch (error) {
      throw new Error("Failed to fetch account balance");
    }
  })
  .get("/recent", async () => {
    try {
      return await FinanceService.getRecentTransactions();
    } catch (error) {
      throw new Error("Failed to load recent transactions");
    }
  })
  .get("/recent", async () => {
    try {
      return await FinanceService.getRecentTransactions();
    } catch (error) {
      throw new Error("Failed to load recent transactions");
    }
  });

export default financeController;
