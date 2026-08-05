export interface ScopeSeed {
  id: string
  label: string
  text: string
}

/** Exemplos clicáveis que preenchem o campo de escopo e disparam a análise na hora. */
export const SCOPE_SEEDS: ScopeSeed[] = [
  {
    id: 'delivery',
    label: 'entregas com motos',
    text: 'Um app de entregas locais com motos. O cliente pede pelo celular, paga no app com pix ou cartão e acompanha o motoboy no mapa em tempo real. Precisa de um painel web pro lojista acompanhar pedidos e de repasse automático pros entregadores.',
  },
  {
    id: 'marketplace',
    label: 'marketplace B2B',
    text: 'Um marketplace B2B onde indústrias cadastram catálogo e distribuidores compram por atacado. Cada empresa tem vários usuários com permissões diferentes, tabela de preço negociada e integração com o ERP do cliente pra emitir nota fiscal.',
  },
  {
    id: 'fintech',
    label: 'fintech de crédito',
    text: 'Uma plataforma de crédito para pequenos lojistas. A gente puxa dados de vendas, roda um modelo de score próprio, aprova o limite e faz o desembolso. Precisa de KYC, trilha de auditoria e relatórios pro regulador.',
  },
  {
    id: 'legacy',
    label: 'migração de legado',
    text: 'Temos um sistema de gestão escolar legado em PHP, monolito de 12 anos, que precisa virar web moderno sem parar de operar. Migração por partes, mantendo as integrações atuais de boleto e o banco de dados antigo durante a transição.',
  },
]
