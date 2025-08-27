"use client";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  CheckCircle,
  CheckIcon,
  CircleCheck,
  CreditCard,
  Download,
  ReceiptText,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectPayment } from "@/lib/drizzle/schema";
import Image from "next/image";
import TailwindBadge from "../ui/tailwind-badge";

interface InvoiceHistoryProps {
  className?: string;
  title?: string;
  description?: string;
  invoices: SelectPayment[];
  onDownload?: (invoiceId: string) => void;
}

export function InvoiceHistory({
  className,
  title = "Invoice History",
  description = "Your past invoices and payment receipts.",
  invoices,
  onDownload,
}: InvoiceHistoryProps) {
  if (!invoices) return null;

  function getStatusBadge(status: string) {
    const isSuccess = status === "succeeded";
    return (
      <TailwindBadge variant={isSuccess ? "green" : "red"}>
        {isSuccess ? "Paid" : "Failed"}
      </TailwindBadge>
    );
  }

  function getPaymentMethodLogo(network: string | null) {
    if (!network)
      return (
        <div className="flex h-6 w-10 items-center justify-center rounded bg-gray-200">
          <CreditCard className="h-4 w-4 text-gray-600" />
        </div>
      );

    switch (network.toUpperCase()) {
      case "VISA":
        return (
          <Image src="/assets/visa.svg" alt="Visa" width={32} height={32} />
        );
      case "MASTERCARD":
      case "MASTER":
        return (
          <Image src="/assets/mc.jpg" alt="Mastercard" width={32} height={32} />
        );
      case "AMEX":
      case "AMERICAN_EXPRESS":
        return (
          <Image src="/assets/amex.png" alt="Amex" width={32} height={32} />
        );
      default:
        return (
          <div className="flex h-6 w-10 items-center justify-center rounded bg-gray-200">
            <CreditCard className="h-4 w-4 text-gray-600" />
          </div>
        );
    }
  }

  return (
    <Card className={cn("w-full max-w-2xl mx-auto", className)}>
      {(title || description) && (
        <CardHeader className=" px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2  text-lg sm:text-xl">
            <div className="p-1.5  rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <ReceiptText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            Invoice History
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Your past invoices and payment receipts.
          </CardDescription>
        </CardHeader>
      )}
      <CardContent>
        <Table>
          <TableCaption className="sr-only">
            List of past invoices with dates, amounts, status and download
            actions
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Status</TableHead>
              <TableHead className="text-right">Payment Method</TableHead>
              <TableHead className="text-right">Invoice</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  No invoices yet
                </TableCell>
              </TableRow>
            )}
            {invoices.map((inv) => (
              <TableRow key={inv.paymentId} className="group">
                <TableCell className="text-muted-foreground">
                  <div className="inline-flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {new Date(inv.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                      hour12: true,
                    })}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {inv.currency === "USD"
                    ? "$"
                    : inv.currency === "INR"
                    ? "₹"
                    : `${inv.currency} `}
                  {Number(inv.totalAmount) / 100}
                </TableCell>
                <TableCell className="text-right">
                  {getStatusBadge(inv.status)}
                </TableCell>
                <TableCell className="text-right">
                  {inv.cardNetwork && inv.cardLastFour ? (
                    <span className="font-medium flex items-center justify-end gap-2">
                      {getPaymentMethodLogo(inv.cardNetwork)} {inv.cardLastFour}
                    </span>
                  ) : (
                    <span className="font-medium">
                      {inv.paymentMethod || "N/A"}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => {
                      const url =
                        process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode"
                          ? "https://live.dodopayments.com"
                          : "https://test.dodopayments.com";
                      window.open(
                        `${url}/invoices/payments/${inv.paymentId}`,
                        "_blank"
                      );
                    }}
                    aria-label={`Download invoice ${inv.paymentId}`}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
