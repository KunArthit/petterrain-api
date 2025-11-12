import { Elysia, t } from "elysia";
import CreditTermService from "../classes/CreditTermClass";

const creditTermController = new Elysia({
  prefix: "/credit-term",
  tags: ["Credit Term"],
})
  // Get all credit terms
  .get("/", async () => {
    try {
      return await CreditTermService.getAllCreditTerms();
    } catch (error) {
      throw new Error("Failed to fetch credit terms");
    }
  })

  // Get credit term by ID
  .get("/:id", async ({ params }) => {
    try {
      const term = await CreditTermService.getCreditTermById(Number(params.id));
      if (!term) throw new Error("Credit term not found");
      return term;
    } catch (error) {
      throw new Error("Failed to fetch credit term");
    }
  })

  // Get credit terms by user ID
  .get("/user/:user_id", async ({ params }) => {
    try {
      return await CreditTermService.getCreditTermsByUserId(
        Number(params.user_id)
      );
    } catch (error) {
      throw new Error("Failed to fetch credit terms for user");
    }
  })

  // Create credit term
  .post(
    "/",
    async ({ body }) => {
      try {
        const termId = await CreditTermService.createCreditTerm({
          ...body,
          notes: body.notes ?? null,
        });
        return { message: "Credit term created", term_id: termId };
      } catch (error) {
        throw new Error("Failed to create credit term");
      }
    },
    {
      body: t.Object({
        user_id: t.Number(),
        credit_limit: t.Number(),
        payment_term_days: t.Number(),
        is_active: t.Boolean(),
        notes: t.Optional(t.String()),
      }),
    }
  )

  // Update credit term
  .put(
    "/:id",
    async ({ params, body }) => {
      try {
        const success = await CreditTermService.updateCreditTerm(
          Number(params.id),
          body
        );
        if (!success) throw new Error("Credit term update failed");
        return { message: "Credit term updated" };
      } catch (error) {
        throw new Error("Failed to update credit term");
      }
    },
    {
      body: t.Partial(
        t.Object({
          user_id: t.Number(),
          credit_limit: t.Number(),
          payment_term_days: t.Number(),
          is_active: t.Boolean(),
          notes: t.Optional(t.String()),
        })
      ),
    }
  )

  // Delete credit term
  .delete("/:id", async ({ params }) => {
    try {
      const success = await CreditTermService.deleteCreditTerm(
        Number(params.id)
      );
      if (!success) throw new Error("Credit term deletion failed");
      return { message: "Credit term deleted" };
    } catch (error) {
      throw new Error("Failed to delete credit term");
    }
  });

export default creditTermController;
