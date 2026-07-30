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
          <Link to="/c/$slug" params={{ slug: "servicos-de-saude" }} className="hidden md:inline text-sm font-bold text-orange-100 hover:text-white hover:underline whitespace-nowrap">
            Ver todos →
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {services.map((s) => (
            <button
              key={s.t}
              className="flex flex-col items-center text-center gap-3 group"
            >
              <div className="h-16 w-16 bg-white rounded-xl flex items-center justify-center shadow-sm text-primary group-hover:scale-110 transition-transform">
                <s.icon className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-sm">{s.t}</h3>
              <p className="text-xs text-orange-100">{s.d}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
