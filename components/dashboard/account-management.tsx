"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LogOutIcon, Trash2Icon, UserIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteAccount } from "@/actions/delet-account";
import { SelectSubscription, SelectUser } from "@/lib/drizzle/schema";

interface AccountManagementProps {
  className?: string;
  user: User;
  userSubscription: {
    user: SelectUser;
    subscription: SelectSubscription | null;
  };
}

export function AccountManagement({
  className,
  user,
  userSubscription,
}: AccountManagementProps) {
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.reload();
  };

  const handleDeleteAccount = async () => {
    const res = await deleteAccount();
    if (res.success) {
      window.location.reload();
    }
  };

  return (
    <div className={cn("text-left w-full", className)}>
      <Card className="shadow-lg">
        <CardHeader className=" px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2  text-lg sm:text-xl">
            <div className="p-1.5  rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            Account Details
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Manage your account settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 sm:space-y-8 px-4 sm:px-6">
          <div className="relative p-3 sm:p-4 rounded-xl bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30 border border-border/50 overflow-hidden">
            <Avatar className="w-12 h-12">
              <AvatarImage
                src={
                  user.user_metadata.avatar_url || user.user_metadata.picture
                }
              />
              <AvatarFallback>
                {user.user_metadata.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col mt-2">
              <h3 className="text-lg sm:text-xl font-semibold">
                {user.user_metadata.name}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>

          <Separator className="my-4 sm:my-6 bg-gradient-to-r from-transparent via-border to-transparent" />

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleSignOut} variant={"destructive"}>
              <LogOutIcon className="h-4 w-4   sm:h-5 sm:w-5" />
              Logout
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="text-red-500 hover:text-red-500 focus:text-red-500"
                >
                  <Trash2Icon className="h-4 w-4" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    your account and remove your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <Button onClick={handleDeleteAccount} variant={"destructive"}>
                    <Trash2Icon className="h-4 w-4" />
                    Delete Account
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
