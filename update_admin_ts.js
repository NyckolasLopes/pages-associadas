const fs = require('fs');
let code = fs.readFileSync('src/stores/admin.ts', 'utf8');

const fetchReplacer = \            isVirtualStoreGenerated: !!l.status_loja_virtual,
            virtualStoreStatus: l.status_loja_virtual,
            api_key: l.api_key,
            aceitaEntrega: l.tema_cores?.aceitaEntrega ?? false,
            modeloFrete: l.tema_cores?.modeloFrete ?? 'raio',
            horarioInicioEntrega: l.tema_cores?.horarioInicioEntrega ?? '',
            horarioFimEntrega: l.tema_cores?.horarioFimEntrega ?? '',
            horarioFimEntregaRisco: l.tema_cores?.horarioFimEntregaRisco ?? '',
            tempoEntrega: l.tema_cores?.tempoEntrega ?? '',
            custoEntrega: l.tema_cores?.custoEntrega ?? 0,
            raioEntregaKm: l.tema_cores?.raioEntregaKm,
            faixasCep: l.tema_cores?.faixasCep ?? [],
            aceitaRetirada: l.tema_cores?.aceitaRetirada ?? false,
            horarioInicioRetirada: l.tema_cores?.horarioInicioRetirada ?? '',
            horarioFimRetirada: l.tema_cores?.horarioFimRetirada ?? '',
            tempoRetirada: l.tema_cores?.tempoRetirada ?? '',
            aceitaUber: l.tema_cores?.aceitaUber ?? false,
            custoUber: l.tema_cores?.custoUber ?? 0,
            aceita99: l.tema_cores?.aceita99 ?? false,
            custo99: l.tema_cores?.custo99 ?? 0,
            aceitaMotoboy: l.tema_cores?.aceitaMotoboy ?? false,
            custoMotoboy: l.tema_cores?.custoMotoboy ?? 0,
            custoEntregaExpressa: l.tema_cores?.custoEntregaExpressa ?? 0,
            raiosEntrega: l.tema_cores?.raiosEntrega ?? [],\;
code = code.replace(/            isVirtualStoreGenerated: !!l\.status_loja_virtual,\s*virtualStoreStatus: l\.status_loja_virtual,\s*api_key: l\.api_key,/g, fetchReplacer);

const updateReplacer = \          categoria_associado: p.categoriaAssociado,
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
          raiosEntrega: p.raiosEntrega,\;
code = code.replace(/          categoria_associado: p\.categoriaAssociado,\s*trabalha_com_encarte: p\.trabalhaComEncarte,/g, updateReplacer);

fs.writeFileSync('src/stores/admin.ts', code);
console.log('done');

