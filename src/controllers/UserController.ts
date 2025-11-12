import { Elysia, t } from "elysia";
import UserService from "../classes/UserClass";
import EmailService from "../classes/EmailService";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { env } from "../core/config";

const userController = new Elysia({
  prefix: "/users",
  tags: ["Users"],
}) // Get all users
  .get("/", async () => {
    try {
      return await UserService.getAllUsers();
    } catch (error) {
      throw new Error("Failed to fetch users");
    }
  })

  // Get user by ID
  .get(
    "/:id",
    async ({ params }) => {
      try {
        const user = await UserService.getUserById(Number(params.id));
        if (!user) throw new Error("User not found");
        return user;
      } catch (error) {
        throw new Error("Failed to fetch user");
      }
    },
    {
      params: t.Object({
        id: t.Number(),
      }),
    }
  )

  .post(
    "/cart-wish-list/user",
    async ({ body }) => {
      try {
        const cartItems = await UserService.getCartListByUserId(body);
        // if (!cartItems.length) throw new Error("Cart not found");
        return cartItems;
      } catch (error) {
        throw new Error("Failed to fetch Cart");
      }
    },
    {
      body: t.Object({
        id: t.Number(),
        type: t.String(),
      }),
    }
  )

  .post(
    "/cart-wish-list",
    async ({ body }) => {
      try {
        const insertId = await UserService.createCartWishList(body);
        return { success: true, insertId };
      } catch (error) {
        throw new Error("Failed to create cart wish list");
      }
    },
    {
      body: t.Object({
        user_id: t.Number(),
        product_id: t.Number(),
        type: t.String(),
        quantity: t.Number(),
      }),
    }
  )

  .put(
    "/cart-wish-list",
    async ({ body }) => {
      try {
        const success = await UserService.updateCartWishList(body);
        if (!success) throw new Error("Cart wish list not found or no change");
        return { success: true };
      } catch (error) {
        throw new Error("Failed to update cart wish list");
      }
    },
    {
      body: t.Object({
        id: t.Number(), // ต้องมี field 'id'
        quantity: t.Optional(t.Number()), // optional
      }),
    }
  )

  .delete(
    "/cart-wish-list/:id",
    async ({ params }) => {
      try {
        const success = await UserService.deleteCartWishList(Number(params.id));
        if (!success) throw new Error("Cart wish list not found");
        return { success: true };
      } catch (error) {
        throw new Error("Failed to delete cart wish list");
      }
    },
    {
      params: t.Object({
        id: t.Number(),
      }),
    }
  )

  // Create user
  .post(
    "/",
    async ({ body }) => {
      try {
        const userId = await UserService.createUser(body);
        return { message: "User created", user_id: userId };
      } catch (error) {
        throw new Error("Failed to create user");
      }
    },
    {
      body: t.Object({
        username: t.String(),
        email: t.String(),
        password: t.String(),
        first_name: t.String(),
        last_name: t.String(),
        phone: t.String(),
        user_type_id: t.Number(),
        department_id: t.Number(),
        company_name: t.String(),
        tax_id: t.String(),
        is_active: t.Number(),
      }),
    }
  )

  // UserController - Updated check endpoint
  .post(
    "/check",
    async ({ body }) => {
      try {
        const { username, email } = body;

        let userByUsername = null;
        let userByEmail = null;

        // ตรวจสอบ username ถ้ามี
        if (username) {
          userByUsername = await UserService.getUserByUsername(username);
        }

        // ตรวจสอบ email ถ้ามี
        if (email) {
          userByEmail = await UserService.getUserByEmail(email);
        }

        return {
          exists: !!(userByUsername || userByEmail),
          details: {
            usernameExists: !!userByUsername,
            emailExists: !!userByEmail,
          },
        };
      } catch (error) {
        console.error("Check user error:", error);
        throw new Error("Failed to check user");
      }
    },
    {
      body: t.Object({
        username: t.Optional(t.String()),
        email: t.Optional(t.String({ format: "email" })),
      }),
    }
  )

  // เพิ่ม endpoint สำหรับตรวจสอบ email โดยเฉพาะ
  .post(
    "/check-email",
    async ({ body }) => {
      try {
        const { email } = body;

        if (!email) {
          throw new Error("Email is required");
        }

        const user = await UserService.getUserByEmail(email);

        return {
          exists: !!user,
          message: user ? "Email already exists" : "Email is available",
        };
      } catch (error) {
        console.error("Check email error:", error);
        throw new Error("Failed to check email");
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
      }),
    }
  )

  // Update user
  .put(
    "/:id",
    async ({ params, body }) => {
      try {
        const success = await UserService.updateUser(Number(params.id), body);
        const res = {
          company_name: success.company_name,
          department_id: success.department_id,
          email: success.email,
          first_name: success.first_name,
          is_active: success.is_active,
          last_name: success.last_name,
          phone: success.phone,
          tax_id: success.tax_id,
          updated_at: success.updated_at,
          created_at: success.created_at,
          user_id: success.user_id,
          user_type_id: success.user_type_id,
          username: success.username,
        };

        if (!success) throw new Error("User update failed");
        return res;
      } catch (error) {
        throw new Error("Failed to update user");
      }
    },
    {
      body: t.Partial(
        t.Object({
          username: t.String(),
          email: t.String(),
          password: t.String(),
          first_name: t.String(),
          last_name: t.String(),
          phone: t.String(),
          user_type_id: t.Number(),
          department_id: t.Number(),
          company_name: t.String(),
          tax_id: t.String(),
          is_active: t.Number(),
        })
      ),
    }
  )

  // Password Change
  .put(
    "/change-password/:id",
    async ({ params, body }) => {
      try {
        const user = await UserService.getUserById(Number(params.id));

        // 1. ตรวจสอบว่าผู้ใช้มีอยู่
        if (!user) throw new Error("User not found");

        // 2. ตรวจสอบ password เดิม
        const isMatch = await bcrypt.compare(body.oldPassword, user.password);
        if (!isMatch) {
          return new Error("Incorrect current password");
        }

        // 3. เข้ารหัส password ใหม่
        const newHashedPassword = await bcrypt.hash(body.newPassword, 10);

        // 4. อัปเดตรหัสผ่านใหม่
        const success = await UserService.userPasswordChange(
          Number(params.id),
          newHashedPassword
        );

        if (!success) {
          return new Error("Failed to update password");
        }

        return { message: "Password updated successfully" };
      } catch (error) {
        console.error(error);
        return new Error("Failed to update password");
      }
    },
    {
      body: t.Object({
        oldPassword: t.String(),
        newPassword: t.String(),
      }),
    }
  )

  // Delete user
  .delete("/:id", async ({ params }) => {
    try {
      const success = await UserService.deleteUser(Number(params.id));
      if (!success) throw new Error("User deletion failed");
      return { message: "User deleted" };
    } catch (error) {
      throw new Error("Failed to delete user");
    }
  })

  .post(
    "/auth/forgot-password",
    async ({ body, set }) => {
      try {
        const { email } = body;

        // Find user by email
        const user = await UserService.getUserByEmail(email);
        if (!user) {
          // Don't reveal if email exists or not for security
          return {
            message: "If this email exists, a reset link has been sent.",
          };
        }

        // Generate reset token
        const token = jwt.sign(
          { email, user_id: user.user_id },
          env.SECRET_KEY,
          { expiresIn: "15m" }
        );

        // Create reset URL - using a generic frontend URL for now
        const resetUrl = `${process.env.FRONT_RETURN_URL}/reset-password?token=${token}`;

        // Send password reset email
        const success = await EmailService.sendPasswordResetEmail(
          email,
          resetUrl
        );

        if (!success) {
          set.status = 500;
          return { error: "Failed to send reset email" };
        }

        return { message: "Reset link sent if the email exists" };
      } catch (error) {
        console.error("Forgot password error:", error);
        set.status = 500;
        return { error: "Internal server error" };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
      }),
    }
  )
  .post(
    "/auth/reset-password",
    async ({ body, set }) => {
      try {
        const { token, newPassword } = body;

        // Verify the reset token
        const decoded = jwt.verify(token, env.SECRET_KEY) as {
          email: string;
          user_id: number;
        };
        const { email } = decoded;

        // Hash the new password
        const hashed = await bcrypt.hash(newPassword, 10);

        // Update the user's password
        const updated = await UserService.updateUserPassword(email, hashed);

        if (!updated) {
          set.status = 400;
          return { error: "User not found or update failed" };
        }

        return { message: "Password successfully reset" };
      } catch (err) {
        console.error("Reset password error:", err);
        set.status = 400;
        return { error: "Invalid or expired token" };
      }
    },
    {
      body: t.Object({
        token: t.String(),
        newPassword: t.String({ minLength: 6 }),
      }),
    }
  );

export default userController;
