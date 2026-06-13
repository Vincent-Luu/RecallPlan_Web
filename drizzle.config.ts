import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { defineConfig } from "drizzle-kit";

const provider = process.env.DATABASE_PROVIDER || "postgresql";

const dbConfig = provider === "sqlite"
  ? defineConfig({
      out: "./drizzle/sqlite",
      schema: "./db/schema.sqlite.ts",
      dialect: "sqlite",
      dbCredentials: {
        url: process.env.DATABASE_FILE || "./data/recallplan_web.db",
      },
    })
  : (() => {
      if (!process.env.DATABASE_URL) {
        throw new Error(
          "DATABASE_URL is not defined in the environment variables"
        );
      }
      return defineConfig({
        out: "./drizzle",
        schema: "./db/schema.pg.ts",
        dialect: "postgresql",
        dbCredentials: {
          url: process.env.DATABASE_URL,
        },
      });
    })();

export default dbConfig;
