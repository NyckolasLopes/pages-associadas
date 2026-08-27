import { cn } from "@/lib/utils";

interface RadioToggleProps {
  label: string;
  value: boolean;
  onChange: (val: boolean) => void;
  className?: string;
}

export function RadioToggle({ label, value, onChange, className }: RadioToggleProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label className="text-sm font-bold text-slate-700">{label}</label>
      <div className="flex bg-slate-100 p-1 rounded-full w-fit">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
            value ? "bg-primary text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Sim
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
            !value ? "bg-slate-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Não
        </button>
      </div>
    </div>
  );
}
