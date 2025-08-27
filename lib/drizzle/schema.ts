import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  supabaseUserId: text("supabase_user_id").primaryKey(),
  dodoCustomerId: text("dodo_customer_id").notNull(),
  currentSubscriptionId: text("current_subscription_id"),
  createdAt: timestamp("created_at", {
    mode: "string",
    withTimezone: true,
  }).notNull(),
  updatedAt: timestamp("updated_at", {
    mode: "string",
    withTimezone: true,
  }).notNull(),
  deletedAt: timestamp("deleted_at", {
    mode: "string",
    withTimezone: true,
  }),
});

export const subscriptions = pgTable("subscriptions", {
  subscriptionId: text("subscription_id").primaryKey().notNull(),
  userId: text("user_id").references(() => users.supabaseUserId),
  recurringPreTaxAmount: real("recurring_pre_tax_amount").notNull(),
  taxInclusive: boolean("tax_inclusive").notNull(),
  currency: text("currency").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", {
    mode: "string",
    withTimezone: true,
  }).notNull(),
  productId: text("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  trialPeriodDays: integer("trial_period_days"),
  subscriptionPeriodInterval: text("subscription_period_interval"),
  paymentPeriodInterval: text("payment_period_interval"),
  subscriptionPeriodCount: integer("subscription_period_count"),
  paymentFrequencyCount: integer("payment_frequency_count"),
  nextBillingDate: timestamp("next_billing_date", {
    mode: "string",
    withTimezone: true,
  }).notNull(),
  previousBillingDate: timestamp("previous_billing_date", {
    mode: "string",
    withTimezone: true,
  }).notNull(),
  customerId: text("customer_id").notNull(),
  customerName: text("customer_name"),
  customerEmail: text("customer_email").notNull(),
  metadata: jsonb("metadata"),
  discountId: text("discount_id"),
  cancelledAt: timestamp("cancelled_at", {
    mode: "string",
    withTimezone: true,
  }),
  cancelAtNextBillingDate: boolean("cancel_at_next_billing_date"),
  billing: jsonb("billing").notNull(),
  onDemand: boolean("on_demand"),
  addons: jsonb("addons"),
});

export const payments = pgTable("payments", {
  paymentId: text("payment_id").primaryKey(),
  status: text("status").notNull(),
  totalAmount: real("total_amount").notNull(),
  currency: text("currency").notNull(),
  paymentMethod: text("payment_method"),
  paymentMethodType: text("payment_method_type"),
  customerId: text("customer_id").notNull(),
  customerName: text("customer_name"),
  customerEmail: text("customer_email").notNull(),
  createdAt: timestamp("created_at", {
    mode: "string",
    withTimezone: true,
  }).notNull(),
  subscriptionId: text("subscription_id").notNull(),
  brandId: text("brand_id").notNull(),
  digitalProductDelivered: boolean("digital_product_delivered"),
  metadata: jsonb("metadata"),
  webhookData: jsonb("webhook_data").notNull(),
  billing: jsonb("billing").notNull(),
  businessId: text("business_id").notNull(),
  cardIssuingCountry: text("card_issuing_country"),
  cardLastFour: text("card_last_four"),
  cardNetwork: text("card_network"),
  cardType: text("card_type"),
  discountId: text("discount_id"),
  disputes: jsonb("disputes"),
  errorCode: text("error_code"),
  errorMessage: text("error_message"),
  paymentLink: text("payment_link"),
  productCart: jsonb("product_cart"),
  refunds: jsonb("refunds"),
  settlementAmount: real("settlement_amount"),
  settlementCurrency: text("settlement_currency"),
  settlementTax: real("settlement_tax"),
  tax: real("tax"),
  updatedAt: timestamp("updated_at", { mode: "string", withTimezone: true }),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  currentSubscription: one(subscriptions, {
    fields: [users.currentSubscriptionId],
    references: [subscriptions.subscriptionId],
  }),
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.supabaseUserId],
  }),
}));

export type SelectUser = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type SelectSubscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

export type SelectPayment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;
