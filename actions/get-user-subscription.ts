"use server";

import { db } from "@/lib/drizzle/client";
import {
  SelectSubscription,
  SelectUser,
  subscriptions,
  users,
} from "@/lib/drizzle/schema";
import { ServerActionRes } from "@/types/server-action";
import { getUser } from "./get-user";
import { eq } from "drizzle-orm";

type UserSubscription = {
  subscription: SelectSubscription | null;
  user: SelectUser;
};

export async function getUserSubscription(): ServerActionRes<UserSubscription> {
  const userRes = await getUser();

  if (!userRes.success) {
    return { success: false, error: "User not found" };
  }

  const user = userRes.data;

  const userDetails = await db.query.users.findFirst({
    where: eq(users.supabaseUserId, user.id),
  });

  if (!userDetails) {
    return { success: false, error: "User details not found" };
  }

  if (!userDetails.currentSubscriptionId) {
    return { success: true, data: { subscription: null, user: userDetails } };
  }

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.subscriptionId, userDetails.currentSubscriptionId),
  });

  return {
    success: true,
    data: { subscription: subscription ?? null, user: userDetails },
  };
}
