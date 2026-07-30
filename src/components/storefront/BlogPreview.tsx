const posts = [
  {
    cat: "Bem-estar",
    t: "Como manter a imunidade alta no inverno",
    d: "Hábitos simples e nutrientes essenciais que fortalecem o sistema imunológico.",
    img: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=70&auto=format&fit=crop",
  },
  {
    cat: "Medicamentos",
    t: "Genérico, similar e referência: qual a diferença?",
    d: "Entenda o que muda entre as três categorias e como economizar com segurança.",
    img: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&q=70&auto=format&fit=crop",
  },
  {
    cat: "Skincare",
    t: "Protetor solar: por que usar todos os dias",
    d: "Mesmo em dias nublados — guia rápido do farmacêutico para escolher o seu FPS.",
    img: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=70&auto=format&fit=crop",
  },
];

export function BlogPreview() {
  return (
    <section className="container-fa py-12">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">Saúde em pauta</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Conteúdos revisados por farmacêuticos.
          </p>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        {posts.map((p) => (
          <article
            key={p.t}
            className="group rounded-2xl overflow-hidden border bg-card hover:shadow-elevated transition"
          >
            <div className="aspect-[16/10] overflow-hidden">
              <img
                src={p.img}
                alt={p.t}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-5">
              <span className="text-[10px] font-bold uppercase tracking-wide text-accent">
                {p.cat}
              </span>
              <h3 className="font-bold mt-1 leading-snug group-hover:text-primary-dark transition">
                {p.t}
              </h3>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{p.d}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-10 flex justify-center">
        <a 
          href="https://blog.farmaciasassociadas.com.br/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-bold bg-primary text-white py-3 px-8 rounded-full hover:bg-primary-dark transition shadow-sm"
        >
          Ver todos os artigos
        </a>
      </div>
    </section>
  );
}
