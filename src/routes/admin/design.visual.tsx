import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { LayoutTemplate } from "lucide-react";

export const Route = createFileRoute("/admin/design/visual")({
  component: AdminDesignVisual,
});

function AdminDesignVisual() {
  return (
    <div className="space-y-6 pb-20">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Visual da Loja</h2>
        <p className="text-muted-foreground">Configure a estrutura e layout da sua loja.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold text-slate-800">Visual da loja</h3>
          
          <div className="text-xs text-muted-foreground mb-2">Largura: 1180px</div>
          
          <div className="bg-slate-50 p-4 border rounded-xl space-y-2 relative">
            <div className="w-full bg-slate-200 h-8 rounded flex items-center justify-center text-xs font-bold text-slate-500">Menu Superior</div>
            <div className="w-full bg-slate-200 h-24 rounded flex items-center justify-center text-xs font-bold text-slate-500">Fullbanner</div>
            <div className="w-full bg-slate-200 h-8 rounded flex items-center justify-center text-xs font-bold text-slate-500">Banner tarja</div>
            <div className="flex gap-2">
              <div className="flex-1 bg-slate-200 h-20 rounded flex items-center justify-center text-xs font-bold text-slate-500">Banner vitrine</div>
              <div className="w-1/3 bg-slate-200 h-20 rounded flex items-center justify-center text-xs font-bold text-slate-500">Box newsletter</div>
            </div>
            <div className="w-full bg-slate-200 h-40 rounded flex items-center justify-center text-xs font-bold text-slate-500">Listagem dos Produtos</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <div className="p-3 bg-slate-50 border-b font-bold text-sm text-slate-700 flex items-center justify-between">
              Disposição do layout
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Tamanho do Layout</label>
                <select className="w-full border-slate-200 rounded-md text-sm">
                  <option>Médio (1180px)</option>
                  <option>Largo (1440px)</option>
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Disposição do logotipo</label>
                <select className="w-full border-slate-200 rounded-md text-sm">
                  <option>Logo a Esquerda</option>
                  <option>Logo Centralizado</option>
                </select>
                
                <div className="flex gap-2 mt-3 pt-2">
                  <div className="border-2 border-primary rounded p-1 cursor-pointer">
                    <LayoutTemplate className="h-8 w-8 text-slate-400" />
                  </div>
                  <div className="border rounded p-1 cursor-pointer opacity-50 hover:opacity-100">
                    <LayoutTemplate className="h-8 w-8 text-slate-400" />
                  </div>
                  <div className="border rounded p-1 cursor-pointer opacity-50 hover:opacity-100">
                    <LayoutTemplate className="h-8 w-8 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Disposição da coluna lateral</label>
                <select className="w-full border-slate-200 rounded-md text-sm">
                  <option>Sem coluna</option>
                  <option>Coluna a esquerda</option>
                </select>
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" defaultChecked className="rounded text-primary focus:ring-primary" />
                  Exibir menu superior
                </label>
                <div className="ml-6 space-y-2">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" defaultChecked className="rounded text-primary focus:ring-primary" />
                    Categorias
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" className="rounded text-primary focus:ring-primary" />
                    Marcas
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" className="rounded text-primary focus:ring-primary" />
                    Páginas de conteúdo
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <div className="p-3 bg-slate-50 border-b font-bold text-sm text-slate-700 flex items-center justify-between">
              Monte sua vitrine
            </div>
            <div className="p-4 space-y-4">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" className="rounded text-primary focus:ring-primary" />
                Lançamentos
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" className="rounded text-primary focus:ring-primary" />
                Mais pedidos
              </label>
              
              <div className="pt-2">
                <label className="flex items-center gap-2 text-sm text-slate-700 mb-2">
                  <input type="checkbox" className="rounded text-primary focus:ring-primary" />
                  Destaques
                </label>
                <div className="ml-6 space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Ordenar por</label>
                  <select className="w-full border-slate-200 rounded-md text-sm" disabled>
                    <option>Produtos em ordem alfabética</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-sm text-slate-700 mb-2">
                  <input type="checkbox" defaultChecked className="rounded text-primary focus:ring-primary" />
                  Por categoria
                </label>
                <div className="ml-6 space-y-1 mb-3">
                  <label className="text-xs font-semibold text-slate-600">Ordenar por</label>
                  <select className="w-full border-slate-200 rounded-md text-sm">
                    <option>Últimos produtos adicionados</option>
                  </select>
                </div>
                
                <div className="ml-6 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-xs text-yellow-800 font-medium mb-3">
                    Apenas categorias marcadas como Destaque serão exibidas na vitrine (limite de 10 categorias).
                  </p>
                  <Button size="sm" className="bg-[#17a2b8] hover:bg-[#138496] text-white h-8 text-xs font-bold">
                    Editar categorias
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <div className="p-3 bg-slate-50 border-b font-bold text-sm text-slate-700 flex items-center justify-between">
              Banners Promocionais
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-600 mb-4">
                Adicione e gerencie banners com links de destino (como os Mini Banners da vitrine, Full Banners, etc).
              </p>
              <a href="/admin/banners">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-bold">
                  Gerenciar Banners
                </Button>
              </a>
            </div>
          </div>

          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <div className="p-3 bg-slate-50 border-b font-bold text-sm text-slate-700 flex items-center justify-between">
              Página do produto
            </div>
            <div className="p-4 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Disposição das miniaturas do produto</label>
                <select className="w-full border-slate-200 rounded-md text-sm">
                  <option>Vertical</option>
                  <option>Horizontal</option>
                </select>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Escolha entre exibir as imagens extras do produto abaixo da imagem principal ou ao lado dela.
                </p>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Valor do produto em destaque</label>
                <select className="w-full border-slate-200 rounded-md text-sm">
                  <option>Destacar à vista</option>
                  <option>Destacar a prazo</option>
                </select>
              </div>

              <div className="border-t pt-4 space-y-3">
                <label className="flex items-start gap-2 text-sm text-slate-700">
                  <input type="checkbox" className="rounded text-primary focus:ring-primary mt-0.5" />
                  <span>Exibir a quantidade em estoque disponível para compra</span>
                </label>
                <label className="flex items-start gap-2 text-sm text-slate-700">
                  <input type="checkbox" defaultChecked className="rounded text-primary focus:ring-primary mt-0.5" />
                  <span>Exibir campo para alterar a quantidade que será adicionado ao carrinho</span>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <div className="p-3 bg-slate-50 border-b font-bold text-sm text-slate-700 flex items-center justify-between">
              Página de categoria
            </div>
            <div className="p-4 space-y-4">
              <label className="flex items-start gap-2 text-sm text-slate-700">
                <input type="checkbox" className="rounded text-primary focus:ring-primary mt-0.5" />
                <span>Exibir descrição na página de categoria no mobile</span>
              </label>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Posição da descrição da categoria no mobile</label>
                <select className="w-full border-slate-200 rounded-md text-sm">
                  <option>Cabeçalho</option>
                  <option>Rodapé</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <div className="p-3 bg-slate-50 border-b font-bold text-sm text-slate-700 flex items-center justify-between">
              Checkout
            </div>
            <div className="p-4 space-y-4">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" className="rounded text-primary focus:ring-primary" />
                Solicitar login antes de iniciar o checkout
              </label>
              
              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-md p-4 text-sm text-blue-900 mt-2">
                <p className="mb-2">
                  As opções de selecionar campos obrigatórios e envio de comentário no checkout foram movidas para <strong className="font-bold">"Configurações {'>'} Gerais"</strong>.
                </p>
                <a href="/admin/configuracoes" className="text-blue-600 font-bold hover:underline">
                  Clique aqui para acessar
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
