import { Elysia, t } from "elysia";
import PdpaConsentService from "../classes/PdpaConsentClass";

const pdpaConsentController = new Elysia({
  prefix: "/pdpa-consent",
  tags: ["PDPA Consent"],
})
  // Get all PDPA consents
  .get("/", async () => {
    try {
      return await PdpaConsentService.getAllConsents();
    } catch (error) {
      throw new Error("Failed to fetch PDPA consents");
    }
  })

  // Get PDPA consent by ID
  .get("/:id", async ({ params }) => {
    try {
      const consent = await PdpaConsentService.getConsentById(
        Number(params.id)
      );
      if (!consent) throw new Error("PDPA consent not found");
      return consent;
    } catch (error) {
      throw new Error("Failed to fetch PDPA consent");
    }
  })

  // Get PDPA consents by user ID
  .get("/user/:user_id", async ({ params }) => {
    try {
      return await PdpaConsentService.getConsentsByUserId(
        Number(params.user_id)
      );
    } catch (error) {
      throw new Error("Failed to fetch PDPA consents for user");
    }
  })

  // Create PDPA consent
  .post(
    "/",
    async ({ body }) => {
      try {
        const consentId = await PdpaConsentService.createConsent(body);
        return { message: "PDPA consent created", consent_id: consentId };
      } catch (error) {
        throw new Error("Failed to create PDPA consent");
      }
    },
    {
      body: t.Object({
        user_id: t.Number(),
        ip_address: t.String(),
        consent_text: t.String(),
        consented: t.Boolean(),
      }),
    }
  )

  // Update PDPA consent
  .put(
    "/:id",
    async ({ params, body }) => {
      try {
        const success = await PdpaConsentService.updateConsent(
          Number(params.id),
          body
        );
        if (!success) throw new Error("PDPA consent update failed");
        return { message: "PDPA consent updated" };
      } catch (error) {
        throw new Error("Failed to update PDPA consent");
      }
    },
    {
      body: t.Partial(
        t.Object({
          user_id: t.Number(),
          ip_address: t.String(),
          consent_text: t.String(),
          consented: t.Boolean(),
        })
      ),
    }
  )

  // Delete PDPA consent
  .delete("/:id", async ({ params }) => {
    try {
      const success = await PdpaConsentService.deleteConsent(Number(params.id));
      if (!success) throw new Error("PDPA consent deletion failed");
      return { message: "PDPA consent deleted" };
    } catch (error) {
      throw new Error("Failed to delete PDPA consent");
    }
  });

export default pdpaConsentController;
