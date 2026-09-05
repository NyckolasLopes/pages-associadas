import { useState, useEffect, useMemo } from "react";
import { useWaitlist, WaitlistEntry } from "@/stores/waitlist";
import { useAdmin } from "@/stores/admin";
import { 
  Clock, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Store, 
  CheckCircle2, 
  AlertCircle, 
  Package, 
  ExternalLink,
  RefreshCw,
  Eye
} from "lucide-react";
import { useAdminProducts } from "@/stores/products";
import { productImage } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const WhatsAppIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.54 1.77.828 2.796.828 3.182 0 5.768-2.587 5.768-5.766.001-3.187-2.575-5.77-5.768-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.062-2.146-.538-1.579-.654-2.593-2.259-2.67-2.364-.077-.105-.632-.841-.632-1.603s.398-1.135.539-1.288c.142-.153.31-.191.414-.191.104 0 .208.002.298.006.095.004.223-.036.349.266.13.312.443 1.077.482 1.157.039.08.065.174.013.277-.052.104-.078.169-.156.259-.078.091-.163.203-.233.272-.078.077-.16.161-.069.317.091.156.403.664.865 1.075.594.529 1.095.693 1.251.77.156.078.247.065.338-.039.091-.104.39-.455.494-.611.104-.156.208-.13.349-.078.143.052.906.427 1.062.505.156.078.26.117.298.182.039.065.039.377-.105.782z" />
    <path d="M12 1.5C6.201 1.5 1.5 6.201 1.5 12c0 1.956.536 3.791 1.474 5.371L1.5 22.5l5.289-1.388C8.309 21.996 10.098 22.5 12 22.5c5.799 0 10.5-4.701 10.5-10.5S17.799 1.5 12 1.5zm0 19.167c-1.688 0-3.256-.479-4.588-1.306l-.329-.204-3.13.821.835-3.051-.224-.356A8.835 8.835 0 0 1 3.333 12c0-4.787 3.88-8.667 8.667-8.667 4.787 0 8.667 3.88 8.667 8.667 0 4.787-3.88 8.667-8.667 8.667z" />
  </svg>
);

interface ListaEsperaTabProps {
  lojaId?: string; // Se fornecido, restringe para a loja do associado
  isGlobalAdmin?: boolean; // Se true, modo visão geral da rede
}

