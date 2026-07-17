"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { z } from "zod";

import {
  DataTable,
  type DataTableColumn,
} from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/badge";
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
import { createCampaign, getCampaigns } from "@/lib/api/campaigns";
import { getManagedProducts } from "@/lib/api/products";
import type { Campaign, CampaignPlatform } from "@/lib/types";
import { getApiErrorMessage } from "@/lib/utils/apiErrors";

const PAGE_SIZE = 20;

const PLATFORMS: Array<{ value: CampaignPlatform; label: string }> = [
  { value: "SNAPCHAT", label: "Snapchat" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "TIKTOK", label: "TikTok" },
  { value: "FACEBOOK", label: "Facebook" },
];

const createCampaignSchema = z.object({
  productId: z
    .number({ error: "Select a product" })
    .int()
    .positive("Select a product"),
  platform: z.enum(["SNAPCHAT", "INSTAGRAM", "TIKTOK", "FACEBOOK"]),
  utmSource: z.string().trim().max(255).optional(),
  budgetNote: z.string().trim().max(500).optional(),
  startDate: z.string().optional(),
});

type CreateCampaignFormValues = z.infer<typeof createCampaignSchema>;

function platformLabel(platform: CampaignPlatform): string {
  return PLATFORMS.find((item) => item.value === platform)?.label ?? platform;
}

function CreateCampaignDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ["managed-products", "campaign-picker"],
    queryFn: () => getManagedProducts(0, 100),
    enabled: open,
  });

  const form = useForm<CreateCampaignFormValues>({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: {
      productId: 0,
      platform: "INSTAGRAM",
      utmSource: "",
      budgetNote: "",
      startDate: "",
    },
  });

  const selectedPlatform = useWatch({
    control: form.control,
    name: "platform",
  });

  const mutation = useMutation({
    mutationFn: (values: CreateCampaignFormValues) =>
      createCampaign({
        productId: values.productId,
        platform: values.platform,
        utmSource: values.utmSource || undefined,
        budgetNote: values.budgetNote || undefined,
        startDate: values.startDate || undefined,
      }),
    onSuccess: async () => {
      toast.success("Campaign created");
      await queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      form.reset({
        productId: 0,
        platform: "INSTAGRAM",
        utmSource: "",
        budgetNote: "",
        startDate: "",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to create campaign"));
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          form.reset();
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create campaign</DialogTitle>
          <DialogDescription>
            Link one of your products to an ad platform.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <div className="space-y-2">
            <label htmlFor="productId" className="text-sm font-medium">
              Product
            </label>
            <select
              id="productId"
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              {...form.register("productId", { valueAsNumber: true })}
            >
              <option value={0}>Select a product</option>
              {(productsQuery.data?.content ?? []).map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
            {form.formState.errors.productId ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.productId.message}
              </p>
            ) : null}
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Platform</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {PLATFORMS.map((platform) => (
                <label
                  key={platform.value}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <input
                    type="radio"
                    value={platform.value}
                    checked={selectedPlatform === platform.value}
                    onChange={() => form.setValue("platform", platform.value)}
                  />
                  {platform.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="space-y-2">
            <label htmlFor="utmSource" className="text-sm font-medium">
              UTM source
            </label>
            <Input
              id="utmSource"
              placeholder="instagram_ads"
              {...form.register("utmSource")}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="budgetNote" className="text-sm font-medium">
              Budget note
            </label>
            <Input
              id="budgetNote"
              placeholder="QAR 5,000 / week"
              {...form.register("budgetNote")}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="startDate" className="text-sm font-medium">
              Start date (optional)
            </label>
            <Input id="startDate" type="date" {...form.register("startDate")} />
          </div>

          <DialogFooter className="px-0 pb-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating…" : "Create campaign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function TrendsCampaignsPage() {
  const [page, setPage] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);

  const campaignsQuery = useQuery({
    queryKey: ["campaigns", page, PAGE_SIZE],
    queryFn: () => getCampaigns(page, PAGE_SIZE),
  });

  const productsQuery = useQuery({
    queryKey: ["managed-products", "campaign-names"],
    queryFn: () => getManagedProducts(0, 100),
  });

  const productNames = useMemo(() => {
    const map = new Map<number, string>();
    for (const product of productsQuery.data?.content ?? []) {
      map.set(product.id, product.name);
    }
    return map;
  }, [productsQuery.data?.content]);

  const columns = useMemo<DataTableColumn<Campaign>[]>(
    () => [
      {
        id: "product",
        header: "Product",
        cell: (row) =>
          productNames.get(row.productId) ?? `Product #${row.productId}`,
      },
      {
        id: "platform",
        header: "Platform",
        cell: (row) => <Badge variant="secondary">{platformLabel(row.platform)}</Badge>,
      },
      {
        id: "utm",
        header: "UTM source",
        cell: (row) => row.utmSource ?? "—",
      },
      {
        id: "budget",
        header: "Budget note",
        cell: (row) => row.budgetNote ?? "—",
      },
      {
        id: "start",
        header: "Start date",
        cell: (row) => row.startDate ?? "—",
      },
    ],
    [productNames],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Link products to Snapchat, Instagram, TikTok, or Facebook.
          </p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus />
          Create campaign
        </Button>
      </div>

      {campaignsQuery.isError ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {getApiErrorMessage(campaignsQuery.error)}
        </p>
      ) : (
        <DataTable
          columns={columns}
          data={campaignsQuery.data?.content ?? []}
          getRowId={(row) => row.id}
          page={page}
          totalPages={campaignsQuery.data?.totalPages ?? 0}
          totalElements={campaignsQuery.data?.totalElements ?? 0}
          onPageChange={setPage}
          isLoading={campaignsQuery.isLoading || campaignsQuery.isFetching}
          emptyMessage="No campaigns yet."
        />
      )}

      <CreateCampaignDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
