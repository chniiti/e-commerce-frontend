"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import {
  Banknote,
  CreditCard,
  Smartphone,
  Wallet,
} from "lucide-react";
import { z } from "zod";

import { createOrder } from "@/lib/api/orders";
import type { ApiResponse, PaymentMethod } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const paymentMethods = [
  { value: "CARD", label: "Card", icon: CreditCard },
  { value: "APPLE_PAY", label: "Apple Pay", icon: Smartphone },
  { value: "GOOGLE_PAY", label: "Google Pay", icon: Wallet },
  { value: "COD", label: "Cash on Delivery", icon: Banknote },
] as const satisfies ReadonlyArray<{
  value: PaymentMethod;
  label: string;
  icon: typeof CreditCard;
}>;

const buyNowSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{8,15}$/, "Invalid phone number format"),
  email: z
    .string()
    .trim()
    .max(255)
    .optional()
    .refine(
      (value) => !value || z.email().safeParse(value).success,
      "Enter a valid email address",
    ),
  deliveryLocation: z
    .string()
    .trim()
    .min(1, "Delivery location is required")
    .max(500),
  paymentMethod: z.enum(["CARD", "APPLE_PAY", "GOOGLE_PAY", "COD"]),
});

type BuyNowFormValues = z.infer<typeof buyNowSchema>;

interface BuyNowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: number;
  variantId?: number;
  productName: string;
}

function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const payload = error.response?.data as ApiResponse<unknown> | undefined;
    if (payload?.message) {
      return payload.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unable to complete your reservation. Please try again.";
}

function isOnlinePayment(method: PaymentMethod) {
  return (
    method === "CARD" || method === "APPLE_PAY" || method === "GOOGLE_PAY"
  );
}

export function BuyNowDialog({
  open,
  onOpenChange,
  productId,
  variantId,
  productName,
}: BuyNowDialogProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<BuyNowFormValues>({
    resolver: zodResolver(buyNowSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      deliveryLocation: "",
      paymentMethod: "CARD",
    },
  });

  const selectedPaymentMethod = useWatch({
    control,
    name: "paymentMethod",
  });

  const handleDialogChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setFormError(null);
      reset();
    }

    onOpenChange(nextOpen);
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      const response = await createOrder({
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        email: values.email || undefined,
        deliveryLocation: values.deliveryLocation,
        productId,
        variantId,
        paymentMethod: values.paymentMethod,
      });

      if (isOnlinePayment(values.paymentMethod)) {
        if (!response.checkoutUrl) {
          throw new Error("Checkout URL was not returned by the server.");
        }

        window.location.assign(response.checkoutUrl);
        return;
      }

      router.push(`/track/${response.orderTrackingId}`);
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  });

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="glass-panel-strong max-h-[90vh] overflow-y-auto border-[var(--border-token)] bg-[var(--surface)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-[var(--text)]">
            Reserve {productName}
          </DialogTitle>
          <DialogDescription className="text-[var(--text-muted)]">
            Complete your details to secure this drop before it sells out.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="firstName" className="text-sm font-medium">
                First name
              </label>
              <Input
                id="firstName"
                autoComplete="given-name"
                className="border-[var(--border-token)] bg-[var(--surface-2)]"
                aria-invalid={Boolean(errors.firstName)}
                {...register("firstName")}
              />
              {errors.firstName ? (
                <p className="text-sm text-destructive">
                  {errors.firstName.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="lastName" className="text-sm font-medium">
                Last name
              </label>
              <Input
                id="lastName"
                autoComplete="family-name"
                className="border-[var(--border-token)] bg-[var(--surface-2)]"
                aria-invalid={Boolean(errors.lastName)}
                {...register("lastName")}
              />
              {errors.lastName ? (
                <p className="text-sm text-destructive">
                  {errors.lastName.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium">
              Phone
            </label>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+97450123456"
              className="border-[var(--border-token)] bg-[var(--surface-2)]"
              aria-invalid={Boolean(errors.phone)}
              {...register("phone")}
            />
            {errors.phone ? (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email (optional)
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              className="border-[var(--border-token)] bg-[var(--surface-2)]"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
            {errors.email ? (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="deliveryLocation"
              className="text-sm font-medium"
            >
              Delivery location
            </label>
            <Input
              id="deliveryLocation"
              autoComplete="street-address"
              className="border-[var(--border-token)] bg-[var(--surface-2)]"
              aria-invalid={Boolean(errors.deliveryLocation)}
              {...register("deliveryLocation")}
            />
            {errors.deliveryLocation ? (
              <p className="text-sm text-destructive">
                {errors.deliveryLocation.message}
              </p>
            ) : null}
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Payment method</legend>
            <div className="grid gap-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                const isSelected = selectedPaymentMethod === method.value;

                return (
                  <label
                    key={method.value}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors duration-150",
                      isSelected
                        ? "border-[var(--cyan)] bg-[color-mix(in_srgb,var(--cyan)_12%,transparent)]"
                        : "border-[var(--border-token)] bg-[var(--surface-2)] hover:border-[var(--text-muted)]",
                    )}
                  >
                    <input
                      type="radio"
                      value={method.value}
                      className="sr-only"
                      {...register("paymentMethod")}
                    />
                    <Icon
                      className={cn(
                        "size-4 shrink-0",
                        isSelected ? "text-[var(--cyan)]" : "text-[var(--text-muted)]",
                      )}
                    />
                    <span className="text-sm">{method.label}</span>
                  </label>
                );
              })}
            </div>
            {errors.paymentMethod ? (
              <p className="text-sm text-destructive">
                {errors.paymentMethod.message}
              </p>
            ) : null}
          </fieldset>

          {formError ? (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}

          <DialogFooter className="border-t-0 bg-transparent px-0 pb-0">
            <Button
              type="submit"
              className="h-11 w-full bg-molten font-semibold text-void hover:bg-molten/90 molten-glow"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Processing…"
                : selectedPaymentMethod === "COD"
                  ? "Confirm reservation"
                  : "Continue to payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