export function ListaEsperaTab({ lojaId, isGlobalAdmin = false }: ListaEsperaTabProps) {
  const { entries, loading, fetchEntries, updateStatus, removeEntry } = useWaitlist();
  const { pharmacies } = useAdmin();
  const { customProducts } = useAdminProducts();
  const [supabasePhotos, setSupabasePhotos] = useState<Record<string, string>>({});

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [selectedLojaFilter, setSelectedLojaFilter] = useState("Todas");
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    // Busca registros da tabela lista_espera no Supabase
    fetchEntries(lojaId);
  }, [lojaId, fetchEntries]);

  // Busca fotos de produtos faltantes diretamente no Supabase
  useEffect(() => {
    const missingIds = entries
      .filter((e) => e.produtoId && !e.produtoImagem)
      .map((e) => String(e.produtoId));

    if (missingIds.length === 0) return;

    const uniqueIds = Array.from(new Set(missingIds));
    supabase
      .from("produtos" as any)
      .select("id, nome, foto, imagem, imagens")
      .in("id", uniqueIds)
      .then(({ data }) => {
        if (data && Array.isArray(data)) {
          const map: Record<string, string> = {};
          data.forEach((p: any) => {
            const img = productImage(p);
            if (img && img !== "/produtos/sem-imagem.webp") {
              map[String(p.id)] = img;
            }
          });
          setSupabasePhotos((prev) => ({ ...prev, ...map }));
        }
      })
      .catch(() => {});
  }, [entries]);

  const getProductPhoto = (item: WaitlistEntry | null): string => {
    if (!item) return "/produtos/sem-imagem.webp";
    if (item.produtoImagem && item.produtoImagem.trim() !== "") {
      return item.produtoImagem;
    }
    if (item.produtoId && supabasePhotos[String(item.produtoId)]) {
      return supabasePhotos[String(item.produtoId)];
    }
    const matched = customProducts.find(
      (p) =>
        String(p.id) === String(item.produtoId) ||
        (p.nome && item.produtoNome && p.nome.toLowerCase() === item.produtoNome.toLowerCase())
    );
    if (matched) {
      return productImage(matched);
    }
    return productImage({ nome: item.produtoNome });
  };

  // Se for painel de loja específica ou associado logado, restringe obrigatoriamente para a loja
  const effectiveLojaId = lojaId && lojaId !== "all" ? lojaId : null;

  const filteredEntries = useMemo(() => {
    return entries.filter((item) => {
      // Filtro de loja se estiver em escopo de loja
      if (effectiveLojaId && item.lojaId !== effectiveLojaId) {
        return false;
      }

      // Filtro de loja selecionada no modo global
      if (!effectiveLojaId && selectedLojaFilter !== "Todas" && item.lojaId !== selectedLojaFilter) {
        return false;
      }

      // Filtro de status
      if (statusFilter !== "Todos" && item.status !== statusFilter) {
        return false;
      }

      // Busca por texto (cliente, telefone, produto, loja)
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchCliente = item.clienteNome.toLowerCase().includes(query);
        const matchZap = item.whatsapp.replace(/\D/g, "").includes(query.replace(/\D/g, ""));
        const matchProduto = item.produtoNome.toLowerCase().includes(query);
        const matchLoja = (item.lojaNome || "").toLowerCase().includes(query);

        if (!matchCliente && !matchZap && !matchProduto && !matchLoja) {
          return false;
        }
      }

      return true;
    });
  }, [entries, effectiveLojaId, selectedLojaFilter, statusFilter, search]);

  const stats = useMemo(() => {
    const base = effectiveLojaId ? entries.filter((e) => e.lojaId === effectiveLojaId) : entries;
    return {
      total: base.length,
      pendentes: base.filter((e) => e.status === "pendente").length,
      avisados: base.filter((e) => e.status === "avisado").length,
    };
  }, [entries, effectiveLojaId]);

  const handleSendWhatsApp = (entry: WaitlistEntry) => {
    const cleanPhone = entry.whatsapp.replace(/\D/g, "");
    if (!cleanPhone) {
      toast.error("Número de telefone/WhatsApp inválido.");
      return;
    }

    const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    const store = pharmacies.find((p) => p.id === entry.lojaId);
    const storeName = entry.lojaNome || store?.nome || (store?.categoriaAssociado === 'Parceiro' ? "Loja Parceira" : "Farmácias Associadas");

    const message = `Olá, *${entry.clienteNome}*! Tudo bem?\n\n` +
      `Você se cadastrou na nossa *Lista de Espera* para o produto:\n` +
      `📦 *${entry.produtoNome}*\n` +
      `🔢 Quantidade de interesse: *${entry.quantidade || 1} unidade(s)*\n\n` +
      `Boas notícias: o produto já se encontra disponível para você na *${storeName}*!\n\n` +
      `Podemos reservar ou preparar o seu pedido?`;

    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");

    // Marca como avisado
    if (entry.status !== "avisado") {
      updateStatus(entry.id, "avisado");
      toast.success("Status atualizado para 'Avisado' no WhatsApp!");
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Data Cadastro",
      "Cliente",
      "WhatsApp",
      "Produto",
      "Quantidade",
      "Loja",
      "Status"
    ];

    const rows = filteredEntries.map((e) => [
      e.id,
      new Date(e.data).toLocaleString("pt-BR"),
      e.clienteNome,
      e.whatsapp,
      e.produtoNome,
      e.quantidade || 1,
      e.lojaNome || e.lojaId,
      e.status
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(";"), ...rows.map((r) => r.map((c) => `"${c}"`).join(";"))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `lista_espera_${effectiveLojaId || "global"}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Relatório da lista de espera exportado com sucesso!");
  };

  return (
    <div className="space-y-6">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total na Lista</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.total}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Solicitações de clientes</p>
          </div>
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Aguardando Aviso</p>
            <h3 className="text-2xl font-black text-amber-700 mt-1">{stats.pendentes}</h3>
            <p className="text-[11px] text-amber-600/80 mt-0.5">Pendentes de contato</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Avisados no WhatsApp</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">{stats.avisados}</h3>
            <p className="text-[11px] text-emerald-600/80 mt-0.5">Clientes já notificados</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar por cliente, produto, telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Filtro de Loja (Apenas no Modo Global) */}
            {!effectiveLojaId && (
              <Select value={selectedLojaFilter} onValueChange={setSelectedLojaFilter}>
                <SelectTrigger className="w-[200px] bg-slate-50 text-xs font-medium">
                  <Store className="w-3.5 h-3.5 mr-1.5 text-slate-500 shrink-0" />
                  <SelectValue placeholder="Filtrar por Loja" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Todas as Lojas</SelectItem>
                  {pharmacies.map((ph) => (
                    <SelectItem key={ph.id} value={ph.id}>
                      {ph.nome} ({ph.cidade}/{ph.uf})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Filtro de Status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] bg-slate-50 text-xs font-medium">
                <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-500 shrink-0" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos os Status</SelectItem>
                <SelectItem value="pendente">Aguardando</SelectItem>
                <SelectItem value="avisado">Avisado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchEntries(lojaId)}
              className="text-xs font-bold gap-1.5 text-slate-600"
              disabled={loading}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="text-xs font-bold gap-1.5 text-slate-600"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Tabela de Contatos da Lista de Espera */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Contato / WhatsApp</th>
                <th className="py-3.5 px-4">Produto de Interesse</th>
                <th className="py-3.5 px-4 text-center">Qtd</th>
                {!effectiveLojaId && <th className="py-3.5 px-4">Loja de Origem</th>}
                <th className="py-3.5 px-4">Data Registro</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td
                    colSpan={effectiveLojaId ? 7 : 8}
                    className="py-12 text-center text-slate-400 font-medium"
                  >
                    <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    Nenhum cliente registrado na lista de espera no momento.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div className="flex flex-col">
                        <span>{item.clienteNome}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-700">
                      <span className="font-mono text-xs font-medium bg-slate-100 px-2 py-1 rounded text-slate-800">
                        {item.whatsapp}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5 max-w-xs">
                        <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 p-0.5 shrink-0 flex items-center justify-center overflow-hidden shadow-xs">
                          <img
                            src={getProductPhoto(item)}
                            alt={item.produtoNome}
                            className="w-full h-full object-contain mix-blend-multiply"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (target.src !== "/produtos/sem-imagem.webp") {
                                target.src = "/produtos/sem-imagem.webp";
                              }
                            }}
                          />
                        </div>
                        <span className="font-medium text-slate-800 truncate" title={item.produtoNome}>
                          {item.produtoNome}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <Badge variant="outline" className="font-bold">
                        {item.quantidade || 1}
                      </Badge>
                    </td>

                    {!effectiveLojaId && (
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                          <Store className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate max-w-[180px]" title={item.lojaNome || item.lojaId}>
                            {item.lojaNome || `Loja #${item.lojaId}`}
                          </span>
                        </div>
                      </td>
                    )}

                    <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(item.data).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="py-3 px-4">
                      {item.status === "avisado" ? (
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none font-semibold text-[11px] gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Avisado
                        </Badge>
                      ) : item.status === "cancelado" ? (
                        <Badge variant="outline" className="text-slate-400 font-semibold text-[11px]">
                          Cancelado
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none font-semibold text-[11px] gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Aguardando
                        </Badge>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          onClick={() => handleSendWhatsApp(item)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 text-xs gap-1.5 shadow-sm"
                          title="Enviar mensagem no WhatsApp do cliente"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Enviar WhatsApp</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-slate-700"
                          onClick={() => setSelectedEntry(item)}
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setConfirmDeleteId(item.id)}
                          title="Excluir registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalhes da Solicitação */}
      <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <Clock className="w-5 h-5 text-primary" />
              Detalhes da Lista de Espera
            </DialogTitle>
          </DialogHeader>

          {selectedEntry && (
            <div className="space-y-4 py-3 text-sm">
              <div className="bg-slate-50 p-3 rounded-lg space-y-1.5 border">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Data da Solicitação:</span>
                  <span className="font-semibold text-slate-700">
                    {new Date(selectedEntry.data).toLocaleString("pt-BR")}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Loja Solicitada:</span>
                  <span className="font-semibold text-slate-700">
                    {selectedEntry.lojaNome || selectedEntry.lojaId}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Status:</span>
                  <span className="font-semibold capitalize text-slate-800">
                    {selectedEntry.status}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold uppercase text-slate-500">Cliente</p>
                <p className="font-semibold text-slate-800">{selectedEntry.clienteNome}</p>
                <p className="text-xs text-slate-600 font-mono">{selectedEntry.whatsapp}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold uppercase text-slate-500">Produto Indisponível</p>
                <div className="flex items-center gap-3 p-2 bg-slate-50 rounded border">
                  <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 p-0.5 shrink-0 flex items-center justify-center overflow-hidden shadow-xs">
                    <img
                      src={getProductPhoto(selectedEntry)}
                      alt={selectedEntry.produtoNome}
                      className="w-full h-full object-contain mix-blend-multiply"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src !== "/produtos/sem-imagem.webp") {
                          target.src = "/produtos/sem-imagem.webp";
                        }
                      }}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 text-xs">{selectedEntry.produtoNome}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Quantidade desejada: <strong>{selectedEntry.quantidade || 1}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {selectedEntry.mensagem && (
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase text-slate-500">Mensagem Registrada</p>
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border whitespace-pre-wrap">
                    {selectedEntry.mensagem}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs"
                  onClick={() => {
                    handleSendWhatsApp(selectedEntry);
                    setSelectedEntry(null);
                  }}
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  Chamar no WhatsApp
                </Button>
                {selectedEntry.status !== "avisado" && (
                  <Button
                    variant="outline"
                    className="text-xs font-bold"
                    onClick={() => {
                      updateStatus(selectedEntry.id, "avisado");
                      setSelectedEntry({ ...selectedEntry, status: "avisado" });
                      toast.success("Marcado como avisado!");
                    }}
                  >
                    Marcar Avisado
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmação de Exclusão */}
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        title="Excluir Registro da Lista de Espera?"
        description="Esta ação removerá este cliente da lista de espera de produtos indisponíveis."
        onConfirm={() => {
          if (confirmDeleteId) {
            removeEntry(confirmDeleteId);
            setConfirmDeleteId(null);
            toast.success("Registro removido com sucesso.");
          }
        }}
        confirmText="Sim, excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}
