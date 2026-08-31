import React from "react";
import { Loader2, Sparkles, FileSpreadsheet, Download, Upload, CheckCircle2 } from "lucide-react";

export interface MassLoadingState {
  active: boolean;
  title?: string;
  message?: string;
  submessage?: string;
  icon?: "spinner" | "spreadsheet" | "download" | "upload" | "sparkles";
  progress?: number;
}

interface MassActionLoadingOverlayProps {
  loading: MassLoadingState;
}

export function MassActionLoadingOverlay({ loading }: MassActionLoadingOverlayProps) {
  if (!loading.active) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-[99999] flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Processando ação em massa"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-200">
        
        {/* Animated Icon Ring */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping scale-110"></div>
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 relative z-10">
            {loading.icon === "spreadsheet" ? (
              <FileSpreadsheet className="h-10 w-10 animate-bounce" />
            ) : loading.icon === "download" ? (
              <Download className="h-10 w-10 animate-bounce" />
            ) : loading.icon === "upload" ? (
              <Upload className="h-10 w-10 animate-bounce" />
            ) : loading.icon === "sparkles" ? (
              <Sparkles className="h-10 w-10 animate-spin" />
            ) : (
              <Loader2 className="h-10 w-10 animate-spin" />
            )}
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-2 w-full">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            {loading.title || "Processando Ação em Massa..."}
          </h3>
          <p className="text-sm font-medium text-slate-600 leading-relaxed">
            {loading.message || "Aguarde enquanto os dados estão sendo processados e a interface HTML é renderizada."}
          </p>
          {loading.submessage && (
            <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 py-1.5 px-3 rounded-lg border border-emerald-100 mt-2">
              {loading.submessage}
            </p>
          )}
        </div>

        {/* Dynamic Progress Bar or Pulse Line */}
        <div className="w-full space-y-2">
          {typeof loading.progress === "number" ? (
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(Math.max(loading.progress, 0), 100)}%` }}
              />
            </div>
          ) : (
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500 to-transparent w-full animate-pulse h-full" />
              <div className="w-full h-full bg-emerald-500/40 animate-[indeterminate_1.5s_infinite_linear]" />
            </div>
          )}
          
          <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs font-medium pt-1">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
            <span>Renderizando alterações no catálogo... Não feche a aba.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
