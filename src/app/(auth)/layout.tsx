import { StorekeeperBrand } from "@/components/brand/storekeeper-brand";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-8">
        <StorekeeperBrand />
        {children}
      </div>
    </div>
  );
}
