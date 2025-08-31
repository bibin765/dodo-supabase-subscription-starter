"use server";

import { db } from "@/lib/drizzle/client";
import { getUser } from "./get-user";
import { adminAuthClient } from "@/lib/supabase/admin";
import { ServerActionRes } from "@/types/server-action";
import { users } from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";

export async function deleteAccount(): ServerActionRes {
  try {
    const userRes = await getUser();
    if (!userRes.success) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const { error } = await adminAuthClient.deleteUser(userRes.data.id);
    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    await db
      .update(users)
      .set({
        deletedAt: new Date().toISOString(),
      })
      .where(eq(users.supabaseUserId, userRes.data.id));

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}
