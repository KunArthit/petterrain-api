import { Elysia, t } from "elysia";
import fs from "fs/promises";
import path from "path";
import db from "@/core/database";

const UPLOAD_PATH = path.join(process.cwd(), "uploads");

export const userRoutes = new Elysia()
  .post(
    "/register2",
    async ({ body, set }: { body: any; set: any }) => {
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();

        // Insert users
        const [userRows] = await conn.execute(
          `INSERT INTO users2
          (user_type, prefix, first_name, last_name, gender, age_range, email, username, password_hash, photo)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            body.user.user_type,
            body.user.prefix,
            body.user.first_name,
            body.user.last_name,
            body.user.gender,
            body.user.age_range,
            body.user.email,
            body.user.username,
            body.user.password, // password_hash,
            body.user.photo ?? null,
          ]
        );
        const user_id = (userRows as any).insertId;

        // Insert user_contacts
        await conn.execute(
          `INSERT INTO user_contacts
          (user_id, address, province, district, sub_district, postal_code, phone, orcid_id, google_scholar_id, facebook, linkedin, twitter, line)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            user_id,
            body.contact.address ?? null,
            body.contact.province ?? null,
            body.contact.district ?? null,
            body.contact.sub_district ?? null,
            body.contact.postal_code ?? null,
            body.contact.phone ?? null,
            body.contact.orcid_id ?? null,
            body.contact.google_scholar_id ?? null,
            body.contact.facebook ?? null,
            body.contact.linkedin ?? null,
            body.contact.twitter ?? null,
            body.contact.line ?? null,
          ]
        );

        // Insert user_work_experience
        await conn.execute(
          `INSERT INTO user_work_experience
          (user_id, organization_name, position, level, position_type, years_of_experience, years_it_security)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            user_id,
            body.work_experience.organization_name ?? null,
            body.work_experience.position ?? null,
            body.work_experience.level ?? null,
            body.work_experience.position_type ?? null,
            body.work_experience.years_of_experience ?? 0,
            body.work_experience.years_it_security ?? 0,
          ]
        );

        // Insert user_workplace
        await conn.execute(
          `INSERT INTO user_workplace
          (user_id, address, province, district, sub_district, postal_code, phone)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            user_id,
            body.workplace.address ?? null,
            body.workplace.province ?? null,
            body.workplace.district ?? null,
            body.workplace.sub_district ?? null,
            body.workplace.postal_code ?? null,
            body.workplace.phone ?? null,
          ]
        );

        // Insert user_education
        await conn.execute(
          `INSERT INTO user_education
          (user_id, highest_education, institution_name, major, graduation_year)
          VALUES (?, ?, ?, ?, ?)`,
          [
            user_id,
            body.education.highest_education ?? null,
            body.education.institution_name ?? null,
            body.education.major ?? null,
            body.education.graduation_year ?? null,
          ]
        );

        // Insert user_skills
        await conn.execute(
          `INSERT INTO user_skills
          (user_id, it_security_skills, languages)
          VALUES (?, ?, ?)`,
          [
            user_id,
            body.skills.it_security_skills ?? null,
            body.skills.languages ?? null,
          ]
        );

        // Insert user_certificates (array)
        if (body.certificates && Array.isArray(body.certificates)) {
          for (const cert of body.certificates) {
            await conn.execute(
              `INSERT INTO user_certificates
              (user_id, certificate_name, issued_by, start_date, end_date, certificate_file)
              VALUES (?, ?, ?, ?, ?, ?)`,
              [
                user_id,
                cert.certificate_name ?? null,
                cert.issued_by ?? null,
                cert.start_date ?? null,
                cert.end_date ?? null,
                cert.certificate_file ?? null,
              ]
            );
          }
        }

        await conn.commit();
        set.status = 201;
        return { message: "Registered", userId: user_id };
      } catch (err) {
        await conn.rollback();
        set.status = 500;
        return { error: "Database error", details: (err as Error).message };
      } finally {
        conn.release();
      }
    },
    {
      body: t.Object({
        user: t.Object({
          user_type: t.String(),
          prefix: t.String(),
          first_name: t.String(),
          last_name: t.String(),
          gender: t.String(),
          age_range: t.String(),
          email: t.String(),
          username: t.String(),
          password: t.String({ minLength: 6 }),
          photo: t.Optional(t.String()),
        }),
        contact: t.Object({
          address: t.Optional(t.String()),
          province: t.Optional(t.String()),
          district: t.Optional(t.String()),
          sub_district: t.Optional(t.String()),
          postal_code: t.Optional(t.String()),
          phone: t.Optional(t.String({ minLength: 9, maxLength: 15 })),
          orcid_id: t.Optional(t.String()),
          google_scholar_id: t.Optional(t.String()),
          facebook: t.Optional(t.String()),
          linkedin: t.Optional(t.String()),
          twitter: t.Optional(t.String()),
          line: t.Optional(t.String()),
        }),
        work_experience: t.Object({
          organization_name: t.Optional(t.String()),
          position: t.Optional(t.String()),
          level: t.Optional(t.String()),
          position_type: t.Optional(t.String()),
          years_of_experience: t.Optional(t.Number()),
          years_it_security: t.Optional(t.Number()),
        }),
        workplace: t.Object({
          address: t.Optional(t.String()),
          province: t.Optional(t.String()),
          district: t.Optional(t.String()),
          sub_district: t.Optional(t.String()),
          postal_code: t.Optional(t.String()),
          phone: t.Optional(t.String()),
        }),
        education: t.Object({
          highest_education: t.Optional(t.String()),
          institution_name: t.Optional(t.String()),
          major: t.Optional(t.String()),
          graduation_year: t.Optional(t.Number()),
        }),
        skills: t.Object({
          it_security_skills: t.Optional(t.String()),
          languages: t.Optional(t.String()),
        }),
        certificates: t.Optional(
          t.Array(
            t.Object({
              certificate_name: t.String(),
              issued_by: t.String(),
              start_date: t.String(),
              end_date: t.String(),
              certificate_file: t.String(),
            })
          )
        ),
      }),
      response: {
        201: t.Object({ message: t.String(), userId: t.Number() }),
        400: t.Object({ error: t.Any() }),
        500: t.Object({ error: t.String(), details: t.String() }),
      },
      detail: {
        summary: "Register a new user with all related data",
        tags: ["User"],
      },
    }
  )
  // get all users
  .get(
    "/users2",
    async ({ set }: { set: any }) => {
      const conn = await db.getConnection();
      try {
        const [rows] = (await conn.execute(
          `SELECT u.user_id, u.first_name, u.last_name, u.email, c.phone, c.province
           FROM users2 u
           LEFT JOIN user_contacts c ON u.user_id = c.user_id`
        )) as any[];
        return rows as Array<{
          user_id: number;
          first_name: string;
          last_name: string;
          email: string;
          phone: string | null;
          province: string | null;
        }>;
      } catch (err) {
        set.status = 500;
        return { error: "Database error", details: (err as Error).message };
      } finally {
        conn.release();
      }
    },
    {
      response: {
        200: t.Array(
          t.Object({
            user_id: t.Number(),
            first_name: t.String(),
            last_name: t.String(),
            email: t.String(),
            phone: t.Nullable(t.String()),
            province: t.Nullable(t.String()),
          })
        ),
        500: t.Object({ error: t.String(), details: t.String() }),
      },
      detail: {
        summary: "Get all registered users",
        tags: ["User"],
      },
    }
  )
  .get(
    "/users2/:id",
    async ({ params, set }: { params: { id: string }; set: any }) => {
      const userId = Number(params.id);
      if (isNaN(userId)) {
        set.status = 400;
        return { error: "Invalid user id" };
      }

      const conn = await db.getConnection();
      try {
        // 1. user + contact
        const [rows] = await conn.execute(
          `SELECT u.*, c.address AS contact_address, c.province AS contact_province, c.district, c.sub_district, c.postal_code AS contact_postal_code,
                  c.phone AS contact_phone, c.orcid_id, c.google_scholar_id, c.facebook, c.linkedin, c.twitter, c.line
           FROM users2 u
           LEFT JOIN user_contacts c ON u.user_id = c.user_id
           WHERE u.user_id = ?`,
          [userId]
        );
        const user = (rows as any[])[0];
        if (!user) {
          set.status = 404;
          return { error: "User not found" };
        }

        // 2. work_experience
        const [work_experience] = (await conn.execute(
          `SELECT organization_name, position, level, position_type, years_of_experience, years_it_security
           FROM user_work_experience WHERE user_id = ?`,
          [userId]
        )) as unknown as [
          Array<{
            organization_name: string | null;
            position: string | null;
            level: string | null;
            position_type: string | null;
            years_of_experience: number | null;
            years_it_security: number | null;
          }>
        ];

        // 3. workplace
        const [workplace] = (await conn.execute(
          `SELECT address, province, district, sub_district, postal_code, phone
           FROM user_workplace WHERE user_id = ?`,
          [userId]
        )) as unknown as [
          Array<{
            address: string | null;
            province: string | null;
            district: string | null;
            sub_district: string | null;
            postal_code: string | null;
            phone: string | null;
          }>
        ];

        // 4. education
        const [education] = await conn.execute(
          `SELECT highest_education, institution_name, major, graduation_year
           FROM user_education WHERE user_id = ?`,
          [userId]
        );

        // 5. skills
        const [skills] = await conn.execute(
          `SELECT it_security_skills, languages
           FROM user_skills WHERE user_id = ?`,
          [userId]
        );

        // 6. certificates
        const [certificates] = await conn.execute(
          `SELECT certificate_name, issued_by, start_date, end_date, certificate_file
           FROM user_certificates WHERE user_id = ?`,
          [userId]
        );

        // return all profile info
        return {
          user: {
            user_id: user.user_id,
            user_type: user.user_type,
            prefix: user.prefix,
            first_name: user.first_name,
            last_name: user.last_name,
            gender: user.gender,
            age_range: user.age_range,
            email: user.email,
            username: user.username,
            photo: user.photo,
          },
          contact: {
            address: user.contact_address,
            province: user.contact_province,
            district: user.district,
            sub_district: user.sub_district,
            postal_code: user.contact_postal_code,
            phone: user.contact_phone,
            orcid_id: user.orcid_id,
            google_scholar_id: user.google_scholar_id,
            facebook: user.facebook,
            linkedin: user.linkedin,
            twitter: user.twitter,
            line: user.line,
          },
          work_experience: work_experience[0] ?? null,
          workplace: workplace[0] ?? null,
          education:
            (
              education as Array<{
                highest_education: string | null;
                institution_name: string | null;
                major: string | null;
                graduation_year: number | null;
              }>
            )[0] ?? null,
          skills:
            (
              skills as Array<{
                it_security_skills: string | null;
                languages: string | null;
              }>
            )[0] ?? null,
          certificates: certificates,
        };
      } catch (err) {
        set.status = 500;
        return { error: "Database error", details: (err as Error).message };
      } finally {
        conn.release();
      }
    },
    {
      params: t.Object({ id: t.String() }),
      response: {
        200: t.Any(),
        400: t.Object({ error: t.String() }),
        404: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String(), details: t.String() }),
      },
      detail: {
        summary: "Get full user profile by id",
        tags: ["User"],
      },
    }
  )
  .post(
    "/users2/:id/upload-photo",
    async ({
      body,
      set,
      params,
    }: {
      body: any;
      set: any;
      params: { id: string };
    }) => {
      const userId = Number(params.id);
      if (isNaN(userId)) {
        set.status = 400;
        return { error: "Invalid user id" };
      }

      const file = body.file;
      if (!file || !file.name) {
        set.status = 422;
        return { error: "No file uploaded" };
      }

      const conn = await db.getConnection();
      try {
        // สร้างโฟลเดอร์อัปโหลดถ้ายังไม่มี
        await fs.mkdir(UPLOAD_PATH, { recursive: true });
        const ext = path.extname(file.name);
        const saveName = `user_${userId}_${Date.now()}${ext}`;
        const savePath = path.join(UPLOAD_PATH, saveName);

        const buffer = new Uint8Array(await file.arrayBuffer());
        await fs.writeFile(savePath, buffer);

        // update path image ใน db
        await conn.execute("UPDATE users2 SET photo = ? WHERE user_id = ?", [
          `/uploads/${saveName}`,
          userId,
        ]);

        return { message: "Uploaded", photo: `/uploads/${saveName}` };
      } catch (err) {
        set.status = 500;
        return { error: "Database error", details: (err as Error).message };
      } finally {
        conn.release();
      }
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        file: t.File({ type: "image" }), // validate เป็น image
      }),
      response: {
        200: t.Object({ message: t.String(), photo: t.String() }),
        400: t.Object({ error: t.String() }),
        422: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String(), details: t.String() }),
      },
    }
  )
  .post(
    "/users2/:id/upload-certificate",
    async ({
      params,
      body,
      set,
    }: {
      params: { id: string };
      body: any;
      set: any;
    }) => {
      const userId = Number(params.id);
      if (isNaN(userId)) {
        set.status = 400;
        return { error: "Invalid user id" };
      }

      const file = body.file;
      if (!file || !file.name) {
        set.status = 422;
        return { error: "No file uploaded" };
      }

      const conn = await db.getConnection();
      try {
        await fs.mkdir(UPLOAD_PATH, { recursive: true });
        const ext = path.extname(file.name);
        const saveName = `cert_user${userId}_${Date.now()}${ext}`;
        const savePath = path.join(UPLOAD_PATH, saveName);
        const buffer = new Uint8Array(await file.arrayBuffer());
        await fs.writeFile(savePath, buffer);

        // รับข้อมูลเสริมจาก multipart form (certificate_name, issued_by, ...)
        const { certificate_name, issued_by, start_date, end_date } = body;

        await conn.execute(
          `INSERT INTO user_certificates
            (user_id, certificate_name, issued_by, start_date, end_date, certificate_file)
          VALUES (?, ?, ?, ?, ?, ?)`,
          [
            userId,
            certificate_name ?? "",
            issued_by ?? "",
            start_date ?? null,
            end_date ?? null,
            `/uploads/${saveName}`,
          ]
        );

        return {
          message: "Uploaded",
          certificate_file: `/uploads/${saveName}`,
        };
      } catch (err) {
        set.status = 500;
        return { error: "Database error", details: (err as Error).message };
      } finally {
        conn.release();
      }
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        file: t.File(), // ไม่ระบุ type ก็ได้ (รองรับ pdf, image)
        certificate_name: t.String(),
        issued_by: t.String(),
        start_date: t.Optional(t.String()),
        end_date: t.Optional(t.String()),
      }),
      response: {
        200: t.Object({ message: t.String(), certificate_file: t.String() }),
        400: t.Object({ error: t.String() }),
        422: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String(), details: t.String() }),
      },
    }
  );
