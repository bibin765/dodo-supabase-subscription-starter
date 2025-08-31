import DodoPayments from "dodopayments";

export type DodoPaymentsEnvironment = "live_mode" | "test_mode";

export const dodoClient = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  environment: process.env
    .DODO_PAYMENTS_ENVIRONMENT! as DodoPaymentsEnvironment,
});
