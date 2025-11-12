import { Elysia, t } from "elysia";
import CompanyContactService from "../classes/CompanyContactClass";
import { CompanyContactModel } from "@/models/CompanyContactModel";

const companyContactController = new Elysia({
  prefix: "/company-contact",
  tags: ["Company Contact"],
})
  // Get all company contacts
  .get("/", async () => {
    try {
      return await CompanyContactService.getAllContacts();
    } catch (error) {
      throw new Error("Failed to fetch company contacts");
    }
  })

  // Get company contact by ID
  .get("/:id", async ({ params }) => {
    try {
      const contact = await CompanyContactService.getContactById(
        Number(params.id)
      );
      if (!contact) throw new Error("Company contact not found");
      return contact;
    } catch (error) {
      throw new Error("Failed to fetch company contact");
    }
  })

  // Get contacts by Company User ID
  .get("/company/:company_user_id", async ({ params }) => {
    try {
      return await CompanyContactService.getContactsByCompanyUserId(
        Number(params.company_user_id)
      );
    } catch (error) {
      throw new Error("Failed to fetch company contacts for company user");
    }
  })

  // Create company contact
  .post(
    "/",
    async ({ body }) => {
      try {
        const contactId = await CompanyContactService.createContact({
          ...body,
          position: body.position ?? null,
          email: body.email ?? null,
          phone: body.phone ?? null,
        });
        return { message: "Company contact created", contact_id: contactId };
      } catch (error) {
        throw new Error("Failed to create company contact");
      }
    },
    {
      body: t.Object({
        company_user_id: t.Number(),
        contact_name: t.String(),
        position: t.Optional(t.String()),
        email: t.Optional(t.String()),
        phone: t.Optional(t.String()),
        is_primary: t.Boolean(),
      }),
    }
  )

  // Update company contact
  .put(
    "/:id",
    async ({
      params,
      body,
    }: {
      params: { id: string };
      body: Partial<Omit<CompanyContactModel, "contact_id" | "created_at">>;
    }) => {
      try {
        const success = await CompanyContactService.updateContact(
          Number(params.id),
          body
        );
        if (!success) throw new Error("Company contact update failed");
        return { message: "Company contact updated" };
      } catch (error) {
        throw new Error("Failed to update company contact");
      }
    }
  )

  // Delete company contact
  .delete("/:id", async ({ params }) => {
    try {
      const success = await CompanyContactService.deleteContact(
        Number(params.id)
      );
      if (!success) throw new Error("Company contact deletion failed");
      return { message: "Company contact deleted" };
    } catch (error) {
      throw new Error("Failed to delete company contact");
    }
  });

export default companyContactController;
