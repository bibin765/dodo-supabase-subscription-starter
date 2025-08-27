"use client";
import { restoreSubscription } from "@/actions/restore-subscription";
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
import { Button } from "@/components/ui/button";
import { Loader2, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function RestoreSubscriptionDialog({
  subscriptionId,
}: {
  subscriptionId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRestoreSubscription = async () => {
    setIsLoading(true);
    const res = await restoreSubscription({ subscriptionId });
    if (res.success) {
      toast.success("Subscription restored successfully");
      window.location.reload();
    } else {
      toast.error(res.error);
    }
    setIsLoading(false);
    setIsOpen(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Restore Subscription</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want to restore your subscription?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will restore your subscription and you will be charged the next
            billing date.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            className="rounded-xl"
            onClick={handleRestoreSubscription}
            disabled={isLoading}
          >
            {isLoading && (
              <LoaderCircle className="size-4 animate-spin text-muted-foreground dark:text-muted-foreground " />
            )}
            Restore
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
