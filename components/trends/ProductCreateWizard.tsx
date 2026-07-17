"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCampaign } from "@/lib/api/campaigns";
import { createProduct, uploadProductMedia } from "@/lib/api/products";
import type { CampaignPlatform, CreateProductRequest, Product } from "@/lib/types";
import {
  generateVariantSku,
  getApiErrorMessage,
  toIsoDateTime,
} from "@/lib/utils/apiErrors";
import { cn } from "@/lib/utils";

const STEPS = [
  "Info",
  "Variants",
  "Pricing",
  "Media",
  "Campaign",
] as const;

const infoSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  description: z.string().trim().optional(),
  category: z.string().trim().min(1, "Category is required").max(100),
});

const variantsSchema = z.object({
  variants: z
    .array(
      z.object({
        color: z.string().trim().min(1, "Color/option is required"),
        stockQty: z
          .number({ error: "Stock is required" })
          .int("Stock must be a whole number")
          .min(0, "Stock cannot be negative"),
        swatchHex: z
          .string()
          .trim()
          .regex(/^$|^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Use #RGB or #RRGGBB")
          .optional(),
      }),
    )
    .min(1, "Add at least one variant"),
});

const pricingSchema = z
  .object({
    costPrice: z
      .number({ error: "Cost price is required" })
      .positive("Cost price must be greater than 0"),
    sellPrice: z
      .number({ error: "Sell price is required" })
      .positive("Sell price must be greater than 0"),
    launchStart: z.string().optional(),
    launchEnd: z.string().optional(),
  })
  .refine((values) => values.sellPrice >= values.costPrice, {
    message: "Sell price must be greater than or equal to cost price",
    path: ["sellPrice"],
  });

const mediaSchema = z.object({
  images: z
    .array(
      z.object({
        imageUrl: z
          .string()
          .trim()
          .url("Enter a valid image URL")
          .max(1000),
      }),
    )
    .min(1),
});

const campaignSchema = z.object({
  includeCampaign: z.boolean(),
  platform: z.enum(["SNAPCHAT", "INSTAGRAM", "TIKTOK", "FACEBOOK"]).optional(),
  utmSource: z.string().trim().max(255).optional(),
}).superRefine((values, ctx) => {
  if (values.includeCampaign && !values.platform) {
    ctx.addIssue({
      code: "custom",
      message: "Select a platform",
      path: ["platform"],
    });
  }
});

type InfoValues = z.infer<typeof infoSchema>;
type VariantsValues = z.infer<typeof variantsSchema>;
type PricingValues = z.infer<typeof pricingSchema>;
type MediaValues = z.infer<typeof mediaSchema>;
type CampaignValues = z.infer<typeof campaignSchema>;

interface WizardDraft {
  info: InfoValues;
  variants: VariantsValues;
  pricing: PricingValues;
  media: MediaValues;
  campaign: CampaignValues;
}

const PLATFORMS: Array<{ value: CampaignPlatform; label: string }> = [
  { value: "SNAPCHAT", label: "Snapchat" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "TIKTOK", label: "TikTok" },
  { value: "FACEBOOK", label: "Facebook" },
];

export function ProductCreateWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [createdProduct, setCreatedProduct] = useState<Product | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [draft, setDraft] = useState<WizardDraft>({
    info: { name: "", description: "", category: "" },
    variants: { variants: [{ color: "", stockQty: 0, swatchHex: "" }] },
    pricing: { costPrice: 0, sellPrice: 0, launchStart: "", launchEnd: "" },
    media: { images: [{ imageUrl: "" }] },
    campaign: { includeCampaign: false, platform: undefined, utmSource: "" },
  });

  const infoForm = useForm<InfoValues>({
    resolver: zodResolver(infoSchema),
    values: draft.info,
  });

  const variantsForm = useForm<VariantsValues>({
    resolver: zodResolver(variantsSchema),
    values: draft.variants,
  });

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({
    control: variantsForm.control,
    name: "variants",
  });

  const pricingForm = useForm<PricingValues>({
    resolver: zodResolver(pricingSchema),
    values: draft.pricing,
  });

  const mediaForm = useForm<MediaValues>({
    resolver: zodResolver(mediaSchema),
    values: draft.media,
  });

  const campaignForm = useForm<CampaignValues>({
    resolver: zodResolver(campaignSchema),
    values: draft.campaign,
  });

  const includeCampaign = useWatch({
    control: campaignForm.control,
    name: "includeCampaign",
  });
  const watchedMediaImages = useWatch({
    control: mediaForm.control,
    name: "images",
  });

  const submitMutation = useMutation({
    mutationFn: async (finalDraft: WizardDraft) => {
      const totalStock = finalDraft.variants.variants.reduce(
        (sum, variant) => sum + variant.stockQty,
        0,
      );

      const payload: CreateProductRequest = {
        name: finalDraft.info.name,
        description: finalDraft.info.description || undefined,
        category: finalDraft.info.category,
        costPrice: finalDraft.pricing.costPrice,
        sellPrice: finalDraft.pricing.sellPrice,
        stockQty: totalStock,
        launchStart: toIsoDateTime(finalDraft.pricing.launchStart),
        launchEnd: toIsoDateTime(finalDraft.pricing.launchEnd),
        variants: finalDraft.variants.variants.map((variant, index) => ({
          color: variant.color || null,
          sku: generateVariantSku(variant.color, index),
          stockQty: variant.stockQty,
          initialStockQty: variant.stockQty,
          imageUrl: finalDraft.media.images[index]?.imageUrl || null,
          swatchHex: variant.swatchHex || null,
          spinFrames: [],
        })),
        landingPage: {
          heroMediaUrl: finalDraft.media.images[0]?.imageUrl || null,
          sectionsJson: null,
          urgencyCounter: null,
          countdownEnd: null,
        },
      };

      const product = await createProduct(payload);

      if (finalDraft.campaign.includeCampaign && finalDraft.campaign.platform) {
        await createCampaign({
          productId: product.id,
          platform: finalDraft.campaign.platform,
          utmSource: finalDraft.campaign.utmSource || undefined,
        });
      }

      return product;
    },
    onSuccess: (product) => {
      setCreatedProduct(product);
      toast.success("Product submitted for approval");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to create product"));
    },
  });

  const goNext = async () => {
    if (step === 0) {
      const valid = await infoForm.trigger();
      if (!valid) return;
      setDraft((current) => ({ ...current, info: infoForm.getValues() }));
      setStep(1);
      return;
    }

    if (step === 1) {
      const valid = await variantsForm.trigger();
      if (!valid) return;
      const variants = variantsForm.getValues();
      setDraft((current) => ({
        ...current,
        variants,
        media: {
          images: variants.variants.map((_, index) => ({
            imageUrl: current.media.images[index]?.imageUrl ?? "",
          })),
        },
      }));
      setStep(2);
      return;
    }

    if (step === 2) {
      const valid = await pricingForm.trigger();
      if (!valid) return;
      const variants = draft.variants.variants;
      mediaForm.reset({
        images: variants.map((_, index) => ({
          imageUrl: draft.media.images[index]?.imageUrl ?? "",
        })),
      });
      setDraft((current) => ({
        ...current,
        pricing: pricingForm.getValues(),
      }));
      setStep(3);
      return;
    }

    if (step === 3) {
      const valid = await mediaForm.trigger();
      if (!valid) return;
      setDraft((current) => ({ ...current, media: mediaForm.getValues() }));
      setStep(4);
      return;
    }

    if (step === 4) {
      const valid = await campaignForm.trigger();
      if (!valid) return;
      const campaignValues = campaignForm.getValues();
      const finalDraft = { ...draft, campaign: campaignValues };
      setDraft(finalDraft);
      submitMutation.mutate(finalDraft);
    }
  };

  const goBack = () => {
    setStep((current) => Math.max(0, current - 1));
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const previewUrl = await uploadProductMedia(file);
      setMediaPreview(previewUrl);
      toast.message("Preview ready", {
        description:
          "Paste a public CDN/URL below for the live landing page — the backend stores a URL string.",
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Invalid media file"));
    } finally {
      event.target.value = "";
    }
  };

  const previewSrc =
    mediaPreview || watchedMediaImages?.[0]?.imageUrl || null;

  if (createdProduct) {
    return (
      <div className="mx-auto max-w-lg space-y-4 rounded-2xl border border-border p-6 text-center">
        <CheckCircle2 className="mx-auto size-10 text-primary" />
        <h2 className="text-xl font-semibold">Submitted for approval</h2>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {createdProduct.name}
          </span>{" "}
          was created as <span className="font-medium">Pending Approval</span>.
          An admin will review it before it goes live.
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <Button
            type="button"
            onClick={() => router.push("/trends/products")}
          >
            Back to products
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              router.push(`/trends/products/${createdProduct.id}/edit`)
            }
          >
            Edit product
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <ol className="flex flex-wrap gap-2">
        {STEPS.map((label, index) => (
          <li
            key={label}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium",
              index === step
                ? "border-primary bg-primary text-primary-foreground"
                : index < step
                  ? "border-border bg-muted text-foreground"
                  : "border-border text-muted-foreground",
            )}
          >
            {index + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Product name
            </label>
            <Input id="name" {...infoForm.register("name")} />
            {infoForm.formState.errors.name ? (
              <p className="text-sm text-destructive">
                {infoForm.formState.errors.name.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">
              Category
            </label>
            <Input id="category" {...infoForm.register("category")} />
            {infoForm.formState.errors.category ? (
              <p className="text-sm text-destructive">
                {infoForm.formState.errors.category.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              {...infoForm.register("description")}
            />
          </div>
        </form>
      ) : null}

      {step === 1 ? (
        <div className="space-y-4">
          {variantFields.map((field, index) => (
            <div
              key={field.id}
              className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-[1fr_120px_120px_auto]"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium">Color / option</label>
                <Input
                  {...variantsForm.register(`variants.${index}.color`)}
                  placeholder="Noir Black"
                />
                {variantsForm.formState.errors.variants?.[index]?.color ? (
                  <p className="text-sm text-destructive">
                    {
                      variantsForm.formState.errors.variants[index]?.color
                        ?.message
                    }
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Swatch</label>
                <Input
                  {...variantsForm.register(`variants.${index}.swatchHex`)}
                  placeholder="#1a1a1a"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Stock</label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  {...variantsForm.register(`variants.${index}.stockQty`, {
                    valueAsNumber: true,
                  })}
                />
                {variantsForm.formState.errors.variants?.[index]?.stockQty ? (
                  <p className="text-sm text-destructive">
                    {
                      variantsForm.formState.errors.variants[index]?.stockQty
                        ?.message
                    }
                  </p>
                ) : null}
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={variantFields.length === 1}
                  onClick={() => removeVariant(index)}
                  aria-label="Remove variant"
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          ))}
          {variantsForm.formState.errors.variants?.root ? (
            <p className="text-sm text-destructive">
              {variantsForm.formState.errors.variants.root.message}
            </p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendVariant({ color: "", stockQty: 0, swatchHex: "" })
            }
          >
            <Plus />
            Add variant
          </Button>
        </div>
      ) : null}

      {step === 2 ? (
        <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="costPrice" className="text-sm font-medium">
                Cost price (QAR)
              </label>
              <Input
                id="costPrice"
                type="number"
                min={0}
                step="0.01"
                {...pricingForm.register("costPrice", { valueAsNumber: true })}
              />
              {pricingForm.formState.errors.costPrice ? (
                <p className="text-sm text-destructive">
                  {pricingForm.formState.errors.costPrice.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label htmlFor="sellPrice" className="text-sm font-medium">
                Sell price (QAR)
              </label>
              <Input
                id="sellPrice"
                type="number"
                min={0}
                step="0.01"
                {...pricingForm.register("sellPrice", { valueAsNumber: true })}
              />
              {pricingForm.formState.errors.sellPrice ? (
                <p className="text-sm text-destructive">
                  {pricingForm.formState.errors.sellPrice.message}
                </p>
              ) : null}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="launchStart" className="text-sm font-medium">
                Launch start (optional)
              </label>
              <Input
                id="launchStart"
                type="datetime-local"
                {...pricingForm.register("launchStart")}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="launchEnd" className="text-sm font-medium">
                Launch end (optional)
              </label>
              <Input
                id="launchEnd"
                type="datetime-local"
                {...pricingForm.register("launchEnd")}
              />
            </div>
          </div>
        </form>
      ) : null}

      {step === 3 ? (
        <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
          <p className="text-sm text-muted-foreground">
            Add one public image URL per colour. The first image is also used as
            the product hero fallback.
          </p>
          {draft.variants.variants.map((variant, index) => (
            <div key={`${variant.color}-${index}`} className="space-y-2">
              <label className="text-sm font-medium">
                {variant.color || `Variant ${index + 1}`} — image URL
              </label>
              <Input
                placeholder="https://cdn.example.com/variant.jpg"
                {...mediaForm.register(`images.${index}.imageUrl`)}
              />
              {mediaForm.formState.errors.images?.[index]?.imageUrl ? (
                <p className="text-sm text-destructive">
                  {mediaForm.formState.errors.images[index]?.imageUrl?.message}
                </p>
              ) : null}
            </div>
          ))}
          <div className="space-y-2">
            <label htmlFor="mediaFile" className="text-sm font-medium">
              Preview file (optional)
            </label>
            <Input
              id="mediaFile"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
              onChange={handleFileChange}
            />
          </div>
          {previewSrc ? (
            <div className="overflow-hidden rounded-xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewSrc}
                alt="Media preview"
                className="max-h-64 w-full object-cover"
              />
            </div>
          ) : null}
        </form>
      ) : null}

      {step === 4 ? (
        <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4"
              {...campaignForm.register("includeCampaign")}
            />
            Link a campaign now (optional)
          </label>

          {includeCampaign ? (
            <>
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
                        {...campaignForm.register("platform")}
                      />
                      {platform.label}
                    </label>
                  ))}
                </div>
                {campaignForm.formState.errors.platform ? (
                  <p className="text-sm text-destructive">
                    {campaignForm.formState.errors.platform.message}
                  </p>
                ) : null}
              </fieldset>
              <div className="space-y-2">
                <label htmlFor="utmSource" className="text-sm font-medium">
                  UTM source
                </label>
                <Input
                  id="utmSource"
                  placeholder="snapchat_ads"
                  {...campaignForm.register("utmSource")}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              You can skip this and attach a campaign later from the Campaigns
              page.
            </p>
          )}
        </form>
      ) : null}

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={goBack}
          disabled={step === 0 || submitMutation.isPending}
        >
          Back
        </Button>
        <div className="flex gap-2">
          {step === 4 && !includeCampaign ? (
            <Button
              type="button"
              variant="ghost"
              disabled={submitMutation.isPending}
              onClick={() => {
                campaignForm.setValue("includeCampaign", false);
                void goNext();
              }}
            >
              Skip & submit
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={() => void goNext()}
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending
              ? "Submitting…"
              : step === 4
                ? "Submit for approval"
                : "Continue"}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Prefer to cancel?{" "}
        <Link href="/trends/products" className="underline">
          Return to products
        </Link>
      </p>
    </div>
  );
}
