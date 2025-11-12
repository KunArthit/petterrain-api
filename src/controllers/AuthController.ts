import { Elysia, t } from "elysia";
import UserService from "../classes/AuthClass";
import UserService2 from "../classes/UserClass";

// JWT verification middleware
const verifyJWT = async ({ headers, set }: any) => {
  const authHeader = headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    set.status = 401;
    return { error: "Authorization header missing or invalid" };
  }

  const token = authHeader.split(" ")[1];
  const { valid, userData } = await UserService.verifyToken(token);

  if (!valid) {
    set.status = 401;
    return { error: "Invalid or expired token" };
  }

  return { user: userData };
};

export const AuthController = new Elysia()
  // Login endpoint
  .post(
    "/smart-farm-login",
    async ({ body }) => {
      const { username, password } = body;

      if (!username || !password)
        return { error: "Username and password are required" };

      try {
        const result = await UserService.smartFarmLogin(username, password);
        return {
          user: result.user,
          access_token: result.token,
        };
      } catch (error) {
        return {
          error:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        };
      }
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
    }
  )

  .post(
    "/admin-login",
    async ({ body }) => {
      const { username, password } = body;

      if (!username || !password)
        return { error: "Username and password are required" };

      try {
        const result = await UserService.adminLogin(username, password);
        return {
          user: result.user,
          access_token: result.token,
        };
      } catch (error) {
        return {
          error:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        };
      }
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
    }
  )

  .get("/verify", async ({ headers, set }) => {
    const authHeader = headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      set.status = 401;
      return { error: "Authorization header missing or invalid" };
    }

    const token = authHeader.split(" ")[1];
    const { valid, userData } = await UserService.verifyToken(token);

    if (!valid) {
      set.status = 401;
      return { error: "Invalid or expired token" };
    }

    return {
      valid: true,
      user: userData,
    };
  })
  // Sign in with token endpoint
  .get("/sign-in-with-token", async ({ headers, set }) => {
    const authHeader = headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      set.status = 401;
      return { error: "Authorization header missing or invalid" };
    }

    const token = authHeader.split(" ")[1];
    const { valid, userData } = await UserService.verifyToken(token);

    if (!valid) {
      set.status = 401;
      return { error: "Invalid or expired token" };
    }

    // Create a new token
    const newToken = await UserService.refreshToken(token);

    if (!newToken) {
      set.status = 401;
      return { error: "Failed to refresh token" };
    }

    // Set the new token in headers
    (set.headers as Record<string, string>)["New-Access-Token"] = newToken;
    return userData;
  })

  // Refresh token endpoint
  .post("/refresh", async ({ headers, set }) => {
    const authHeader = headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      set.status = 401;
      return { error: "Authorization header missing or invalid" };
    }

    const token = authHeader.split(" ")[1];
    const newToken = await UserService.refreshToken(token);

    if (!newToken) {
      set.status = 401;
      return { error: "Invalid token or user not found" };
    }

    // Set the new token in headers
    (set.headers as Record<string, string>)["New-Access-Token"] = newToken;

    return { success: true };
  })

  // Sign up endpoint
  .post(
    "/sign-up",
    async ({ body }) => {
      const { username, password, displayName } = body;

      try {
        // Set default user properties
        const userData = {
          username,
          password,
          display_name: displayName,
          user_type_id: 2, // Default user type (adjust as needed)
          department_id: 1, // Default department (adjust as needed)
        };

        const result = await UserService.registerUser(userData);

        return {
          user: result.user,
          access_token: result.token,
        };
      } catch (error) {
        return {
          error:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        };
      }
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
        displayName: t.String(),
      }),
    }
  )
  .post(
    "/user-creation",
    async ({ headers, body, set }) => {
      // Validate token first (this should be an admin token in production)
      const authHeader = headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        set.status = 401;
        return { error: "Authorization header missing or invalid" };
      }

      const token = authHeader.split(" ")[1];
      const { valid, userData } = await UserService.verifyToken(token);

      if (!valid) {
        set.status = 401;
        return { error: "Invalid or expired token" };
      }

      // In production, you might want to check if this is an admin user
      // if (userData.user_type_id !== 1) {
      //   set.status = 403;
      //   return { error: "Not authorized to create users" };
      // }

      const { user } = body;

      try {
        // Extract necessary data for user creation
        const newUserData = {
          username: user.data?.email || "aws_user",
          password: Math.random().toString(36).slice(-8), // Random password (won't be used with AWS auth)
          display_name: user.data?.displayName || "AWS User",
          user_type_id: 2, // Regular user
          department_id: 1, // Default department
          email: user.data?.email || "aws_user@example.com",
          first_name: "DefaultFirstName",
          last_name: "DefaultLastName",
          phone: "000-000-0000",
          company_name: "DefaultCompany",
          tax_id: "000000000",
          is_active: 1,
        };

        // Check if user already exists
        const existingUser = await UserService.getUserByUsername(
          newUserData.username
        );

        if (existingUser) {
          // Return existing user without password
          const { password, ...userWithoutPassword } = existingUser;
          return userWithoutPassword;
        }

        // Create new user
        const createdUser = await UserService2.createUser(newUserData);

        if (!createdUser || typeof createdUser !== "object") {
          set.status = 500;
          return { error: "Failed to create user" };
        }

        // Remove password before returning
        const { password, ...userWithoutPassword } = createdUser as {
          password?: string;
          [key: string]: any;
        };

        return userWithoutPassword;
      } catch (error) {
        set.status = 500;
        return {
          error:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        };
      }
    },
    {
      body: t.Object({
        user: t.Object({
          data: t.Optional(
            t.Object({
              email: t.Optional(t.String()),
              displayName: t.Optional(t.String()),
            })
          ),
        }),
      }),
    }
  )

  // Get user by ID endpoint
  .get(
    "/user/:id",
    async ({ params }) => {
      const { id } = params;
      const userId = parseInt(id);

      if (isNaN(userId)) {
        return { error: "Invalid user ID" };
      }

      const user = await UserService.getUserById(userId);

      if (!user) {
        return { error: "User not found" };
      }

      // Remove password before returning
      const { password, ...userWithoutPassword } = user;

      return userWithoutPassword;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )

  // Update user endpoint
  .put(
    "/user/:id",
    async ({ params, body }) => {
      const { id } = params;
      const userId = parseInt(id);
      const { user } = body;

      if (isNaN(userId)) {
        return { error: "Invalid user ID" };
      }

      try {
        const updatedUser = await UserService.updateUser(userId, user);

        if (!updatedUser) {
          return { error: "User not found or update failed" };
        }

        // Remove password before returning
        const { password, ...userWithoutPassword } = updatedUser;

        return userWithoutPassword;
      } catch (error) {
        return {
          error:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        user: t.Object({}),
      }),
    }
  );
