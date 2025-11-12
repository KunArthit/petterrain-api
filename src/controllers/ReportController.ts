import { Elysia, t } from "elysia";
import ReportService from "@/classes/ReportClass";

const reportController = new Elysia({
  prefix: "/reports",
  tags: ["Reports"],
})
  //get product summary
  .get("/product-count", async () => {
    try {
      return await ReportService.getProductSummary();
    } catch (error) {
      console.error("Error fetching product summary:", error);
      throw new Error("Failed to fetch product summary");
    }
  })
  .get("/category-count", async () => {
    try {
      return await ReportService.getCategorySummary();
    } catch (error) {
      console.error("Error fetching category summary:", error);
      throw new Error("Failed to fetch category summary");
    }
  })
  .get("/solution-count", async () => {
    try {
      return await ReportService.getSolutionSummary();
    } catch (error) {
      console.error("Error fetching solution summary:", error);
      throw new Error("Failed to fetch solution summary");
    }
  })
  .get("/weekly-summary", async () => {
    try {
      return await ReportService.getWeeklyOrderSummary();
    } catch (error) {
      console.error("Error fetching weekly summary:", error);
      throw new Error("Failed to fetch weekly summary");
    }
  })
  .get("/order-summary/monthly", async () => {
    try {
      return await ReportService.getMonthlyOrderSummary();
    } catch (error) {
      console.error("Error fetching monthly summary:", error);
      throw new Error("Failed to fetch monthly summary");
    }
  })

  .get("/order-summary/yearly", async () => {
    try {
      return await ReportService.getYearlyOrderSummary();
    } catch (error) {
      console.error("Error fetching yearly summary:", error);
      throw new Error("Failed to fetch yearly summary");
    }
  })
  .get("/order-categories", async () => {
    try {
      return await ReportService.getMostOrderedCategories("this");
    } catch (error) {
      console.error("Error fetching yearly summary:", error);
      throw new Error("Failed to fetch yearly summary");
    }
  });
export default reportController;
