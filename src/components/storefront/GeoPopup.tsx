import { useEffect } from "react";
import { useGeoCep } from "@/stores/cart";
import { reverseGeocodeLatLon } from "@/lib/geo";

const SEEN_KEY = "fa-geo-popup-seen-v5";

export function GeoPopup() {
  const { cep, setCep } = useGeoCep();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem(SEEN_KEY);
    
    // Only detect if not seen AND no CEP is currently stored
    if (!seen && !cep) {
      const timer = setTimeout(() => {
        if (!navigator.geolocation) return;
        localStorage.setItem(SEEN_KEY, "1");

        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            useGeoCep.getState().setCoordinates(lat, lng);

            try {
              const foundCep = await reverseGeocodeLatLon(lat, lng);
              if (foundCep && foundCep.length === 8) {
                await setCep(foundCep);
              }
            } catch (e) {
              console.error("Geocoding error:", e);
            }
          },
          (err) => {
            console.error("Geolocation denied or error:", err);
          }
        );
      }, 2500); // 2.5s delay to not impact LCP/FCP or hydration
      
      return () => clearTimeout(timer);
    }
  }, [cep]);

  // Headless component, renders absolutely nothing to the DOM
  return null;
}
