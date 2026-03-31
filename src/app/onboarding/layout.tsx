import { StorekeeperBrand } from "@/components/brand/storekeeper-brand";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card/80 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <StorekeeperBrand layout="horizontal" size="sm" />
          <span className="text-sm font-medium tracking-[0.5px] text-muted-foreground">
            Onboarding
          </span>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center px-4 py-10 md:py-16">
        {children}
      </main>
    </div>
  );
}
