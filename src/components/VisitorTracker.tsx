import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/stores/cart";

export function VisitorTracker() {
  const selectedPharmacyId = useCart((s) => s.selectedPharmacyId);
  const trackedStoresRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const trackVisit = async () => {
      // Don't track if no store is selected (global home) or if we already tracked this store in this session
      if (!selectedPharmacyId) return;
      if (trackedStoresRef.current.has(selectedPharmacyId)) return;

      let sessionId = sessionStorage.getItem("visitor_session_id");
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem("visitor_session_id", sessionId);
      }
      
      try {
        const { error } = await supabase.from("site_acessos").insert({
          session_id: sessionId,
          loja_id: selectedPharmacyId,
        });
        if (error) {
          console.error("Supabase insert error for site_acessos:", error);
        } else {
          trackedStoresRef.current.add(selectedPharmacyId);
        }
      } catch (error) {
        console.error("Failed to track visitor:", error);
      }
    };

    // Delay tracking slightly to avoid blocking main render
    const timeout = setTimeout(trackVisit, 1000);
    return () => clearTimeout(timeout);
  }, [selectedPharmacyId]);

  return null; // Invisible component
}
