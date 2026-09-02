import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, Check, RotateCcw,
  Pill, Sparkles, Leaf, Stethoscope, Baby, Flower2, ShoppingBag, 
  HeartPulse, ShieldCheck, Eye, Smile, User, Scale, Activity, 
  BriefcaseMedical, Coffee, Thermometer, Battery, Wind, Droplets, 
  Dumbbell, Tag, Flame, Percent, Heart, Sun, Glasses, Apple, 
  Package, Brush, Footprints, Shield, Zap, Syringe, Bed, Home,
  Folder
} from "lucide-react";
import { useAdmin } from "@/stores/admin";
import { toast } from "sonner";
import type { Categoria } from "@/types";

export const AVAILABLE_MENU_ICONS = [
  { id: "pill", icon: Pill, label: "Medicamentos / Pílula", tags: "remedio farmacia comprimido saude" },
  { id: "heart-pulse", icon: HeartPulse, label: "Coração / Pulso", tags: "cardio vida saude intimo" },
  { id: "sparkles", icon: Sparkles, label: "Beleza / Dermocosméticos", tags: "pele rosto brilho cosméticos unhas maquiagem" },
  { id: "leaf", icon: Leaf, label: "Natural / Fitoterápicos", tags: "natureza verde cha ervas suplemento" },
  { id: "baby", icon: Baby, label: "Bebê / Infantil", tags: "crianca fralda mamadeira chupeta" },
  { id: "flower2", icon: Flower2, label: "Mulher / Cuidados", tags: "feminino flor ginecologia gestante" },
  { id: "user", icon: User, label: "Homem / Masculino", tags: "barba lamina urologia masculino" },
  { id: "stethoscope", icon: Stethoscope, label: "Médico / Exames", tags: "doutor hospital consulta vacina" },
  { id: "briefcase-medical", icon: BriefcaseMedical, label: "Primeiros Socorros / Maleta", tags: "curativo emergencia hospital aparelho" },
  { id: "activity", icon: Activity, label: "Atividade / Diabetes", tags: "glicose movimento corrida batimento" },
  { id: "scale", icon: Scale, label: "Balança / Emagrecimento", tags: "peso dieta termogenico fitness" },
  { id: "dumbbell", icon: Dumbbell, label: "Fitness / Suplementos", tags: "whey proteina academia treino musculo" },
  { id: "droplets", icon: Droplets, label: "Higiene / Banho", tags: "sabonete shampoo agua cabelo tintura" },
  { id: "wind", icon: Wind, label: "Desodorantes / Frescor", tags: "ar antitranspirante perfume spray" },
  { id: "smile", icon: Smile, label: "Sorriso / Odontologia", tags: "dente dental bucal pasta escova" },
  { id: "eye", icon: Eye, label: "Olhos / Colírios", tags: "visao ocular colirio oftamologia" },
  { id: "thermometer", icon: Thermometer, label: "Febre / Dor / Gripe", tags: "temperatura resfriado termometro dor" },
  { id: "battery", icon: Battery, label: "Vitaminas / Energia", tags: "multivitaminico mineral disposicao" },
  { id: "coffee", icon: Coffee, label: "Alimentos / Nutrição", tags: "bebida formula leite papinha cafe" },
  { id: "shield-check", icon: ShieldCheck, label: "Imunidade / Proteção", tags: "seguranca escudo defesa" },
  { id: "tag", icon: Tag, label: "Etiqueta / Ofertas", tags: "promocao desconto preco" },
  { id: "flame", icon: Flame, label: "Destaque / Fogo", tags: "quente novidade lancamento" },
  { id: "percent", icon: Percent, label: "Descontos / Promoções", tags: "porcentagem oferta liquida" },
  { id: "heart", icon: Heart, label: "Amor / Favoritos", tags: "coracao bem estar carinho" },
  { id: "sun", icon: Sun, label: "Solar / Verão", tags: "protetor praia bronzeador sol" },
  { id: "glasses", icon: Glasses, label: "Óculos / Leitura", tags: "acessorios sol protecao lente" },
  { id: "apple", icon: Apple, label: "Nutrição / Saudável", tags: "fruta dieta natural" },
  { id: "package", icon: Package, label: "Embalagem / Kits", tags: "caixa combo pack" },
  { id: "brush", icon: Brush, label: "Cabelos / Escovas", tags: "pente maquiagem salao" },
  { id: "footprints", icon: Footprints, label: "Pés / Podologia", tags: "palmilha calos sapato" },
  { id: "syringe", icon: Syringe, label: "Injeções / Vacinas", tags: "agulha farmaceutico aplicacao" },
  { id: "home", icon: Home, label: "Home Care / Casa", tags: "cuidados domicilio idosos" }
];

