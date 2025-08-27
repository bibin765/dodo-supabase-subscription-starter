"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { motion } from "framer-motion";
import { CreditCard, ReceiptText, UserIcon } from "lucide-react";
import { ProductListResponse } from "dodopayments/resources/index.mjs";
import { User } from "@supabase/supabase-js";
import {
  SelectPayment,
  SelectSubscription,
  SelectUser,
} from "@/lib/drizzle/schema";
import { InvoiceHistory } from "./invoice-history";
import { toast } from "sonner";
import { changePlan } from "@/actions/change-plan";
import { SubscriptionManagement } from "./subscription-management";
import { cancelSubscription } from "@/actions/cancel-subscription";
import Image from "next/image";
import { Separator } from "../ui/separator";
import { AccountManagement } from "./account-management";
import Header from "../layout/header";

export function ComponentsSection(props: {
  products: ProductListResponse[];
  user: User;
  userSubscription: {
    subscription: SelectSubscription | null;
    user: SelectUser;
  };
  invoices: SelectPayment[];
}) {
  const [active, setActive] = useState("manage-subscription");

  const [borderPosition, setBorderPosition] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 2,
  });
  const tabsListRef = useRef<HTMLDivElement>(null);

  const components = [
    { id: "manage-subscription", label: "Billing", icon: CreditCard },
    { id: "payments", label: "Invoices", icon: ReceiptText },
    { id: "account", label: "Account", icon: UserIcon },
  ];

  useEffect(() => {
    if (!tabsListRef.current) return;

    const tabsList = tabsListRef.current;
    const activeTab = tabsList.querySelector(
      `[data-state="active"]`
    ) as HTMLElement;
    const isMobile = window.innerWidth < 640;

    if (activeTab) {
      const tabsListRect = tabsList.getBoundingClientRect();
      const activeTabRect = activeTab.getBoundingClientRect();

      if (isMobile) {
        setBorderPosition({
          left: 0,
          top: activeTabRect.top - tabsListRect.top,
          width: 2,
          height: activeTabRect.height,
        });
      } else {
        setBorderPosition({
          left: activeTabRect.left - tabsListRect.left,
          top: tabsListRect.height - 2, // Position at bottom of container
          width: activeTabRect.width,
          height: 2,
        });
      }
    }
  }, [active]);

  const handleTransition = (targetComponent?: string) => {
    const currentIndex = components.findIndex((comp) => comp.id === active);
    let nextComponent;

    if (targetComponent) {
      nextComponent = targetComponent;
    } else {
      const nextIndex = (currentIndex + 1) % components.length;
      nextComponent = components[nextIndex].id;
    }

    setActive(nextComponent);
  };

  const handleComponentClick = (componentId: string) => {
    if (componentId === active) return;
    handleTransition(componentId);
  };

  const handlePlanChange = async (productId: string) => {
    if (props.userSubscription.user.currentSubscriptionId) {
      const res = await changePlan({
        subscriptionId: props.userSubscription.user.currentSubscriptionId,
        productId,
      });

      if (!res.success) {
        toast.error(res.error);
        return;
      }

      toast.success("Plan updated successfully");
      window.location.reload();
      return;
    }

    const url = new URL(`${window.location.origin}/checkout`);

    url.searchParams.set("email", props.user.email ?? "");
    url.searchParams.set("disableEmail", "true");
    url.searchParams.set("productId", productId);
    if (props.user.user_metadata.full_name) {
      url.searchParams.set("fullName", props.user.user_metadata.full_name);
    }
    window.location.href = url.toString();
  };

  return (
    <div className="md:px-8 py-12 relative overflow-hidden w-full max-w-7xl mx-auto">
      <Header />
      <div
        id="components-showcase"
        className="flex flex-col gap-3 my-auto w-full mt-5"
      >
        <div className="relative flex flex-col sm:flex-row w-full overflow-x-auto scrollbar-hide justify-start sm:justify-center">
          <Tabs
            value={active}
            onValueChange={handleComponentClick}
            className="w-full"
          >
            <div className="flex flex-col sm:flex-row gap-2 md:mx-auto my-auto relative">
              <TabsList
                ref={tabsListRef}
                className="flex flex-col sm:flex-row gap-2 h-auto bg-background rounded-sm border relative p-0 w-full md:w-auto"
              >
                {components.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <TabsTrigger
                      key={item.id}
                      value={item.id}
                      className={cn(
                        "flex flex-row gap-1 h-auto transition-all duration-200 p-2 w-full",
                        "text-xs font-medium whitespace-nowrap border-0 rounded-none",
                        "hover:bg-muted/50 w-full sm:w-auto justify-start sm:justify-center"
                      )}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span className="hidden sm:inline text-[10px] leading-tight">
                        {item.label.split(" ")[0]}
                      </span>
                      <span className="sm:hidden text-[10px] leading-tight">
                        {item.label}
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              <motion.div
                className="absolute bg-white rounded-full"
                animate={{
                  left: borderPosition.left,
                  top: borderPosition.top,
                  width: borderPosition.width,
                  height: borderPosition.height,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
                style={{
                  position: "absolute",
                }}
              />
            </div>

            <div className="flex flex-col  bg-background rounded-lg shadow-lg w-full items-center justify-center mt-5">
              <div className="w-full h-full transition-all duration-300 ease-in-out">
                <TabsContent value="manage-subscription" className="mt-0">
                  <SubscriptionManagement
                    className="max-w-2xl mx-auto"
                    products={props.products}
                    currentPlan={props.userSubscription.subscription}
                    updatePlan={{
                      currentPlan: props.userSubscription.subscription,
                      onPlanChange: handlePlanChange,
                      triggerText: props.userSubscription.user
                        .currentSubscriptionId
                        ? "Change Plan"
                        : "Upgrade Plan",
                      products: props.products,
                    }}
                    cancelSubscription={{
                      products: props.products,
                      title: "Cancel Subscription",
                      description:
                        "Are you sure you want to cancel your subscription?",
                      leftPanelImageUrl:
                        "https://img.freepik.com/free-vector/abstract-paper-cut-shape-wave-background_474888-4649.jpg?semt=ais_hybrid&w=740&q=80",
                      plan: props.userSubscription.subscription,
                      warningTitle: "You will lose access to your account",
                      warningText:
                        "If you cancel your subscription, you will lose access to your account and all your data will be deleted.",
                      onCancel: async (planId) => {
                        if (props.userSubscription.subscription) {
                          await cancelSubscription({
                            subscriptionId:
                              props.userSubscription.subscription
                                .subscriptionId,
                          });
                        }
                        toast.success("Subscription cancelled successfully");
                        window.location.reload();
                        return;
                      },
                      onKeepSubscription: async (planId) => {
                        console.log("keep subscription", planId);
                      },
                    }}
                  />
                </TabsContent>

                <TabsContent value="payments" className="mt-0">
                  <InvoiceHistory invoices={props.invoices} />
                </TabsContent>

                <TabsContent value="account" className="mt-0">
                  <AccountManagement
                    className="max-w-2xl mx-auto"
                    user={props.user}
                    userSubscription={props.userSubscription}
                  />
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
