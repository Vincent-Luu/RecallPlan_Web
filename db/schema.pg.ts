import { pgTable, serial, text, timestamp, date, boolean, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  status: text("status").default("approved").notNull(),
  role: text("role").default("user").notNull(),
  gaokaoEnabled: boolean("gaokao_enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  tag: text("tag"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const taskLogs = pgTable("task_logs", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id).notNull(),
  scheduleDate: date("schedule_date").notNull(),
  status: boolean("status").default(false).notNull(), // false = pending, true = completed
  type: text("type").default("regular").notNull(), // 'regular' | 'twenty_min'
});

export const memos = pgTable("memos", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
