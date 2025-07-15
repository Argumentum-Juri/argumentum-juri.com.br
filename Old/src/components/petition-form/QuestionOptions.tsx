
export const simNaoOptions = [
    { value: true, label: 'Sim' },
    { value: false, label: 'Não' }
];
  
export const typesWithExistingProcess = ['contestacao', 'manifestacao', 'recursos', 'contrarrazoes'];

export const legal_area = [
    { value: 'civel', label: 'Cível' },
    { value: 'trabalhista', label: 'Trabalhista' },
    { value: 'previdenciaria', label: 'Previdenciária' },
    { value: 'familiar', label: 'Familiar' }
];

export const petition_type = [
    { value: 'inicial', label: 'Inicial' },
    { value: 'contestacao', label: 'Contestação' },
    { value: 'manifestacao', label: 'Manifestação' },
    { value: 'recursos', label: 'Recursos' },
    { value: 'contrarrazoes', label: 'Contrarrazões' }
];

export const initial_type = [
    { value: 'acao_cumprimento', label: 'Ação de Cumprimento' },
    { value: 'acao_obrigacao_fazer', label: 'Ação de obrigação de fazer' },
    { value: 'emenda_substitutiva_inicial', label: 'Emenda Substitutiva à Inicial' },
    { value: 'reclamacao_trabalhista', label: 'Reclamação trabalhista' }
];

export const pedidos_cumulados = [
    { value: 'dano_moral', label: 'DANO MORAL' },
    { value: 'devolucao_valores_pagos', label: 'DEVOLUÇÃO VALORES PAGOS' },
    { value: 'doenca_ocupacional', label: 'DOENÇA OCUPACIONAL' },
    { value: 'horas_extras', label: 'HORAS EXTRAS' },
    { value: 'ineficacia_inoponibilidade_beneficio', label: 'INEFICÁCIA E/OU INOPONIBILIDADE do "Benefício Social Familiar"' },
    { value: 'intervalo_intrajornada', label: 'INTERVALO INTRAJORNADA' },
    { value: 'nulidade_clausula_nao_concorrencia', label: 'nulidade de cláusula de não concorrência' },
    { value: 'suspensao_cobranca', label: 'SUSPENSÃO DA COBRANÇA' },
    { value: 'tutela_antecipada', label: 'Tutela antecipada' },
    { value: 'tutela_urgencia', label: 'Tutela de urgência' },
    { value: 'tutela_provisoria_urgencia_antecipada', label: 'Tutela Provisória de Urgência Antecipada' },
    { value: 'unicidade_contratual', label: 'Unicidade Contratual' }
];

export const selecao_preliminares = [
    { value: 'ausencia_legitimidade', label: 'Ausência de legitimidade ou de interesse processual' },
    { value: 'coisa_julgada', label: 'Coisa julgada' },
    { value: 'conexao', label: 'Conexão' },
    { value: 'convencao_arbitragem', label: 'Convenção de arbitragem' },
    { value: 'falta_caucao', label: 'Falta de caução ou de outra prestação que a lei exige como preliminar' },
    { value: 'incapacidade_parte', label: 'Incapacidade da parte, defeito de representação ou falta de autorização' },
    { value: 'incompetencia', label: 'Incompetência absoluta e relativa' },
    { value: 'incorrecao_valor_causa', label: 'Incorreção do valor da causa' },
    { value: 'indevida_concessao', label: 'Indevida concessão do benefício de gratuidade de justiça' },
    { value: 'inepcia_peticao', label: 'Inépcia da petição inicial' },
    { value: 'inexistencia_nulidade_citacao', label: 'Inexistência ou nulidade da citação' },
    { value: 'litispendencia', label: 'Litispendência' },
    { value: 'perempcao', label: 'Perempção' }
];

export const selecao_prejudiciais = [
    { value: 'decadencia', label: 'Decadência' },
    { value: 'prescricao', label: 'Prescrição' }
];

// Atualizando para usar o formato da API do IBGE (com siglas corretas)
export const brazilianStates: { value: string; label: string }[] = [
    { value: 'AC', label: 'Acre' },
    { value: 'AL', label: 'Alagoas' },
    { value: 'AP', label: 'Amapá' },
    { value: 'AM', label: 'Amazonas' },
    { value: 'BA', label: 'Bahia' },
    { value: 'CE', label: 'Ceará' },
    { value: 'DF', label: 'Distrito Federal' },
    { value: 'ES', label: 'Espírito Santo' },
    { value: 'GO', label: 'Goiás' },
    { value: 'MA', label: 'Maranhão' },
    { value: 'MT', label: 'Mato Grosso' },
    { value: 'MS', label: 'Mato Grosso do Sul' },
    { value: 'MG', label: 'Minas Gerais' },
    { value: 'PA', label: 'Pará' },
    { value: 'PB', label: 'Paraíba' },
    { value: 'PR', label: 'Paraná' },
    { value: 'PE', label: 'Pernambuco' },
    { value: 'PI', label: 'Piauí' },
    { value: 'RJ', label: 'Rio de Janeiro' },
    { value: 'RN', label: 'Rio Grande do Norte' },
    { value: 'RS', label: 'Rio Grande do Sul' },
    { value: 'RO', label: 'Rondônia' },
    { value: 'RR', label: 'Roraima' },
    { value: 'SC', label: 'Santa Catarina' },
    { value: 'SP', label: 'São Paulo' },
    { value: 'SE', label: 'Sergipe' },
    { value: 'TO', label: 'Tocantins' }
];

// Não precisamos mais desta lista estática já que buscaremos dinamicamente
export const stateCities: { value: string; label: string }[] =  [];
