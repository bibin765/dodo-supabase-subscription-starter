import { pgTable, text } from "drizzle-orm/pg-core";

export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
});

export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
});
