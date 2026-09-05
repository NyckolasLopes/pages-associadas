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
        // Verificação do carrinho e favoritos: APENAS dentro da farmácia que o cliente está acessando
        if (selectedPharmacyId) {
          const currentPharm = pharmacies.find((f: any) => String(f.id) === String(selectedPharmacyId));
          if (currentPharm) {
            const allTrackedIds = Array.from(new Set([
              ...cartItems.map(i => String(i.id).trim()),
              ...favIds.map(id => String(id).trim())
            ])).filter(Boolean);

            if (allTrackedIds.length > 0) {
              const liveProducts = await catalog.getProductsByIds(allTrackedIds, currentPharm.id);

              // 1. Verificação dos itens do carrinho (SOMENTE SE DISPONÍVEL)
              cartItems.forEach(item => {
                const live = liveProducts.find(p => String(p.id).trim() === String(item.id).trim());
                if (!live) return;

                const isService = (live as any).tipoProduto === "servico" || ((live as any).tipoProduto !== "fisico" && (live.categoriaId === "200" || (live.subcategoriaId && String(live.subcategoriaId).startsWith("20"))));
                const stock = live.estoquesPorLoja?.[currentPharm.id] !== undefined 
                  ? Number(live.estoquesPorLoja[currentPharm.id]) 
                  : (live.estoque !== undefined ? Number(live.estoque) : 0);
                const isAvailable = (isService || stock > 0) && live.ativo !== false && (live as any).aVenda !== false;

                if (isAvailable && live.precosPorLoja?.[currentPharm.id]?.ativo !== false) {
                  const { precoPor } = getEffectivePrice(live as any, currentPharm.id);
                  if (precoPor > 0 && precoPor < item.preco) {
                    addCartNotification(
                      item.id,
                      item.preco,
                      precoPor,
                      currentPharm.nomeFantasia || currentPharm.razaoSocial || currentPharm.nome || "",
                      false,
                      item.nome
                    );
                    if (updateCartItemPrice) {
                      updateCartItemPrice(item.id, precoPor);
                    }
                  }
                }
              });

              // 2. Verificação dos favoritos: notifica no carrinho se mais barato, MAS SOMENTE SE DISPONÍVEL
              favIds.forEach(id => {
                const strId = String(id).trim();
                const live = liveProducts.find(p => String(p.id).trim() === strId);
                const precoSalvo = favPrices[strId] || favPrices[id];
                if (!live) return;

                const isService = (live as any).tipoProduto === "servico" || ((live as any).tipoProduto !== "fisico" && (live.categoriaId === "200" || (live.subcategoriaId && String(live.subcategoriaId).startsWith("20"))));
                const stock = live.estoquesPorLoja?.[currentPharm.id] !== undefined 
                  ? Number(live.estoquesPorLoja[currentPharm.id]) 
                  : (live.estoque !== undefined ? Number(live.estoque) : 0);
                const isAvailable = (isService || stock > 0) && live.ativo !== false && (live as any).aVenda !== false;

                if (!isAvailable) {
                  useFavorites.getState().markOutOfStock(strId, true);
                }

                // Notifica no carrinho se o produto favorito ficou mais barato E estiver disponível
                if (isAvailable && precoSalvo && precoSalvo > 0 && live.precosPorLoja?.[currentPharm.id]?.ativo !== false) {
                  const { precoPor } = getEffectivePrice(live as any, currentPharm.id);
                  if (precoPor > 0 && precoPor < precoSalvo) {
                    const storeName = currentPharm.nomeFantasia || currentPharm.razaoSocial || currentPharm.nome || "";
                    // Requisito: notifica no carrinho
                    addCartNotification(strId, precoSalvo, precoPor, storeName, true, live.nome);
                    // Notifica na aba de favoritos
                    addFavNotification(strId, precoSalvo, precoPor, storeName, live.nome);
                    updateFavPrice(strId, precoPor);
                  }
                }
              });
            }
          }
        }
      } catch (error) {
        console.error("Failed to check price drops", error);
      }
    }

    const timer = setTimeout(checkPrices, 3000);
    return () => clearTimeout(timer);
  }, [cartItems, favIds, favPrices, updateFavPrice, updateCartItemPrice, userCep, pharmacies, globalCity, selectedPharmacyId, promocoes, lojaPromocoes, regionalPrices]);

  return null;
}
