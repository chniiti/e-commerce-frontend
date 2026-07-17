"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import { ProductStatusBadge } from "@/components/dashboard/ProductStatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getManagedProduct, updateProduct } from "@/lib/api/products";
import { getApiErrorMessage, toIsoDateTime } from "@/lib/utils/apiErrors";
import { cn } from "@/lib/utils";

const editSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  description: z.string().trim().optional(),
  category: z.string().trim().min(1, "Category is required").max(100),
  sellPrice: z.number().positive("Sell price must be greater than 0"),
  stockQty: z.number().int().min(0, "Stock cannot be negative"),
  launchStart: z.string().optional(),
  launchEnd: z.string().optional(),
  heroMediaUrl: z
    .string()
    .trim()
    .max(1000)
    .refine(
      (value) => !value || z.url().safeParse(value).success,
      "Enter a valid media URL",
    ),
});

type EditFormValues = z.infer<typeof editSchema>;

function toDateTimeLocal(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export default function TrendsEditProductPage() {
  const params = useParams<{ id: string }>();
  const productId = Number(params.id);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["managed-product", productId],
    queryFn: () => getManagedProduct(productId),
    enabled: Number.isFinite(productId),
  });

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      sellPrice: 0,
      stockQty: 0,
      launchStart: "",
      launchEnd: "",
      heroMediaUrl: "",
    },
  });

  useEffect(() => {
    if (!query.data) {
      return;
    }

    form.reset({
      name: query.data.name,
      description: query.data.description ?? "",
      category: query.data.category,
      sellPrice: query.data.sellPrice,
      stockQty: query.data.stockQty,
      launchStart: toDateTimeLocal(query.data.launchStart),
      launchEnd: toDateTimeLocal(query.data.launchEnd),
      heroMediaUrl: query.data.landingPage?.heroMediaUrl ?? "",
    });
  }, [query.data, form]);

  const mutation = useMutation({
    mutationFn: (values: EditFormValues) => {
      const current = query.data;

      return updateProduct(productId, {
        name: values.name,
        description: values.description || undefined,
        category: values.category,
        sellPrice: values.sellPrice,
        stockQty: values.stockQty,
        launchStart: toIsoDateTime(values.launchStart),
        launchEnd: toIsoDateTime(values.launchEnd),
        landingPage: {
          heroMediaUrl: values.heroMediaUrl || null,
          sectionsJson: current?.landingPage?.sectionsJson ?? null,
          urgencyCounter: current?.landingPage?.urgencyCounter ?? null,
          countdownEnd: current?.landingPage?.countdownEnd ?? null,
        },
      });
    },
    onSuccess: async () => {
      toast.success("Product updated");
      await queryClient.invalidateQueries({
        queryKey: ["managed-product", productId],
      });
      await queryClient.invalidateQueries({ queryKey: ["managed-products"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to update product"));
    },
  });

  if (!Number.isFinite(productId)) {
    return <p className="text-sm text-destructive">Invalid product id.</p>;
  }

  if (query.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading product…</p>;
  }

  if (query.isError || !query.data) {
    return (
      <p className="text-sm text-destructive">
        {getApiErrorMessage(query.error, "Product not found.")}
      </p>
    );
  }

  const product = query.data;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Edit product
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{product.slug}</p>
        </div>
        <ProductStatusBadge status={product.status} />
      </div>

      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        noValidate
      >
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Name
          </label>
          <Input id="name" {...form.register("name")} />
          {form.formState.errors.name ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.name.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="category" className="text-sm font-medium">
            Category
          </label>
          <Input id="category" {...form.register("category")} />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            {...form.register("description")}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="sellPrice" className="text-sm font-medium">
              Sell price
            </label>
            <Input
              id="sellPrice"
              type="number"
              step="0.01"
              {...form.register("sellPrice", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="stockQty" className="text-sm font-medium">
              Stock
            </label>
            <Input
              id="stockQty"
              type="number"
              step={1}
              {...form.register("stockQty", { valueAsNumber: true })}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="launchStart" className="text-sm font-medium">
              Launch start
            </label>
            <Input
              id="launchStart"
              type="datetime-local"
              {...form.register("launchStart")}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="launchEnd" className="text-sm font-medium">
              Launch end
            </label>
            <Input
              id="launchEnd"
              type="datetime-local"
              {...form.register("launchEnd")}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="heroMediaUrl" className="text-sm font-medium">
            Hero media URL
          </label>
          <Input id="heroMediaUrl" {...form.register("heroMediaUrl")} />
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save changes"}
          </Button>
          <Link
            href="/trends/products"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Back
          </Link>
        </div>
      </form>
    </div>
  );
}
