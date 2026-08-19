const fs = require('fs');

let content = fs.readFileSync('src/stores/admin.ts', 'utf8');

const regex = /addPharmacy: async \(p\) => \{[\s\S]*?\},[\s]*updatePharmacy: async \(id, p\) => \{[\s\S]*?\},[\s]*togglePharmacyStatus:/;

const newMethods = `addPharmacy: async (p) => {
        const theme_colors_payload = {
          ...(p.themeColors || {}),
          complemento: p.complemento,
          footer_plataforma_texto: p.footerPlataformaTexto,
          footer_descricao: p.footerDescricao,
          footer_titulo_contato: p.footerTituloContato,
          social_links: p.socialLinks,
          topBarText: p.topBarText,
          topBarBgColor: p.topBarBgColor,
          topBarTextColor: p.topBarTextColor,
          pageTitle: p.pageTitle,
          metaDescription: p.metaDescription,
          seoDescricao: p.seoDescricao,
          facebookPixelId: p.facebookPixelId,
          googleAnalyticsId: p.googleAnalyticsId,
          googleTagManagerId: p.googleTagManagerId,
          whatsapp: p.whatsapp,
          horario_funcionamento: p.horarioFuncionamento,
          diasFuncionamento: p.diasFuncionamento,
          farmaceutico_responsavel: p.respTecnico,
          crf: p.inscricaoFarmaceutico,
          alvara_sanitario: p.alvara,
          afe: p.afe,
          entrega_expressa: p.entregaExpressa,
          status_loja_virtual: p.virtualStoreStatus,
          categoria_associado: p.categoriaAssociado,
          trabalha_com_encarte: p.trabalhaComEncarte,
          aceitaEntrega: p.aceitaEntrega,
          modeloFrete: p.modeloFrete,
          horarioInicioEntrega: p.horarioInicioEntrega,
          horarioFimEntrega: p.horarioFimEntrega,
          horarioFimEntregaRisco: p.horarioFimEntregaRisco,
          tempoEntrega: p.tempoEntrega,
          custoEntrega: p.custoEntrega,
          raioEntregaKm: p.raioEntregaKm,
          faixasCep: p.faixasCep,
          aceitaRetirada: p.aceitaRetirada,
          horarioInicioRetirada: p.horarioInicioRetirada,
          horarioFimRetirada: p.horarioFimRetirada,
          tempoRetirada: p.tempoRetirada,
          aceitaUber: p.aceitaUber,
          custoUber: p.custoUber,
          aceita99: p.aceita99,
          custo99: p.custo99,
          aceitaMotoboy: p.aceitaMotoboy,
          custoMotoboy: p.custoMotoboy,
          custoEntregaExpressa: p.custoEntregaExpressa,
          raiosEntrega: p.raiosEntrega,
          meiosEntregaPersonalizados: p.meiosEntregaPersonalizados,
        };

        const { error } = await supabase.from('lojas').insert({
          id: p.id,
          ativa: p.ativo ?? true,
          categoria_associado: p.categoriaAssociado,
          trabalha_com_encarte: p.trabalhaComEncarte,
          cnpj: p.cnpj,
          razao_social: p.razaoSocial,
          nome_fantasia: p.nome,
          email: p.email,
          telefone: p.telefone,
          horario_funcionamento: p.horarioFuncionamento,
          farmaceutico_responsavel: p.respTecnico,
          crf: p.inscricaoFarmaceutico,
          alvara_sanitario: p.alvara,
          afe: p.afe,
          cep: p.cep,
          logradouro: p.endereco,
          numero: p.numero,
          bairro: p.bairro,
          cidade: p.cidade,
          estado: p.uf,
          whatsapp: p.whatsapp,
          theme_colors: theme_colors_payload,
          latitude: p.latitude,
          longitude: p.longitude,
          entrega_expressa: p.entregaExpressa,
          status_loja_virtual: p.virtualStoreStatus,
        } as any);

        if (error) {
          console.error("Erro ao adicionar loja:", error);
          throw new Error(error.message || "Erro ao adicionar loja no banco de dados.");
        } else {
          await get().loadPharmacies();
        }
      },
      updatePharmacy: async (id, p) => {
        const s = get();
        const currentPharmacy = s.pharmacies.find(x => x.id === id);
        const theme_colors_payload = {
          ...(currentPharmacy?.themeColors || {}),
          complemento: p.complemento,
          footer_plataforma_texto: p.footerPlataformaTexto,
          footer_descricao: p.footerDescricao,
          footer_titulo_contato: p.footerTituloContato,
          social_links: p.socialLinks,
          topBarText: p.topBarText,
          topBarBgColor: p.topBarBgColor,
          topBarTextColor: p.topBarTextColor,
          pageTitle: p.pageTitle,
          metaDescription: p.metaDescription,
          seoDescricao: p.seoDescricao,
          facebookPixelId: p.facebookPixelId,
          googleAnalyticsId: p.googleAnalyticsId,
          googleTagManagerId: p.googleTagManagerId,
          whatsapp: p.whatsapp,
          horario_funcionamento: p.horarioFuncionamento,
          diasFuncionamento: p.diasFuncionamento,
          farmaceutico_responsavel: p.respTecnico,
          crf: p.inscricaoFarmaceutico,
          alvara_sanitario: p.alvara,
          afe: p.afe,
          entrega_expressa: p.entregaExpressa,
          status_loja_virtual: p.virtualStoreStatus,
          categoria_associado: p.categoriaAssociado,
          trabalha_com_encarte: p.trabalhaComEncarte,
          aceitaEntrega: p.aceitaEntrega,
          modeloFrete: p.modeloFrete,
          horarioInicioEntrega: p.horarioInicioEntrega,
          horarioFimEntrega: p.horarioFimEntrega,
          horarioFimEntregaRisco: p.horarioFimEntregaRisco,
          tempoEntrega: p.tempoEntrega,
          custoEntrega: p.custoEntrega,
          raioEntregaKm: p.raioEntregaKm,
          faixasCep: p.faixasCep,
          aceitaRetirada: p.aceitaRetirada,
          horarioInicioRetirada: p.horarioInicioRetirada,
          horarioFimRetirada: p.horarioFimRetirada,
          tempoRetirada: p.tempoRetirada,
          aceitaUber: p.aceitaUber,
          custoUber: p.custoUber,
          aceita99: p.aceita99,
          custo99: p.custo99,
          aceitaMotoboy: p.aceitaMotoboy,
          custoMotoboy: p.custoMotoboy,
          custoEntregaExpressa: p.custoEntregaExpressa,
          raiosEntrega: p.raiosEntrega,
          meiosEntregaPersonalizados: p.meiosEntregaPersonalizados,
        };

        const { error } = await supabase.from('lojas').update({
          ativa: p.ativo ?? true,
          categoria_associado: p.categoriaAssociado,
          trabalha_com_encarte: p.trabalhaComEncarte,
          cnpj: p.cnpj,
          razao_social: p.razaoSocial,
          nome_fantasia: p.nome,
          email: p.email,
          telefone: p.telefone,
          horario_funcionamento: p.horarioFuncionamento,
          farmaceutico_responsavel: p.respTecnico,
          crf: p.inscricaoFarmaceutico,
          alvara_sanitario: p.alvara,
          afe: p.afe,
          cep: p.cep,
          logradouro: p.endereco,
          numero: p.numero,
          bairro: p.bairro,
          cidade: p.cidade,
          estado: p.uf,
          whatsapp: p.whatsapp,
          theme_colors: theme_colors_payload,
          latitude: p.latitude,
          longitude: p.longitude,
          entrega_expressa: p.entregaExpressa,
          status_loja_virtual: p.virtualStoreStatus,
        } as any).eq('id', id);

        if (error) {
          console.error("Erro ao atualizar loja:", error);
          throw new Error(error.message || "Erro ao atualizar loja no banco de dados.");
        } else {
          await get().loadPharmacies();
        }
      },
      togglePharmacyStatus:`;

if (!regex.test(content)) {
  console.log("Could not find the block to replace!");
} else {
  content = content.replace(regex, newMethods);
  fs.writeFileSync('src/stores/admin.ts', content);
  console.log("Successfully replaced the methods.");
}
