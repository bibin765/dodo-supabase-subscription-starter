"use server";

import { getUser } from "./get-user";
import { adminAuthClient } from "@/lib/supabase/admin";
import { ServerActionRes } from "@/types/server-action";

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
