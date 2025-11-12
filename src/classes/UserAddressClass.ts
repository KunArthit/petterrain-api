import { UserAddressModel } from "../models/UserAddressModel";
import db from "@/core/database";

class UserAddressService {
  // Get all user addresses
  async getAllAddresses(): Promise<UserAddressModel[]> {
    const query = `SELECT * FROM user_addresses;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query);
      return rows as UserAddressModel[];
    } catch (error) {
      console.error("Failed to fetch user addresses:", error);
      throw new Error("Failed to fetch user addresses");
    } finally {
      conn.release();
    }
  }

  // Get user address by ID
  async getAddressById(address_id: number): Promise<UserAddressModel | null> {
    const query = `SELECT * FROM user_addresses WHERE address_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [rows]: any = await conn.query(query, [address_id]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error("Failed to fetch user address:", error);
      throw new Error("Failed to fetch user address");
    } finally {
      conn.release();
    }
  }

  // Create a new user address
  async createAddress(
    address: Omit<UserAddressModel, "address_id">
  ): Promise<number> {
    const query = `
      INSERT INTO user_addresses (user_id, address_type, address_line1, address_line2, city, state, postal_code, country, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        address.user_id,
        address.address_type,
        address.address_line1,
        address.address_line2,
        address.city,
        address.state,
        address.postal_code,
        address.country,
        address.is_default,
      ]);
      return (result as any).insertId;
    } catch (error) {
      console.error("Failed to create user address:", error);
      throw new Error("Failed to create user address");
    } finally {
      conn.release();
    }
  }

  // Update user address
  async updateAddress(
    address_id: number,
    address: Partial<Omit<UserAddressModel, "address_id">>
  ): Promise<boolean> {
    const query = `
      UPDATE user_addresses
      SET user_id=?, address_type=?, address_line1=?, address_line2=?, city=?, state=?, postal_code=?, country=?, is_default=?
      WHERE address_id=?;
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        address.user_id,
        address.address_type,
        address.address_line1,
        address.address_line2,
        address.city,
        address.state,
        address.postal_code,
        address.country,
        address.is_default,
        address_id,
      ]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to update user address:", error);
      throw new Error("Failed to update user address");
    } finally {
      conn.release();
    }
  }

  // Delete user address
  // async deleteAddress(address_id: number): Promise<boolean> {
  //   const query = `DELETE FROM user_addresses WHERE address_id = ?;`;
  //   const conn = await db.getConnection();
  //   try {
  //     const [result] = await conn.query(query, [address_id]);
  //     return (result as any).affectedRows > 0;
  //   } catch (error) {
  //     console.error("Failed to delete user address:", error);
  //     throw new Error("Failed to delete user address");
  //   } finally {
  //     conn.release();
  //   }
  // }

  async deleteAddress(address_id: number): Promise<boolean> {
    const conn = await db.getConnection();
    try {
      await conn.query(`SET FOREIGN_KEY_CHECKS = 0;`);
      const [result] = await conn.query(
        `DELETE FROM user_addresses WHERE address_id = ?;`,
        [address_id]
      );
      await conn.query(`SET FOREIGN_KEY_CHECKS = 1;`);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Force delete failed:", error);
      throw new Error("Force delete failed");
    } finally {
      conn.release();
    }
  }

  // ✅ Get all addresses by user ID
  async getAddressesByUserId(user_id: number): Promise<UserAddressModel[]> {
    const query = `SELECT * FROM user_addresses WHERE user_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [user_id]);
      return rows as UserAddressModel[];
    } catch (error) {
      console.error("Failed to fetch addresses by user ID:", error);
      throw new Error("Failed to fetch addresses by user ID");
    } finally {
      conn.release();
    }
  }

  // ✅ Create a new address for specific user
  async createAddressForUser(
    user_id: number,
    address: Omit<UserAddressModel, "address_id" | "user_id">
  ): Promise<number> {
    const query = `
      INSERT INTO user_addresses 
      (user_id, address_type, address_line1, address_line2, city, state, postal_code, country, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        user_id,
        address.address_type,
        address.address_line1,
        address.address_line2,
        address.city,
        address.state,
        address.postal_code,
        address.country,
        address.is_default,
      ]);
      return (result as any).insertId;
    } catch (error) {
      console.error("Failed to create address for user:", error);
      throw new Error("Failed to create address for user");
    } finally {
      conn.release();
    }
  }
}

export default new UserAddressService();
