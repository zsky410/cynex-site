import { PremiumFooter, PremiumHeader } from "@/components/storefront/PremiumChrome";
import { CartPageClient } from "@/components/cart/CartPageClient";

export default function CartPage() {
  return (
    <div className="home-shell min-h-screen text-slate-950">
      <PremiumHeader />
      <main className="mx-auto max-w-[1180px] px-5 pb-16 pt-12 lg:px-8">
        <CartPageClient />
      </main>
      <PremiumFooter />
    </div>
  );
}
