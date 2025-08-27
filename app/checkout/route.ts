import { Checkout } from "@dodopayments/nextjs";
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  const { origin } = new URL(req.url);
  const handler = Checkout({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
    returnUrl: `${origin}/dashboard`,
    environment:
      (process.env.DODO_PAYMENTS_ENVIRONMENT as "test_mode" | "live_mode") ||
      "test_mode",
    type: "static",
  });

  return handler(req);
};

export const POST = async (req: NextRequest) => {
  const { origin } = new URL(req.url);
  const handler = Checkout({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
    returnUrl: `${origin}/dashboard`,
    environment:
      (process.env.DODO_PAYMENTS_ENVIRONMENT as "test_mode" | "live_mode") ||
      "test_mode",
    type: "dynamic",
  });

  return handler(req);
};
