import {
  downgradeToHobbyPlan,
  managePayment,
  manageSubscription,
  updateUserTier,
} from "@/lib/dodo-payments/webhook";
import { headers } from "next/headers";
import { Webhook } from "standardwebhooks";

export async function POST(req: Request) {
  const headersList = await headers();
  const webhook = new Webhook(process.env.DODO_WEBHOOK_SECRET!);
  const rawBody = await req.text();
  const event = JSON.parse(rawBody);

  const webhookHeaders = {
    "webhook-id": headersList.get("webhook-id") || "",
    "webhook-signature": headersList.get("webhook-signature") || "",
    "webhook-timestamp": headersList.get("webhook-timestamp") || "",
  };

  console.info(`recieved ${event.type} event`, event);

  try {
    await webhook.verify(rawBody, webhookHeaders);
  } catch (error) {
    console.error("Webhook verification failed:", error);
    return new Response("Invalid webhook", { status: 400 });
  }

  try {
    switch (event.type) {
      // payment events
      case "payment.succeeded":
      case "payment.failed":
      case "payment.processing":
      case "payment.cancelled":
        await managePayment(event);
        break;

      // subscription events
      case "subscription.active":
        await manageSubscription(event);
        await updateUserTier({
          dodoCustomerId: event.data.customer.customer_id,
          subscriptionId: event.data.subscription_id,
        });
        break;

      case "subscription.plan_changed":
        await manageSubscription(event);
        await updateUserTier({
          dodoCustomerId: event.data.customer.customer_id,
          subscriptionId: event.data.subscription_id,
        });

        break;

      case "subscription.renewed":
        await manageSubscription(event);
        break;

      case "subscription.cancelled":
      case "subscription.expired":
      case "subscription.failed":
        await manageSubscription(event);
        await downgradeToHobbyPlan({
          dodoCustomerId: event.data.customer.customer_id,
        });
        break;

      case "subscription.on_hold":
        await manageSubscription(event);
        break;

      default:
        return new Response("Invalid event type", { status: 400 });
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response("Error processing webhook", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
