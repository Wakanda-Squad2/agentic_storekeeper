import { StorekeeperBrand } from "@/components/brand/storekeeper-brand";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="absolute end-4 top-4 md:end-6 md:top-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-8">
        <StorekeeperBrand />
        {children}
      </div>
    </div>
  );
}
