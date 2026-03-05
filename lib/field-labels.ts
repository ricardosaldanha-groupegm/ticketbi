/**
 * Descrições e opções para os campos Tipo de Entrega e Natureza.
 * Ordem: Suporte no fim; Interno apenas para BI/Admin.
 */

export const entregaTipoDescriptions: Record<string, string> = {
  BI: 'Relatórios, dashboards, análises de BI, reporte de erros',
  PHC: 'Integrações ou desenvolvimento ligado ao ERP PHC, reporte de erros',
  Salesforce: 'Integrações, dados ou desenvolvimento em Salesforce, reporte de erros',
  Automação: 'Processos automatizados, RPA, fluxos, reporte de erros',
  'Dados/Análises': 'Extração, tratamento ou análise de dados, reporte de erros',
  Suporte: 'Suporte em outras áreas não descritas nas outras opções',
  Interno: 'Trabalho interno do DSI (sem entrega direta). Apenas BI/Admin',
}

export const naturezaDescriptions: Record<string, string> = {
  Novo: 'Pedido novo, ainda não existente',
  Correção: 'Correção de erro ou bug',
  Retrabalho: 'Alteração a trabalho já entregue',
  Esclarecimento: 'Pedido de esclarecimento ou dúvida',
  Ajuste: 'Pequeno ajuste ou refinamento',
  Suporte: 'Pedido de suporte ou assistência',
  'Reunião/Discussão': 'Reunião, discussão ou alinhamento',
  Interno: 'Trabalho interno do DSI',
}

/** Ordem: BI, PHC, Salesforce, Automação, Dados/Análises, Suporte, Interno (opcional) */
const entregaTipoOrder = ['BI', 'PHC', 'Salesforce', 'Automação', 'Dados/Análises', 'Suporte', 'Interno'] as const

export function getEntregaTipoOptions(includeInterno: boolean): string[] {
  const list = [...entregaTipoOrder]
  if (!includeInterno) {
    return list.filter((v) => v !== 'Interno')
  }
  return list
}

export function getEntregaTipoTooltip(includeInterno: boolean): string {
  const opts = getEntregaTipoOptions(includeInterno)
  return opts.map((v) => `${v}: ${entregaTipoDescriptions[v] ?? v}`).join('\n')
}

export function getNaturezaTooltip(): string {
  const ordem = ['Novo', 'Correção', 'Retrabalho', 'Esclarecimento', 'Ajuste', 'Suporte', 'Reunião/Discussão', 'Interno']
  return ordem.map((v) => `${v}: ${naturezaDescriptions[v] ?? v}`).join('\n')
}
