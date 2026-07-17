import { ProductCreateWizard } from "@/components/trends/ProductCreateWizard";

export default function TrendsNewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New product</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a product for admin approval. It will start as Pending
          Approval.
        </p>
      </div>
      <ProductCreateWizard />
    </div>
  );
}
