import { createRequire } from "node:module";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const require = createRequire(import.meta.url);
const provider = process.env.DATABASE_PROVIDER || "postgresql";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let users: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let tasks: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let taskLogs: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let memos: any;

if (provider === "sqlite") {
  const schema = require("./schema.sqlite");
  users = schema.users;
  tasks = schema.tasks;
  taskLogs = schema.taskLogs;
  memos = schema.memos;
} else {
  const schema = require("./schema.pg");
  users = schema.users;
  tasks = schema.tasks;
  taskLogs = schema.taskLogs;
  memos = schema.memos;
}

export { users, tasks, taskLogs, memos };
