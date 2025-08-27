import { db } from "../drizzle/client";
import { payments, subscriptions, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

import { InsertPayment, InsertSubscription } from "../drizzle/schema";

export async function managePayment(event: any) {
  const data: InsertPayment = {
    paymentId: event.data.payment_id,
    brandId: event.data.brand_id,
    createdAt: event.data.created_at,
    currency: event.data.currency,
    metadata: event.data.metadata,
    paymentMethod: event.data.payment_method,
    paymentMethodType: event.data.payment_method_type,
    status: event.data.status,
    subscriptionId: event.data.subscription_id,
    totalAmount: event.data.total_amount,
    customerEmail: event.data.customer.email,
    customerName: event.data.customer.name,
    customerId: event.data.customer.customer_id,
    webhookData: event,
    billing: event.data.billing,
    businessId: event.data.business_id,
    cardIssuingCountry: event.data.card_issuing_country,
    cardLastFour: event.data.card_last_four,
    cardNetwork: event.data.card_network,
    cardType: event.data.card_type,
    discountId: event.data.discount_id,
    disputes: event.data.disputes,
    errorCode: event.data.error_code,
    errorMessage: event.data.error_message,
    paymentLink: event.data.payment_link,
    productCart: event.data.product_cart,
    refunds: event.data.refunds,
    settlementAmount: event.data.settlement_amount,
    settlementCurrency: event.data.settlement_currency,
    settlementTax: event.data.settlement_tax,
    tax: event.data.tax,
    updatedAt: event.data.updated_at,
  };

  await db.insert(payments).values(data).onConflictDoUpdate({
    target: payments.paymentId,
    set: data,
  });
}

export async function manageSubscription(event: any) {
  const data: InsertSubscription = {
    subscriptionId: event.data.subscription_id,
    addons: event.data.addons,
    billing: event.data.billing,
    cancelAtNextBillingDate: event.data.cancel_at_next_billing_date,
    cancelledAt: event.data.cancelled_at,
    createdAt: event.data.created_at,
    currency: event.data.currency,
    customerEmail: event.data.customer.email,
    customerName: event.data.customer.name,
    customerId: event.data.customer.customer_id,
    discountId: event.data.discount_id,
    metadata: event.data.metadata,
    nextBillingDate: event.data.next_billing_date,
    onDemand: event.data.on_demand,
    paymentFrequencyCount: event.data.payment_frequency_count,
    paymentPeriodInterval: event.data.payment_frequency_interval,
    previousBillingDate: event.data.previous_billing_date,
    productId: event.data.product_id,
    quantity: event.data.quantity,
    recurringPreTaxAmount: event.data.recurring_pre_tax_amount,
    status: event.data.status,
    subscriptionPeriodCount: event.data.subscription_period_count,
    subscriptionPeriodInterval: event.data.subscription_period_interval,
    taxInclusive: event.data.tax_inclusive,
    trialPeriodDays: event.data.trial_period_days,
  };

  await db.insert(subscriptions).values(data).onConflictDoUpdate({
    target: subscriptions.subscriptionId,
    set: data,
  });
}

export async function updateUserTier(props: {
  dodoCustomerId: string;
  subscriptionId: string;
}) {
  await db
    .update(users)
    .set({
      currentSubscriptionId: props.subscriptionId,
    })
    .where(eq(users.dodoCustomerId, props.dodoCustomerId));
}

export async function downgradeToHobbyPlan(props: { dodoCustomerId: string }) {
  await db
    .update(users)
    .set({
      currentSubscriptionId: null,
    })
    .where(eq(users.dodoCustomerId, props.dodoCustomerId));
}