export const MENU_ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  ...AVAILABLE_MENU_ICONS.reduce((acc, curr) => {
    acc[curr.id] = curr.icon;
    return acc;
  }, {} as Record<string, any>)
};

interface CategoryMenuIconModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Categoria | null;
  lojaId?: string | null;
}

export function CategoryMenuIconModal({
  open,
  onOpenChange,
  category,
  lojaId
}: CategoryMenuIconModalProps) {
  const { 
    categoryIcons, 
    setCategoryIcon, 
    storeCategoryIcons, 
    setStoreCategoryIcon,
    pharmacies 
  } = useAdmin();

  const [selectedIcon, setSelectedIcon] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const currentStore = pharmacies.find(p => p.id === lojaId);

  useEffect(() => {
    if (open && category) {
      const currentIcon = (lojaId && storeCategoryIcons?.[lojaId]?.[category.id])
        || categoryIcons?.[category.id]
        || category.icone
        || "";
      setSelectedIcon(currentIcon);
      setSearchTerm("");
    }
  }, [open, category, lojaId, storeCategoryIcons, categoryIcons]);

  if (!category) return null;

  const filteredIcons = AVAILABLE_MENU_ICONS.filter(item => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return item.label.toLowerCase().includes(q) || item.tags.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
  });

  const SelectedIconComp = selectedIcon ? (MENU_ICON_MAP[selectedIcon] || Folder) : null;

  const handleSave = () => {
    if (lojaId) {
      setStoreCategoryIcon(lojaId, category.id, selectedIcon);
      toast.success(`Ícone de "${category.nome}" atualizado para ${currentStore?.nome || "sua loja"}!`);
    } else {
      setCategoryIcon(category.id, selectedIcon);
      toast.success(`Ícone padrão de "${category.nome}" atualizado!`);
    }
    onOpenChange(false);
  };

  const handleReset = () => {
    setSelectedIcon("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white">
        <DialogHeader className="p-5 border-b bg-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span>Alterar Ícone do Menu</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {category.nome}
                </span>
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-1">
                {lojaId ? (
                  <>Personalizando ícone para a loja <strong>{currentStore?.nome || "Loja Ativa"}</strong></>
                ) : (
                  <>Definindo ícone padrão da rede para o menu e cabeçalho</>
                )}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Live Preview Box & Search */}
        <div className="p-4 border-b bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar ícone (ex: coração, remédio)..."
              className="pl-9 h-9 bg-white text-xs border-slate-200"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <span className="text-xs font-medium text-slate-500">Prévia no Menu:</span>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00AFA9] text-white text-xs font-bold shadow-xs">
              {SelectedIconComp ? (
                <SelectedIconComp className="h-4 w-4" />
              ) : (
                <Folder className="h-4 w-4 opacity-70" />
              )}
              <span>{category.nome}</span>
            </div>
          </div>
        </div>

        {/* Icons Grid */}
        <div className="flex-1 overflow-y-auto p-5 max-h-[50vh]">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {filteredIcons.map((item) => {
              const IconComponent = item.icon;
              const isSelected = selectedIcon === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedIcon(item.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? "border-[#00AFA9] bg-[#00AFA9]/10 text-[#00AFA9] ring-2 ring-[#00AFA9]/30 shadow-xs font-bold"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="relative mb-2">
                    <IconComponent className={`h-6 w-6 ${isSelected ? "text-[#00AFA9]" : "text-slate-600"}`} />
                    {isSelected && (
                      <span className="absolute -top-1.5 -right-2 h-4 w-4 rounded-full bg-[#00AFA9] text-white flex items-center justify-center text-[10px]">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] leading-tight line-clamp-1">{item.label}</span>
                </button>
              );
            })}
          </div>

          {filteredIcons.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-xs">
              Nenhum ícone encontrado para "{searchTerm}".
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t bg-slate-50 flex items-center justify-between sm:justify-between w-full">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-slate-500 hover:text-slate-700 gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Usar Padrão
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="bg-[#00AFA9] hover:bg-[#009691] text-white font-bold text-xs px-4"
            >
              Salvar Ícone
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
