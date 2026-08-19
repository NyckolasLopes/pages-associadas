import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function VisitorTracker() {
  useEffect(() => {
    const trackVisit = async () => {
      // Create or get a unique session ID for this browser tab/session
      let sessionId = sessionStorage.getItem("visitor_session_id");
      
      // We will record access once per session, per store
      // If store changes in the same session (unlikely), we might want to track again, but let's keep it simple: 1 session = 1 visit
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem("visitor_session_id", sessionId);
        
        try {
          const { error } = await supabase.from("site_acessos").insert({
            session_id: sessionId,
            loja_id: null, // Pode ser preenchido se tiver um context da loja ativa no storefront
          });
          if (error) {
            console.error("Supabase insert error for site_acessos:", error);
          }
        } catch (error) {
          console.error("Failed to track visitor:", error);
        }
      }
    };

    // Delay tracking slightly to avoid blocking main render
    const timeout = setTimeout(trackVisit, 1000);
    return () => clearTimeout(timeout);
  }, []);

  return null; // Invisible component
}
