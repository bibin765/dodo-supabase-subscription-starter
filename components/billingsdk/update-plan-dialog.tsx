"use client";

import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Toggle } from "@/components/ui/toggle";
import { Label } from "@/components/ui/label";
import { type Plan } from "@/lib/billingsdk-config";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { ProductListResponse } from "dodopayments/resources/index.mjs";

export interface UpdatePlanDialogProps {
  currentPlan: Plan;
  plans: Plan[];
  triggerText: string;
  onPlanChange: (planId: string) => void;
  className?: string;
  title?: string;
  products: ProductListResponse[];
}

export function UpdatePlanDialog({
  currentPlan,
  plans,
  onPlanChange,
  className,
  title,
  triggerText,
  products,
}: UpdatePlanDialogProps) {
  const [isYearly, setIsYearly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | undefined>(
    undefined
  );
  const [isOpen, setIsOpen] = useState(false);

  const handlePlanChange = (planId: string) => {
    setSelectedPlan(planId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>{triggerText || "Update Plan"}</Button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          "space-y-3 max-h-[90vh] flex flex-col text-foreground",
          className
        )}
      >
        <DialogHeader className="flex flex-row items-center justify-between py-2">
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
          </div>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 min-h-0 space-y-3">
          <RadioGroup value={selectedPlan} onValueChange={handlePlanChange}>
            <AnimatePresence mode="wait">
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
                                <Badge
                                  variant="secondary"
                                  className="flex-shrink-0"
                                >
                                  {plan.currency}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {plan.description}
                            </p>
                            {/* {plan.features.length > 0 && (
                          <div className="pt-3">
                            <div className="flex flex-wrap gap-2">
                              {plan.features.map((feature, featureIndex) => (
                                <div
                                  key={featureIndex}
                                  className="flex items-center gap-2 px-2 py-1 rounded-lg bg-muted/20 border border-border/30 flex-shrink-0"
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {feature.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )} */}
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
                              disabled={selectedPlan === currentPlan.id}
                              onClick={() => {
                                onPlanChange(plan.product_id);
                                setIsOpen(false);
                              }}
                            >
                              {selectedPlan === currentPlan.id
                                ? "Current Plan"
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
