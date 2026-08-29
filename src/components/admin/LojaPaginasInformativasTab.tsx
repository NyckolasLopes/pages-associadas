import React, { useState } from "react";
import { useAdmin, ContentPage, Pharmacy } from "@/stores/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Plus, Edit2, Trash2, Globe, FileText, CheckCircle2, 
  Lock, Store, Shield, HelpCircle, Navigation, Info, Eye, ExternalLink
} from "lucide-react";
import { sanitizeHtml, sanitizeText } from "@/lib/security";

interface LojaPaginasInformativasTabProps {
  lojaId: string;
}

export function LojaPaginasInformativasTab({ lojaId }: LojaPaginasInformativasTabProps) {
  const { pharmacies, updatePharmacy, contentPages: globalContentPages } = useAdmin();
  const loja = pharmacies.find((p) => p.id === lojaId);

  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingPage, setViewingPage] = useState<{ title: string; content?: string; externalUrl?: string } | null>(null);
  
  const [editingPage, setEditingPage] = useState<ContentPage>({
    id: "",
    title: "",
    slug: "",
    location: "footer",
    footerColumn: "Institucional",
    type: "text",
    content: "",
  });

  if (!loja) {
    return <div className="p-8 text-center text-slate-500">Loja não encontrada.</div>;
  }

  const customPages = loja.customPages || [];

  // Define structured specification of partner pages
  const SECTIONS = [
    {
      id: "Institucional",
      title: "Institucional",
      icon: Store,
      badge: "Sobre a Loja e a Rede",
      pages: [
        {
          id: "quem-somos",
          title: "Quem Somos",
          slug: "quem-somos",
          isIndividual: true,
          defaultContent: `<h1>Quem Somos</h1><p>Bem-vindo à ${loja.nome}! Atuamos com dedicação para levar saúde, bem-estar e o melhor atendimento farmacêutico para você e sua família.</p>`,
          description: "História e apresentação exclusiva da sua farmácia."
        },
        {
          id: "politica-de-privacidade",
          title: "Política de Privacidade",
          slug: "politica-de-privacidade",
          isIndividual: false,
          description: "Normas de privacidade e LGPD padronizadas pela rede."
        },
        {
          id: "trocas-e-devolucoes",
          title: "Trocas e Devoluções",
          slug: "trocas-e-devolucoes",
          isIndividual: false,
          description: "Política de trocas conforme Código de Defesa do Consumidor."
        },
      ]
    },
    {
      id: "Navegação",
      title: "Navegação",
      icon: Navigation,
      badge: "Exploração do Catálogo",
      pages: [
        {
          id: "mapa-site",
          title: "Mapa do Site",
          slug: "mapa-site",
          isIndividual: false,
          description: "Estrutura de links e páginas para fácil navegação."
        },
        {
          id: "todas-categorias",
          title: "Categorias",
          slug: "todas-categorias",
          isIndividual: true,
          isAutomaticLink: true,
          description: "Menu de categorias e departamentos ativos na sua loja."
        },
        {
          id: "todas-marcas",
          title: "Marcas",
          slug: "todas-marcas",
          isIndividual: false,
          isAutomaticLink: true,
          description: "Catálogo de marcas e laboratórios parceiros da rede."
        },
        ...(loja.offersServices ? [
          {
            id: "servicos-saude",
            title: "Serviços Farmacêuticos",
            slug: "servicos",
            isIndividual: true,
            isAutomaticLink: true,
            description: "Serviços clínicos presenciais praticados pela loja."
          }
        ] : [])
      ]
    },
    {
      id: "Atendimento",
      title: "Atendimento & Ajuda",
      icon: HelpCircle,
      badge: "Canais e Suporte",
      pages: [
        {
          id: "central-atendimento",
          title: "Central de Atendimento",
          slug: "central-atendimento",
          isIndividual: false,
          description: "Número e canais da central da rede."
        },
        {
          id: "whatsapp",
          title: `WhatsApp da Loja (${loja.whatsapp || loja.telefone || "Configurar"})`,
          slug: "whatsapp",
          isIndividual: true,
          isAutomaticLink: true,
          description: "Link direto para o WhatsApp oficial da sua loja."
        },
        {
          id: "como-comprar",
          title: "Como Comprar",
          slug: "como-comprar",
          isIndividual: false,
          description: "Instruções passo a passo de compra no site."
        },
        {
          id: "formas-pagamento",
          title: "Formas de Pagamento",
          slug: "formas-pagamento",
          isIndividual: false,
          description: "Meios aceitos (PIX, Cartão, Dinheiro)."
        },
        {
          id: "prazo-entrega",
          title: "Prazos e Entrega",
          slug: "prazo-entrega",
          isIndividual: false,
          description: "Informações sobre modalidades de entrega e retirada."
        },
        {
          id: "reembolso",
          title: "Política de Reembolso",
          slug: "cancelamento",
          isIndividual: true,
          defaultContent: `<h1>Política de Reembolso</h1><p>Conheça os critérios e procedimentos para estorno e reembolso de compras realizadas na ${loja.nome}.</p>`,
          description: "Regras de cancelamento e reembolso da sua unidade."
        },
        {
          id: "faq",
          title: "FAQ (Dúvidas Frequentes)",
          slug: "faq",
          isIndividual: false,
          description: "Respostas para as perguntas mais comuns dos clientes."
        }
      ]
    },
    {
      id: "Segurança",
      title: "Segurança",
      icon: Shield,
      badge: "Termos e Proteção",
      pages: [
        {
          id: "protecao-dados",
          title: "Proteção de Dados",
          slug: "protecao-dados",
          isIndividual: false,
          description: "Diretrizes de proteção e segurança da informação."
        },
        {
          id: "termos-de-uso",
          title: "Termos de Uso",
          slug: "termos-de-uso",
          isIndividual: false,
          description: "Termos e condições gerais de uso da plataforma."
        }
      ]
    }
  ];

  const handleOpenEdit = (pageDef: { id: string; title: string; slug: string; defaultContent?: string; isIndividual?: boolean }) => {
    const existingCustom = customPages.find(p => p.slug === pageDef.slug);
    if (existingCustom) {
      setEditingPage({ ...existingCustom });
    } else {
      const globalPage = globalContentPages.find(p => p.slug === pageDef.slug);
      setEditingPage({
        id: Date.now().toString(),
        title: pageDef.title,
        slug: pageDef.slug,
        location: "footer",
        footerColumn: "Institucional",
        type: "text",
        content: pageDef.defaultContent || globalPage?.content || `<h1>${pageDef.title}</h1><p>Conteúdo da página.</p>`,
      });
    }
    setModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingPage({
      id: Date.now().toString(),
      title: "",
      slug: "",
      location: "footer",
      footerColumn: "Institucional",
      type: "text",
      content: "",
    });
    setModalOpen(true);
  };

  const handleViewGlobal = (pageDef: { title: string; slug: string }) => {
    const globalPage = globalContentPages.find(p => p.slug === pageDef.slug);
    setViewingPage({
      title: pageDef.title,
      content: globalPage?.content || "<p>Conteúdo gerenciado centralmente pela rede.</p>",
      externalUrl: globalPage?.externalUrl
    });
    setViewModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingPage.title.trim() || !editingPage.slug.trim()) {
      toast.error("Título e slug são obrigatórios.");
      return;
    }

    const cleanSlug = editingPage.slug.toLowerCase().replace(/[^a-z0-9-_]/g, "");
    const updatedPage: ContentPage = {
      ...editingPage,
      slug: cleanSlug,
      title: sanitizeText(editingPage.title),
    };

    const existsIndex = customPages.findIndex(p => p.slug === cleanSlug || p.id === editingPage.id);
    let updatedCustomPages: ContentPage[];

    if (existsIndex >= 0) {
      updatedCustomPages = [...customPages];
      updatedCustomPages[existsIndex] = updatedPage;
    } else {
      updatedCustomPages = [...customPages, updatedPage];
    }

    try {
      await updatePharmacy(loja.id, {
        ...loja,
        customPages: updatedCustomPages,
      });
      toast.success("Página salva com sucesso!");
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar página.");
    }
  };

  const handleResetToDefault = async (slug: string) => {
    if (!confirm("Deseja restaurar esta página para o padrão? As alterações locais serão removidas.")) {
      return;
    }
    const updatedCustomPages = customPages.filter(p => p.slug !== slug);
    try {
      await updatePharmacy(loja.id, {
        ...loja,
        customPages: updatedCustomPages,
      });
      toast.success("Página restaurada para o padrão da rede.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao restaurar página.");
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-800">Páginas Informativas da Loja</h2>
          </div>
          <p className="text-sm text-slate-500">
            Gerencie o conteúdo institucional e informativo exibido no rodapé da sua loja parceira.
          </p>
        </div>
        <Button onClick={handleCreateNew} className="bg-emerald-600 hover:bg-emerald-700 font-bold shrink-0">
          <Plus className="w-4 h-4 mr-2" /> Criar Nova Página
        </Button>
      </div>

      {/* Info Card Explaining Network vs Individual */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex items-start gap-4">
        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
          <Info className="w-5 h-5" />
        </div>
        <div className="text-xs sm:text-sm text-slate-600 space-y-1">
          <p className="font-bold text-slate-800">Estrutura de Páginas e Diretrizes:</p>
          <p>
            • <strong className="text-emerald-700">Páginas Individuais:</strong> Você pode editar e personalizar o texto diretamente para a sua farmácia (ex: <em>Quem Somos</em> e <em>Política de Reembolso</em>).
          </p>
          <p>
            • <strong className="text-slate-700">Páginas da Rede:</strong> Políticas de privacidade, termos de uso e manuais de compra são geridos centralmente para manter conformidade jurídica e segurança em toda a plataforma.
          </p>
        </div>
      </div>

      {/* Sections List */}
      <div className="grid grid-cols-1 gap-6">
        {SECTIONS.map((sec) => (
          <div key={sec.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="bg-slate-50/80 px-6 py-4 border-b flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <sec.icon className="w-5 h-5 text-slate-700" />
                <h3 className="font-bold text-slate-800 text-base">{sec.title}</h3>
              </div>
              <Badge variant="outline" className="bg-white text-slate-600 font-medium">
                {sec.badge}
              </Badge>
            </div>

            <div className="divide-y divide-slate-100">
              {sec.pages.map((p) => {
                const hasCustom = customPages.some(cp => cp.slug === p.slug);
                return (
                  <div key={p.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 text-sm">{p.title}</span>
                        {p.isIndividual ? (
                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0 text-[11px] font-bold">
                            <Store className="w-3 h-3 mr-1" /> Individual da Loja
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-slate-600 bg-slate-100 border-0 text-[11px]">
                            <Lock className="w-3 h-3 mr-1 text-slate-400" /> Padrão da Rede
                          </Badge>
                        )}
                        {hasCustom && (
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 text-[11px]">
                            Personalizado
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {p.description} • <span className="font-mono text-slate-400">/{p.slug}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {p.isIndividual && !p.isAutomaticLink ? (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleOpenEdit(p)}
                            className="font-bold text-xs h-9 text-slate-700"
                          >
                            <Edit2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Editar Conteúdo
                          </Button>
                          {hasCustom && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleResetToDefault(p.slug)}
                              className="text-xs text-red-500 hover:text-red-700 h-9"
                              title="Restaurar padrão"
                            >
                              Restaurar
                            </Button>
                          )}
                        </>
                      ) : p.isAutomaticLink ? (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Automático da Loja
                        </span>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleViewGlobal(p)}
                          className="font-medium text-xs text-slate-600 hover:text-slate-900 h-9"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Ver da Rede
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingPage.title ? `Editar Página: ${editingPage.title}` : "Nova Página Informativa"}
            </DialogTitle>
            <DialogDescription>
              Personalize o texto que será exibido no site da sua farmácia.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título da Página</Label>
                <Input 
                  value={editingPage.title}
                  onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
                  placeholder="Ex: Quem Somos"
                />
              </div>

              <div className="space-y-2">
                <Label>Slug da URL</Label>
                <Input 
                  value={editingPage.slug}
                  onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "") })}
                  placeholder="ex: quem-somos"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Conteúdo da Página (Suporta formatação HTML / Texto)</Label>
              <Textarea 
                rows={12}
                value={editingPage.content || ""}
                onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
                className="font-mono text-sm leading-relaxed"
                placeholder="<h1>Título</h1><p>Escreva aqui o conteúdo da sua página...</p>"
              />
              <p className="text-[11px] text-slate-400">
                Você pode utilizar tags HTML como &lt;h1&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;ul&gt;, etc.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 font-bold">
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Global Page Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Lock className="w-5 h-5 text-slate-400" />
              {viewingPage?.title} (Padrão da Rede)
            </DialogTitle>
            <DialogDescription>
              Esta página é gerida de forma centralizada pela rede Farmácias Associadas.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 border rounded-xl p-5 bg-slate-50 prose prose-sm max-w-none">
            {viewingPage?.externalUrl ? (
              <div>
                <p className="text-slate-600 mb-4">Esta página redireciona para um link externo da rede:</p>
                <a 
                  href={viewingPage.externalUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 font-bold text-emerald-600 hover:underline"
                >
                  {viewingPage.externalUrl} <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <div 
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(viewingPage?.content || "") }} 
              />
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setViewModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
