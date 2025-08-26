"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { motion } from "framer-motion";
import { LucideCreditCard, Settings } from "lucide-react";
import { SubscriptionManagementTab } from "./subscription-management-tab";
import { ProductListResponse } from "dodopayments/resources/index.mjs";

export function ComponentsSection(props: { products: ProductListResponse[] }) {
  return (
    <div className="md:px-8 py-12 relative overflow-hidden w-full max-w-7xl mx-auto">
      <div className="text-center">
        <h2 className="text-3xl sm:text-3xl font-display md:text-4xl font-medium text-primary">
          Manage your subscription
        </h2>
        <p className="text-sm mt-4 text-muted-foreground max-w-2xl mx-auto tracking-tight">
          Manage your subscription and payments.
        </p>
      </div>
      <ComponentsShowcase products={props.products} />
    </div>
  );
}

function ComponentsShowcase(props: { products: ProductListResponse[] }) {
  const [active, setActive] = useState("manage-subscription");

  const [borderPosition, setBorderPosition] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 2,
  });
  const tabsListRef = useRef<HTMLDivElement>(null);

  const components = [
    { id: "manage-subscription", label: "Manage Subscription", icon: Settings },
    { id: "payments", label: "Payments", icon: LucideCreditCard },
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

  return (
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
                <SubscriptionManagementTab products={props.products} />
              </TabsContent>

              <TabsContent value="payments" className="mt-0"></TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
