"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar, CreditCard } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  CancelSubscriptionDialog,
  type CancelSubscriptionDialogProps,
} from "@/components/dashboard/cancel-subscription-dialog";
import {
  UpdatePlanDialog,
  type UpdatePlanDialogProps,
} from "@/components/dashboard/update-plan-dialog";
import { ProductListResponse } from "dodopayments/resources/index.mjs";
import { SelectSubscription } from "@/lib/drizzle/schema";
import { freePlan } from "@/lib/config/plans";
import TailwindBadge from "../ui/tailwind-badge";
import { RestoreSubscriptionDialog } from "./restore-subscription-dialog";

interface SubscriptionManagementProps {
  className?: string;
  currentPlan: SelectSubscription | null;
  cancelSubscription: CancelSubscriptionDialogProps;
  updatePlan: UpdatePlanDialogProps;
  products: ProductListResponse[];
}

export function SubscriptionManagement({
  className,
  currentPlan,
  cancelSubscription,
  updatePlan,
  products,
}: SubscriptionManagementProps) {
  const currentPlanDetails = products.find(
    (product) => product.product_id === currentPlan?.productId
  );

  const features = currentPlanDetails
    ? JSON.parse(currentPlanDetails?.metadata.features || "[]")
    : freePlan.features;

  return (
    <div className={cn("text-left w-full", className)}>
      <Card className="shadow-lg">
        <CardHeader className=" px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2  text-lg sm:text-xl">
            <div className="p-1.5  rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            Billing
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Manage your current subscription and billing information
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 sm:space-y-8 px-4 sm:px-6">
          {/* Current Plan Details with highlighted styling */}
          <div className="relative p-3 sm:p-4 rounded-xl bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30 border border-border/50 overflow-hidden">
            <div className="relative">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <div className="w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-semibold">
                        {currentPlanDetails?.name || freePlan.name}
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {currentPlan && (
                        <TailwindBadge
                          variant={
                            currentPlan.status === "active" ? "green" : "red"
                          }
                        >
                          {currentPlan.status}
                        </TailwindBadge>
                      )}
                      {currentPlan && currentPlan.cancelAtNextBillingDate && (
                        <TailwindBadge variant={"red"}>
                          Scheduled for cancellation
                        </TailwindBadge>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <p className="text-xs sm:text-sm text-muted-foreground relative z-10">
                      {currentPlanDetails?.description || freePlan.description}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <UpdatePlanDialog
                      className="mx-0 shadow-lg hover:shadow-xl transition-all duration-200"
                      {...updatePlan}
                    />

                    {currentPlan && !currentPlan.cancelAtNextBillingDate && (
                      <CancelSubscriptionDialog
                        className="mx-0 shadow-lg hover:shadow-xl transition-all duration-200"
                        {...cancelSubscription}
                      />
                    )}

                    {currentPlan && currentPlan.cancelAtNextBillingDate && (
                      <RestoreSubscriptionDialog
                        subscriptionId={currentPlan.subscriptionId}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {currentPlan && (
            <Separator className="my-4 sm:my-6 bg-gradient-to-r from-transparent via-border to-transparent" />
          )}

          {currentPlan && (
            <div className="space-y-3 sm:space-y-4">
              <h4 className="font-medium flex items-center gap-2 text-base sm:text-lg">
                <div className="p-1 sm:p-1.5 rounded-md bg-muted ring-1 ring-border/50">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
                Billing Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="group p-2.5 sm:p-3 rounded-lg md:bg-gradient-to-tr bg-gradient-to-b from-muted to-background/10 border border-border/30 hover:border-border/60 transition-all duration-200">
                  <span className="text-xs sm:text-sm text-muted-foreground block mb-1">
                    Price
                  </span>
                  <div className="font-medium text-sm sm:text-base group-hover:text-primary transition-colors duration-200">
                    {currentPlan.paymentPeriodInterval === "Month"
                      ? `$${Number(currentPlanDetails?.price) / 100} / month`
                      : currentPlan.paymentPeriodInterval === "Year"
                      ? `$${Number(currentPlanDetails?.price) / 100} / year`
                      : `$${Number(currentPlanDetails?.price) / 100}`}
                  </div>
                </div>
                <div className="group p-2.5 sm:p-3 rounded-lg md:bg-gradient-to-tl bg-gradient-to-b from-muted to-background/10 border border-border/30 hover:border-border/60 transition-all duration-200">
                  <span className="text-xs sm:text-sm text-muted-foreground block mb-1">
                    {currentPlan.cancelAtNextBillingDate
                      ? "Cancels on"
                      : "Next billing date"}
                  </span>
                  <div className="font-medium text-sm sm:text-base group-hover:text-primary transition-colors duration-200">
                    {new Date(currentPlan.nextBillingDate).toLocaleDateString(
                      "en-US",
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <Separator className="my-4 sm:my-6 bg-gradient-to-r from-transparent via-border to-transparent" />

          <div className="">
            <h4 className="font-medium mb-3 sm:mb-4 text-base sm:text-lg">
              Current Plan Features
            </h4>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {features.map((feature: string, index: number) => (
                <div
                  key={index}
                  className="group flex items-center gap-2 p-2 sm:p-2 rounded-lg border border-border/80 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                >
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary flex-shrink-0 group-hover:bg-primary group-hover:scale-125 transition-all duration-200"></div>
                  <span className="text-xs sm:text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
