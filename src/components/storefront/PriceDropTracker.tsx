import { useEffect, useRef, useState } from "react";
import { useCart, getEffectivePrice, useGeoCep } from "@/stores/cart";
import { useFavorites } from "@/stores/favorites";
import { useMarketing } from "@/stores/marketing";
import { useRegionsStore } from "@/stores/regions";
import { useAdmin } from "@/stores/admin";
import { catalog } from "@/services/catalog";
import { toast } from "sonner";
import { brl } from "@/lib/format";
import { calculateCepDistanceAsync, getCityFromCep } from "@/lib/utils";

export function PriceDropTracker() {
  const cartItems = useCart((s) => s.items);
  const updateCartItemPrice = useCart((s) => s.updateItemPrice);
  const addCartNotification = useCart((s) => s.addNotification);
  const favIds = useFavorites((s) => s.ids);
  const favPrices = useFavorites((s) => s.prices);
  const updateFavPrice = useFavorites((s) => s.updatePrice);
  const addFavNotification = useFavorites((s) => s.addNotification);
  const userCep = useGeoCep((s) => s.cep);
  const globalCity = useGeoCep((s) => s.city);
  const pharmacies = useAdmin((s) => s.pharmacies);
  const promocoes = useMarketing((s) => s.promocoes);
  const lojaPromocoes = useMarketing((s) => s.lojaPromocoes);
  const regionalPrices = useRegionsStore((s) => s.prices);
  const selectedPharmacyId = useCart((s) => s.selectedPharmacyId);

  useEffect(() => {
    async function checkPrices() {
      if (cartItems.length === 0 && favIds.length === 0) return;

      try {
        const liveProducts = await catalog.listProducts();
        
        // Calculate distances to all pharmacies
        const distances: Record<string, number> = {};
        if (userCep && pharmacies.length > 0) {
          await Promise.all(pharmacies.map(async (ph: any) => {
            const d = await calculateCepDistanceAsync(userCep, ph.cep);
            distances[ph.id] = d;
          }));
        }

        const rawCity = globalCity || (userCep ? getCityFromCep(userCep, pharmacies) : "");
        const normalize = (s: string) => s ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
        const citySearch = normalize(rawCity);

        const getBestPharmacyForProduct = (p: any) => {
          if (selectedPharmacyId) {
            const pharm = pharmacies.find((f: any) => f.id === selectedPharmacyId);
            if (pharm && p.precosPorLoja?.[pharm.id]?.ativo !== false) {
              return pharm;
            }
          }

          if (!userCep || Object.keys(distances).length === 0) return null;
          
          const eligible = pharmacies.filter((f: any) => {
            const dist = distances[f.id];
            if (dist === undefined) return false;
            const hasRaios = (f.raiosEntrega || []).some((r: any) => dist <= r.ateKm);
            const hasMeiosCustomizados = (f.meiosEntregaPersonalizados || []).filter((m: any) => m.ativo).some((m: any) => (m.raios || []).some((r: any) => dist <= r.ateKm));
            const canDeliver = f.aceitaEntrega && (hasRaios || hasMeiosCustomizados);
            const canPickup = f.aceitaRetirada;
            const productActive = p.precosPorLoja?.[f.id]?.ativo !== false;
            return (canDeliver || canPickup) && productActive;
          }).map((f: any) => ({
            ...f,
            isSameCity: normalize(f.cidade).includes(citySearch) || normalize(f.endereco).includes(citySearch)
          }));

          if (eligible.length > 0) {
            eligible.sort((a: any, b: any) => {
              if (a.isSameCity && !b.isSameCity) return -1;
              if (!a.isSameCity && b.isSameCity) return 1;
              return (distances[a.id] || 0) - (distances[b.id] || 0);
            });
            return eligible[0];
          }
          return null;
        };

        // Verificação do carrinho
        cartItems.forEach(item => {
          const live = liveProducts.find(p => p.id === item.id);
          if (live) {
            const bestPharm = getBestPharmacyForProduct(live);
            if (bestPharm) {
              const { precoPor } = getEffectivePrice(live as any, bestPharm.id);
              if (precoPor < item.preco) {
                addCartNotification(item.id, item.preco, precoPor, bestPharm.nome);
                if (updateCartItemPrice) {
                  updateCartItemPrice(item.id, precoPor);
                }
              }
            }
          }
        });

        // Verificação dos favoritos
        favIds.forEach(id => {
          const live = liveProducts.find(p => p.id === id);
          const precoSalvo = favPrices[id];
          if (live && precoSalvo) {
            const bestPharm = getBestPharmacyForProduct(live);
            if (bestPharm) {
              const { precoPor } = getEffectivePrice(live as any, bestPharm.id);
              if (precoPor < precoSalvo) {
                addFavNotification(id, precoSalvo, precoPor, bestPharm.nome);
                updateFavPrice(id, precoPor);
              }
            }
          }
        });

      } catch (error) {
        console.error("Failed to check price drops", error);
      }
    }

    const timer = setTimeout(checkPrices, 3000);
    return () => clearTimeout(timer);
  }, [cartItems, favIds, favPrices, updateFavPrice, updateCartItemPrice, userCep, pharmacies, globalCity, selectedPharmacyId, promocoes, lojaPromocoes, regionalPrices]);

  return null;
}
