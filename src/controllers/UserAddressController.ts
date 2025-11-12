import { Elysia, t } from "elysia";
import UserAddressService from "../classes/UserAddressClass";

const userAddressController = new Elysia({
  prefix: "/user-address",
  tags: ["User Address"],
})
  // Get all user addresses
  .get("/", async () => {
    try {
      return await UserAddressService.getAllAddresses();
    } catch (error) {
      throw new Error("Failed to fetch user addresses");
    }
  })
  // ✅ Get all addresses by user ID
  .get("/user/:user_id", async ({ params }) => {
    try {
      return await UserAddressService.getAddressesByUserId(
        Number(params.user_id)
      );
    } catch (error) {
      throw new Error("Failed to fetch addresses by user ID");
    }
  })

  // ✅ Create new address for specific user
  .post(
    "/user/:user_id",
    async ({ params, body }) => {
      try {
        const addressId = await UserAddressService.createAddressForUser(
          Number(params.user_id),
          {
            ...body,
            address_line2: body.address_line2 ?? null,
          }
        );
        return { message: "User address created", address_id: addressId };
      } catch (error) {
        throw new Error("Failed to create address for user");
      }
    },
    {
      body: t.Object({
        address_type: t.String(),
        address_line1: t.String(),
        address_line2: t.Optional(t.String()),
        city: t.String(),
        state: t.String(),
        postal_code: t.String(),
        country: t.String(),
        is_default: t.Boolean(),
      }),
    }
  )
  // Get user address by ID
  .get("/:id", async ({ params }) => {
    try {
      const address = await UserAddressService.getAddressById(
        Number(params.id)
      );
      if (!address) throw new Error("User address not found");
      return address;
    } catch (error) {
      throw new Error("Failed to fetch user address");
    }
  })

  // Create user address
  .post(
    "/",
    async ({ body }) => {
      try {
        const addressId = await UserAddressService.createAddress({
          ...body,
          address_line2: body.address_line2 ?? null,
        });
        return { message: "User address created", address_id: addressId };
      } catch (error) {
        throw new Error("Failed to create user address");
      }
    },
    {
      body: t.Object({
        user_id: t.Number(),
        address_type: t.String(),
        address_line1: t.String(),
        address_line2: t.Optional(t.String()),
        city: t.String(),
        state: t.String(),
        postal_code: t.String(),
        country: t.String(),
        is_default: t.Boolean(),
      }),
    }
  )

  // Update user address
  .put(
    "/:id",
    async ({ params, body }) => {
      try {
        const success = await UserAddressService.updateAddress(
          Number(params.id),
          body
        );
        if (!success) throw new Error("User address update failed");
        return { message: "User address updated" };
      } catch (error) {
        throw new Error("Failed to update user address");
      }
    },
    {
      body: t.Partial(
        t.Object({
          user_id: t.Number(),
          address_type: t.String(),
          address_line1: t.String(),
          address_line2: t.Optional(t.String()),
          city: t.String(),
          state: t.String(),
          postal_code: t.String(),
          country: t.String(),
          is_default: t.Boolean(),
        })
      ),
    }
  )

  // Delete user address
  .delete("/:id", async ({ params }) => {
    try {
      const success = await UserAddressService.deleteAddress(Number(params.id));
      if (!success) throw new Error("User address deletion failed");
      return { message: "User address deleted" };
    } catch (error) {
      throw new Error("Failed to delete user address");
    }
  });

export default userAddressController;
