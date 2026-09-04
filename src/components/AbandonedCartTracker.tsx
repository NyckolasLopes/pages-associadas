import { useCartSync } from "@/hooks/useCartSync";

export function AbandonedCartTracker() {
  useCartSync();
  return null;
}

