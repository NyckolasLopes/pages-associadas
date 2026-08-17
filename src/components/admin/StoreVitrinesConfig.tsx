import React, { useState } from "react";
import { 
  ShoppingBag, 
  Plus, 
  Package, 
  Layers, 
  Check, 
  ArrowUpDown, 
  Sparkles, 
  AlertCircle, 
  ExternalLink,
  Flame,
  Award,
  Clock,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdmin, StorefrontVitrineConfig } from "@/stores/admin";
import { useAdminProducts } from "@/stores/products";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export function StoreVitrinesConfig() {
  const storefrontVitrineConfig = useAdmin((s) => s.storefrontVitrineConfig);
  const setStorefrontVitrineConfig = useAdmin((s) => s.setStorefrontVitrineConfig);
  const featuredCategories = useAdmin((s) => s.featuredCategories) || [];
  const customProducts = useAdminProducts((s) => s.customProducts) || [];

  // Local state for editing form
  const [config, setConfig] = useState<StorefrontVitrineConfig>({
    lancamentos: storefrontVitrineConfig?.lancamentos ?? true,
    maisVendidos: storefrontVitrineConfig?.maisVendidos ?? true,
    destaques: storefrontVitrineConfig?.destaques ?? true,
    destaquesOrdem: storefrontVitrineConfig?.destaquesOrdem ?? "alfabetica",
    porCategoria: storefrontVitrineConfig?.porCategoria ?? true,
    porCategoriaOrdem: storefrontVitrineConfig?.porCategoriaOrdem ?? "recentes",
    vazia: storefrontVitrineConfig?.vazia ?? false,
    produtosPorVitrine: storefrontVitrineConfig?.produtosPorVitrine ?? 8,
  });

  const handleSave = () => {
    setStorefrontVitrineConfig(config);
    toast.success("Configurações das vitrines salvas com sucesso!");
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Minhas Vitrines</h3>
          <p className="text-sm text-slate-500 mt-1">
            Configure a exibição e ordenação dos produtos na vitrine principal da sua loja.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/produtos/novo">
            <Button className="bg-[#00B5AD] hover:bg-[#009c95] text-white font-bold h-10 px-4 shadow-sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Criar Produto
            </Button>
          </Link>
          <Link to="/admin/produtos">
            <Button variant="outline" className="border-slate-300 text-slate-700 font-bold hover:bg-slate-50 h-10 px-4">
              <Package className="w-4 h-4 mr-1.5 text-slate-500" />
              Ver Produtos
            </Button>
          </Link>
          <Link to="/admin/categorias">
            <Button variant="outline" className="border-slate-300 text-slate-700 font-bold hover:bg-slate-50 h-10 px-4">
              <Layers className="w-4 h-4 mr-1.5 text-slate-500" />
              Categorias
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Painel Principal de Configuração (Fiel à Imagem 2) */}
        <div className="lg:col-span-8 bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
          
          <div className="space-y-6">
            
            {/* 1. LANÇAMENTOS */}
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="vitrine-lancamentos"
                checked={config.lancamentos}
                onCheckedChange={(checked) => setConfig({ ...config, lancamentos: !!checked })}
                className="data-[state=checked]:bg-[#00B5AD] data-[state=checked]:border-[#00B5AD] h-5 w-5 rounded"
              />
              <Label 
                htmlFor="vitrine-lancamentos" 
                className="text-[15px] font-medium text-slate-800 cursor-pointer select-none"
              >
                Lançamentos
              </Label>
            </div>

            {/* 2. MAIS VENDIDOS */}
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="vitrine-mais-vendidos"
                checked={config.maisVendidos}
                onCheckedChange={(checked) => setConfig({ ...config, maisVendidos: !!checked })}
                className="data-[state=checked]:bg-[#00B5AD] data-[state=checked]:border-[#00B5AD] h-5 w-5 rounded"
              />
              <Label 
                htmlFor="vitrine-mais-vendidos" 
                className="text-[15px] font-medium text-slate-800 cursor-pointer select-none"
              >
                Mais pedidos
              </Label>
            </div>

            <hr className="border-slate-200" />

            {/* 3. DESTAQUES COM ORDENAÇÃO */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="vitrine-destaques"
                  checked={config.destaques}
                  onCheckedChange={(checked) => setConfig({ ...config, destaques: !!checked })}
                  className="data-[state=checked]:bg-[#00B5AD] data-[state=checked]:border-[#00B5AD] h-5 w-5 rounded"
                />
                <Label 
                  htmlFor="vitrine-destaques" 
                  className="text-[15px] font-medium text-slate-800 cursor-pointer select-none"
                >
                  Destaques
                </Label>
              </div>

              {config.destaques && (
                <div className="pl-8 pt-1">
                  <div className="space-y-1.5 max-w-sm">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Ordenar por
                    </Label>
                    <Select 
                      value={config.destaquesOrdem}
                      onValueChange={(val: any) => setConfig({ ...config, destaquesOrdem: val })}
                    >
                      <SelectTrigger className="h-10 bg-white border-slate-200">
                        <SelectValue placeholder="Selecione a ordenação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alfabetica">Produtos em ordem alfabética</SelectItem>
                        <SelectItem value="recentes">Últimos produtos adicionados</SelectItem>
                        <SelectItem value="mais_vendidos">Mais pedidos</SelectItem>
                        <SelectItem value="menor_preco">Menor preço</SelectItem>
                        <SelectItem value="maior_preco">Maior preço</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <hr className="border-slate-200" />

            {/* 4. POR CATEGORIA COM ORDENAÇÃO & CALLOUT AMARELO (FIEL À IMAGEM 2) */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="vitrine-por-categoria"
                  checked={config.porCategoria}
                  onCheckedChange={(checked) => setConfig({ ...config, porCategoria: !!checked })}
                  className="data-[state=checked]:bg-[#00B5AD] data-[state=checked]:border-[#00B5AD] h-5 w-5 rounded"
                />
                <Label 
                  htmlFor="vitrine-por-categoria" 
                  className="text-[15px] font-medium text-slate-800 cursor-pointer select-none"
                >
                  Por categoria
                </Label>
              </div>

              {config.porCategoria && (
                <div className="pl-8 space-y-4">
                  <div className="space-y-1.5 max-w-sm">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Ordenar por
                    </Label>
                    <Select 
                      value={config.porCategoriaOrdem}
                      onValueChange={(val: any) => setConfig({ ...config, porCategoriaOrdem: val })}
                    >
                      <SelectTrigger className="h-10 bg-white border-slate-200">
                        <SelectValue placeholder="Selecione a ordenação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recentes">Últimos produtos adicionados</SelectItem>
                        <SelectItem value="alfabetica">Produtos em ordem alfabética</SelectItem>
                        <SelectItem value="desconto">Maior desconto (%)</SelectItem>
                        <SelectItem value="menor_preco">Menor preço</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Card de Aviso Amarelo com Borda e Botão de Editar Categorias (Fiel à Imagem 2) */}
                  <div className="p-4 rounded-lg bg-[#FEF9C3]/80 border border-[#FDE047] text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs md:text-sm text-slate-700 leading-relaxed">
                        Apenas categorias marcadas como <strong className="font-bold text-slate-900">Destaque</strong> serão exibidas na vitrine (limite de 10 categorias).
                      </p>
                    </div>

                    <Link to="/admin/categorias">
                      <Button 
                        size="sm" 
                        className="bg-[#00B5AD] hover:bg-[#009c95] text-white font-bold h-9 px-4 rounded-md shadow-xs shrink-0"
                      >
                        Editar categorias
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <hr className="border-slate-200" />

            {/* 5. VAZIA */}
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="vitrine-vazia"
                checked={config.vazia}
                onCheckedChange={(checked) => setConfig({ ...config, vazia: !!checked })}
                className="data-[state=checked]:bg-[#00B5AD] data-[state=checked]:border-[#00B5AD] h-5 w-5 rounded"
              />
              <Label 
                htmlFor="vitrine-vazia" 
                className="text-[15px] font-medium text-slate-800 cursor-pointer select-none"
              >
                Vazia
              </Label>
            </div>

            <hr className="border-slate-200" />

            {/* 6. QUANTOS PRODUTOS MOSTRAR? */}
            <div className="space-y-2 pt-2">
              <Label className="text-sm font-bold text-slate-800">
                Quantos produtos mostrar?
              </Label>
              <div className="max-w-[200px]">
                <Select 
                  value={String(config.produtosPorVitrine)}
                  onValueChange={(val) => setConfig({ ...config, produtosPorVitrine: Number(val) })}
                >
                  <SelectTrigger className="h-10 bg-white border-slate-200">
                    <SelectValue placeholder="Selecione a quantidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4 produtos</SelectItem>
                    <SelectItem value="8">8 produtos</SelectItem>
                    <SelectItem value="12">12 produtos</SelectItem>
                    <SelectItem value="16">16 produtos</SelectItem>
                    <SelectItem value="20">20 produtos</SelectItem>
                    <SelectItem value="24">24 produtos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-slate-500">
                Define o limite de itens carregados por carrossel ou grade de produtos na home.
              </p>
            </div>

          </div>

          {/* Botão de Salvar Alterações */}
          <div className="pt-6 border-t border-slate-200 flex justify-end">
            <Button 
              onClick={handleSave} 
              className="bg-[#00B5AD] hover:bg-[#009c95] text-white font-bold h-11 px-8 rounded-lg shadow-sm text-base"
            >
              <Check className="w-5 h-5 mr-2" />
              Salvar configurações da vitrine
            </Button>
          </div>

        </div>

        {/* Coluna Direita: Panorama e Resumo das Vitrines Ativas */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00B5AD]" />
              Resumo da Sua Loja
            </h4>
            <p className="text-xs text-slate-500">
              Vitrines que serão renderizadas para seus clientes na página inicial:
            </p>

            <div className="space-y-2.5 pt-2">
              {config.lancamentos && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    Lançamentos
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                    {config.produtosPorVitrine} itens
                  </span>
                </div>
              )}

              {config.maisVendidos && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-800 font-bold text-xs">
                    <Award className="w-4 h-4 text-blue-600" />
                    Mais Pedidos
                  </div>
                  <span className="text-[11px] font-semibold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                    {config.produtosPorVitrine} itens
                  </span>
                </div>
              )}

              {config.destaques && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                    <Flame className="w-4 h-4 text-amber-600" />
                    Destaques
                  </div>
                  <span className="text-[11px] font-semibold text-amber-700 bg-white px-2 py-0.5 rounded border border-amber-200">
                    {config.destaquesOrdem}
                  </span>
                </div>
              )}

              {config.porCategoria && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-800 font-bold text-xs">
                    <Layers className="w-4 h-4 text-purple-600" />
                    Por Categoria
                  </div>
                  <span className="text-[11px] font-semibold text-purple-700 bg-white px-2 py-0.5 rounded border border-purple-200">
                    {featuredCategories?.length || 0} categorias
                  </span>
                </div>
              )}

              {!config.lancamentos && !config.maisVendidos && !config.destaques && !config.porCategoria && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500">
                  Nenhuma vitrine selecionada no momento.
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
              <span className="text-xs text-slate-500 font-medium">Catálogo de Produtos:</span>
              <div className="flex items-center justify-between text-xs text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200">
                <span>Total de produtos cadastrados</span>
                <span className="font-bold text-[#00B5AD]">{customProducts?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
