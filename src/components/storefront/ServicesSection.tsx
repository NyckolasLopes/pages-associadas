import { Syringe, Droplet, FlaskConical, HeartPulse, Stethoscope, Store } from "lucide-react";
import { Link } from "@tanstack/react-router";

const services = [
  { icon: Syringe, t: "Vacinas", d: "Gripe, HPV, COVID e mais" },
  { icon: Droplet, t: "Testes rápidos", d: "Glicemia, COVID, gravidez" },
  { icon: FlaskConical, t: "Manipulação", d: "Fórmulas personalizadas" },
  { icon: HeartPulse, t: "Aferição", d: "Pressão e saturação" },
  { icon: Stethoscope, t: "Atendimento", d: "Farmacêutico clínico" },
  { icon: Store, t: "Farmácias", d: "Diversas unidades perto de você" },
];

export function ServicesSection() {
  return (
    <section className="container-fa my-12">
      <div className="bg-orange-500 text-white rounded-2xl p-6 md:p-8">
        <div className="flex items-end justify-between mb-8 text-center md:text-left">
          <div className="w-full md:w-auto">
            <h2 className="text-2xl md:text-3xl font-bold">Serviços de saúde</h2>
            <p className="text-orange-100 mt-2">
              Tudo em um só lugar, na farmácia mais perto de você.
            </p>
          </div>
          <Link to="/$storeSlug/c/$slug" params={{ storeSlug: "loja-padrao", slug: "servicos-de-saude" }} className="hidden md:inline text-sm font-bold text-orange-100 hover:text-white hover:underline whitespace-nowrap">
            Ver todos →
          </Link>
        </div>
        
        <div className="flex overflow-x-auto pb-2 snap-x gap-4 scrollbar-none md:grid md:grid-cols-3 lg:grid-cols-6 md:gap-6 md:pb-0">
          {services.map((s) => (
            <button
              key={s.t}
              className="flex flex-col items-center text-center gap-2 md:gap-3 group shrink-0 snap-start w-[100px] md:w-auto"
            >
              <div className="h-12 w-12 md:h-16 md:w-16 bg-white rounded-xl flex items-center justify-center shadow-sm text-primary group-hover:scale-110 transition-transform">
                <s.icon className="h-6 w-6 md:h-8 md:w-8" />
              </div>
              <h3 className="font-bold text-xs md:text-sm">{s.t}</h3>
              <p className="text-[10px] md:text-xs text-orange-100 leading-tight">{s.d}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
