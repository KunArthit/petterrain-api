import type { UserModel } from "@/models/UserModel";
import db from "@/core/database";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const SECRET_KEY =
  "66361c50ae255971f097887ccccf0fc59c604a2152f1326f36e134d05a49a5f86d7df7105d6e40884972b25ab4b8f13a79525766b6b97ecb569afb002a9279934041406c2e11f391bf67a1249934a617b51db3ae90ddfe99095a84150f454b2c00afaac6f3bb08d3b56bf124ce93c004697d2eee4c7157a2e1b1fda3349954b18c6d6051839bf0da88f1caab492ee27bd42d095b4b5f673377bde3f9fb54ce0913b1d366293d70205560e2f1d7fc9d370de64dcc24f9fdd2f14046b4c5f678c841a4345f9ff562363b1e4ef8e061c79f25dfccc750f507155504efb229f2d8a49cefd9a31078375c2e2820d30db625ef2465e1ff7987d026ad5567a6bb9a162c";
const TOKEN_EXPIRY = "1d";

class UserService {
  constructor() {
    console.log("User service created");
  }

  async getUserByUsername(username: string): Promise<UserModel | null> {
    const query = `SELECT * FROM users WHERE username = ?`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [username]);
      return (rows as UserModel[])[0] || null;
    } finally {
      conn.release();
    }
  }

  async getUserById(userId: number): Promise<UserModel | null> {
    const query = `SELECT * FROM users WHERE user_id = ?`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [userId]);
      return (rows as UserModel[])[0] || null;
    } finally {
      conn.release();
    }
  }

  // async login(
  //   username: string,
  //   password: string
  // ): Promise<{ token: string; user: Partial<UserModel> }> {
  //   const user = await this.getUserByUsername(username);
  //   if (!user) throw new Error("User not found");

  //   // Compare hashed password
  //   const isValidPassword = await bcrypt.compare(password, user.password);
  //   if (!isValidPassword) throw new Error("Invalid password");

  //   const payload = {
  //     user_id: user.user_id,
  //     username: user.username,
  //     user_type_id: user.user_type_id,
  //     department_id: user.department_id,
  //   };

  //   const token = jwt.sign(payload, SECRET_KEY, { expiresIn: TOKEN_EXPIRY });

  //   // Return user data without sensitive information
  //   const { password: _, ...userWithoutPassword } = user;

  //   return {
  //     token,
  //     user: userWithoutPassword,
  //   };
  // }

  async adminLogin(
    username: string,
    password: string
  ): Promise<{ token: string; user: Partial<UserModel> }> {
    const user = await this.getUserByUsername(username);
    if (!user) throw new Error("User not found");

    // Compare hashed password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) throw new Error("Invalid password");

    // ✅ Check permission by user_type_id
    if (![1, 6].includes(user.user_type_id)) {
      throw new Error("Access denied: insufficient permissions");
    }

    const payload = {
      user_id: user.user_id,
      username: user.username,
      user_type_id: user.user_type_id,
      department_id: user.department_id,
    };

    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: TOKEN_EXPIRY });

    // Return user data without sensitive information
    const { password: _, ...userWithoutPassword } = user;

    return {
      token,
      user: userWithoutPassword,
    };
  }

  async smartFarmLogin(
    username: string,
    password: string
  ): Promise<{ token: string; user: Partial<UserModel> }> {
    const user = await this.getUserByUsername(username);
    if (!user) throw new Error("User not found");

    // Compare hashed password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) throw new Error("Invalid password");

    const payload = {
      user_id: user.user_id,
      username: user.username,
      user_type_id: user.user_type_id,
      department_id: user.department_id,
    };

    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: TOKEN_EXPIRY });

    // Return user data without sensitive information
    const { password: _, ...userWithoutPassword } = user;

    return {
      token,
      user: userWithoutPassword,
    };
  }

  // Increase Forgot Password Function
  // Start

  async forgotPassword(email: string): Promise<string> {
    console.log("Inforgot Password");

    const user = await this.getUserByEmail(email);
    console.log(user);

    // if (!user) throw new Error("User not found");

    // const token = jwt.sign({ userId: user.user_id }, SECRET_KEY, {
    //   expiresIn: RESET_TOKEN_EXPIRY,
    // });

    // const resetLink = `http://localhost:3000/reset-password/${token}`;
    // await sendResetEmail(user.email, resetLink);

    return "Reset password link sent";
  }

  // async resetPassword(token: string, newPassword: string): Promise<string> {
  //   try {
  //     const payload = jwt.verify(token, SECRET_KEY) as { userId: number };

  //     const user = this.users.find((u) => u.user_id === payload.userId);
  //     if (!user) throw new Error("User not found");

  //     const hashed = await bcrypt.hash(newPassword, 10);
  //     user.password = hashed;

  //     return "Password updated successfully";
  //   } catch (err) {
  //     throw new Error("Invalid or expired token");
  //   }
  // }

  async getUserByEmail(email: string): Promise<UserModel | null> {
    console.log("in email");

    console.log(email);
    const query = `SELECT * FROM users WHERE email = ?`;
    const conn = await db.getConnection();
    console.log("pass connection");

    try {
      console.log("before query");
      const [rows] = await conn.query(query, [email]);
      console.log("out query");
      return (rows as UserModel[])[0] || null;
    } finally {
      conn.release();
    }
  }

  // End

  async verifyToken(
    token: string
  ): Promise<{ valid: boolean; userData?: any }> {
    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      const user = await this.getUserById((decoded as any).user_id);

      if (!user) {
        return { valid: false };
      }

      // Remove password from user data
      const { password: _, ...userWithoutPassword } = user;

      return {
        valid: true,
        userData: userWithoutPassword,
      };
    } catch (error) {
      return { valid: false };
    }
  }

  async refreshToken(token: string): Promise<string | null> {
    try {
      const decoded = jwt.verify(token, SECRET_KEY) as {
        user_id: number;
        username: string;
        user_type_id: number;
        department_id: number;
      };

      // Generate a new token
      const newToken = jwt.sign(
        {
          user_id: decoded.user_id,
          username: decoded.username,
          user_type_id: decoded.user_type_id,
          department_id: decoded.department_id,
        },
        SECRET_KEY,
        { expiresIn: TOKEN_EXPIRY }
      );

      return newToken;
    } catch (error) {
      return null;
    }
  }

  async updateUser(
    userId: number,
    userData: Partial<UserModel>
  ): Promise<UserModel | null> {
    // Remove sensitive fields that shouldn't be updated directly
    const { user_id, password, ...updateData } = userData;

    // Build SET clause for SQL
    const updateFields = Object.keys(updateData)
      .map((key) => `${key} = ?`)
      .join(", ");
    const updateValues = Object.values(updateData);

    if (updateFields.length === 0) {
      // No fields to update
      return this.getUserById(userId);
    }

    const query = `UPDATE users SET ${updateFields} WHERE user_id = ?`;
    const conn = await db.getConnection();

    try {
      await conn.query(query, [...updateValues, userId]);
      return this.getUserById(userId);
    } finally {
      conn.release();
    }
  }

  async registerUser(userData: {
    username: string;
    password: string;
    [key: string]: any;
  }): Promise<{ token: string; user: Partial<UserModel> }> {
    // Check if username already exists
    const existingUser = await this.getUserByUsername(userData.username);
    if (existingUser) {
      throw new Error("Username already exists");
    }

    // Extract fields for insertion
    const { username, password, ...otherData } = userData;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Build insert query
    const fields = ["username", "password", ...Object.keys(otherData)];
    const placeholders = fields.map(() => "?").join(", ");
    const values = [username, hashedPassword, ...Object.values(otherData)];

    const query = `INSERT INTO users (${fields.join(
      ", "
    )}) VALUES (${placeholders})`;
    const conn = await db.getConnection();

    try {
      const [result] = await conn.query(query, values);
      const insertId = (result as any).insertId;

      // Get the newly created user
      const newUser = await this.getUserById(insertId);

      if (!newUser) {
        throw new Error("Failed to create user");
      }

      // Generate token
      const payload = {
        user_id: newUser.user_id,
        username: newUser.username,
        user_type_id: newUser.user_type_id,
        department_id: newUser.department_id,
      };

      const token = jwt.sign(payload, SECRET_KEY, { expiresIn: TOKEN_EXPIRY });

      // Return user data without password
      const { password: _, ...userWithoutPassword } = newUser;

      return {
        token,
        user: userWithoutPassword,
      };
    } finally {
      conn.release();
    }
  }
}

export default new UserService();
