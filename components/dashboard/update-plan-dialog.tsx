"use client";

import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Toggle } from "@/components/ui/toggle";
import { Label } from "@/components/ui/label";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { ProductListResponse } from "dodopayments/resources/index.mjs";
import { SelectSubscription } from "@/lib/drizzle/schema";
import { freePlan } from "@/lib/config/plans";
import TailwindBadge from "@/components/ui/tailwind-badge";
import { Loader, LoaderCircle, X } from "lucide-react";

export interface UpdatePlanDialogProps {
  currentPlan: SelectSubscription | null;
  triggerText: string;
  onPlanChange: (planId: string) => Promise<void> | void;
  className?: string;
  title?: string;
  products: ProductListResponse[];
}

export function UpdatePlanDialog({
  currentPlan,
  onPlanChange,
  className,
  title,
  triggerText,
  products,
}: UpdatePlanDialogProps) {
  const [isYearly, setIsYearly] = useState(
    currentPlan ? currentPlan.paymentPeriodInterval === "Year" : false
  );
  const [selectedPlan, setSelectedPlan] = useState<string | undefined>(
    currentPlan ? currentPlan.productId : undefined
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePlanChange = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleDialogClose = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="rounded-xl"
          disabled={!!currentPlan?.cancelAtNextBillingDate}
        >
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "space-y-3 max-h-[90vh] p-4  flex flex-col text-foreground gap-1",
          className
        )}
      >
        <DialogHeader className="flex flex-row items-center justify-between ">
          <DialogTitle className="text-base font-semibold">
            {title || "Upgrade Plan"}
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm">
            <Toggle
              size="sm"
              pressed={!isYearly}
              onPressedChange={(pressed) => setIsYearly(!pressed)}
              className="px-3"
            >
              Monthly
            </Toggle>
            <Toggle
              pressed={isYearly}
              onPressedChange={(pressed) => setIsYearly(pressed)}
              className="px-3"
            >
              Yearly
            </Toggle>
            <DialogClose asChild onClick={handleDialogClose}>
              <Button variant="ghost" className="rounded-md" size="icon">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 min-h-0 space-y-3">
          <RadioGroup value={selectedPlan} onValueChange={handlePlanChange}>
            <AnimatePresence mode="wait">
              <motion.div
                key={freePlan.name}
                onClick={() => handlePlanChange(freePlan.name)}
                className={`p-4  rounded-lg border transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer ${
                  selectedPlan === freePlan.name
                    ? "border-primary bg-gradient-to-br from-muted/60 to-muted/30 shadow-md"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3 min-w-0 flex-1">
                    <RadioGroupItem
                      value={freePlan.name}
                      id={freePlan.name}
                      className="flex-shrink-0 pointer-events-none  w-fit"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Label
                          htmlFor={freePlan.name}
                          className="font-medium cursor-pointer"
                        >
                          {freePlan.name}
                        </Label>

                        <TailwindBadge variant="blue" className="flex-shrink-0">
                          {freePlan.features.length} Features
                        </TailwindBadge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {freePlan.description}
                      </p>
                      {freePlan.features.length > 0 && (
                        <div className="pt-3">
                          <div className="flex flex-wrap gap-2">
                            {freePlan.features.map(
                              (feature: string, featureIndex: number) => (
                                <div
                                  key={featureIndex}
                                  className="flex items-center gap-2 px-2 py-1 rounded-lg bg-muted/20 border border-border/30 flex-shrink-0"
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {feature}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xl font-semibold">$0</div>
                    <div className="text-xs text-muted-foreground">
                      /{isYearly ? "year" : "month"}
                    </div>
                  </div>
                </div>
                <AnimatePresence>
                  {selectedPlan === freePlan.name && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      <Button
                        className="w-full mt-4"
                        disabled={true}
                        onClick={async () => {
                          await onPlanChange(freePlan.name);
                          setIsOpen(false);
                        }}
                      >
                        {currentPlan
                          ? "Cancel Subscription to Downgrade"
                          : "Current Plan"}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              {products &&
                products
                  .filter((plan) => {
                    if (isYearly) {
                      return (
                        // @ts-ignore
                        plan.price_detail?.payment_frequency_interval === "Year"
                      );
                    } else {
                      return (
                        // @ts-ignore
                        plan.price_detail?.payment_frequency_interval ===
                        "Month"
                      );
                    }
                  })
                  .sort(
                    (a, b) =>
                      Number(a.price_detail?.price) -
                      Number(b.price_detail?.price)
                  )
                  .map((plan) => (
                    <motion.div
                      key={plan.product_id}
                      onClick={() => handlePlanChange(plan.product_id)}
                      className={`p-4 rounded-lg border transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer ${
                        selectedPlan === plan.product_id
                          ? "border-primary bg-gradient-to-br from-muted/60 to-muted/30 shadow-md"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3 min-w-0 flex-1">
                          <RadioGroupItem
                            value={plan.product_id}
                            id={plan.product_id}
                            className="flex-shrink-0 pointer-events-none"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Label
                                htmlFor={plan.product_id}
                                className="font-medium cursor-pointer"
                              >
                                {plan.name}
                              </Label>
                              {plan.description && (
                                <TailwindBadge
                                  variant="blue"
                                  className="flex-shrink-0"
                                >
                                  {
                                    JSON.parse(plan.metadata?.features || "[]")
                                      .length
                                  }{" "}
                                  Features
                                </TailwindBadge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {plan.description}
                            </p>
                            {JSON.parse(plan.metadata?.features || "[]")
                              .length > 0 && (
                              <div className="pt-3">
                                <div className="flex flex-wrap gap-2">
                                  {JSON.parse(
                                    plan.metadata?.features || "[]"
                                  ).map(
                                    (feature: string, featureIndex: number) => (
                                      <div
                                        key={featureIndex}
                                        className="flex items-center gap-2 px-2 py-1 rounded-lg bg-muted/20 border border-border/30 flex-shrink-0"
                                      >
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                          {feature}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xl font-semibold">
                            ${Number(plan.price) / 100}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            /{isYearly ? "year" : "month"}
                          </div>
                        </div>
                      </div>
                      <AnimatePresence>
                        {selectedPlan === plan.product_id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, y: -10 }}
                            animate={{ opacity: 1, height: "auto", y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                          >
                            <Button
                              className="w-full mt-4"
                              disabled={
                                selectedPlan === currentPlan?.productId ||
                                isLoading
                              }
                              onClick={async () => {
                                setIsLoading(true);
                                await onPlanChange(plan.product_id);
                                setIsLoading(false);
                                setIsOpen(false);
                              }}
                            >
                              {isLoading && (
                                <LoaderCircle className="size-4 animate-spin text-muted-foreground dark:text-muted-foreground " />
                              )}
                              {selectedPlan === currentPlan?.productId
                                ? "Current Plan"
                                : currentPlan
                                ? "Subscribe"
                                : "Upgrade"}
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
            </AnimatePresence>
          </RadioGroup>
        </div>
      </DialogContent>
    </Dialog>
  );
}
