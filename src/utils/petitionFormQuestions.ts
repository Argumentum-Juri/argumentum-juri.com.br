
import { Question } from '@/types/petition-form';
import { 
  brazilianStates,
  simNaoOptions, 
  typesWithExistingProcess,
  legal_area,
  petition_type,
  stateCities,
  initial_type,
  pedidos_cumulados,
  selecao_preliminares,
  selecao_prejudiciais
} from '@/components/petition-form/QuestionOptions';



  // --- Questões ---
export const allPossibleQuestions: Question[] = [
  // --- Dados da Solicitação ---
  {
    id: 'title', type: 'text', field: 'title', 
    question: 'Atribua um título para sua petição?', required: true,
    validation: (value) => !value ? 'O título é obrigatório' : null
  },
  {
    id: 'legal_area', type: 'select', field: 'legal_area', 
    question: 'Qual a área legal da sua petição?', required: true,
    options: legal_area,
    validation: (value) => !value ? 'A área legal é obrigatória' : null
  },
  {
    id: 'petition_type', type: 'select', field: 'petition_type', 
    question: 'Qual o tipo de petição?', required: true,
    options: petition_type,
    validation: (value) => !value ? 'O tipo de petição é obrigatório' : null
  },


  // --- Dados do Processo ---
 
  { // Inicial
    id: 'competencia', type: 'text', field: 'competencia',
    question: 'Para qual tribunal ou vara o caso será enviado?', required: true,
    condition: (ans) => ans['petition_type'] === 'inicial',
    validation: (value, ans) => ans['petition_type'] === 'inicial' && !value ? 'A competência é obrigatória' : null
  },
  { // Inicial
    id: 'uf_distribuicao', type: 'combobox', field: 'uf_distribuicao',
    question: 'Em qual estado (UF) a ação será distribuída?', required: true,
    options: brazilianStates,
    allowCustomValues: false, // Não permite valores personalizados para estados
    condition: (ans) => ans['petition_type'] === 'inicial',
    validation: (value, ans) => ans['petition_type'] === 'inicial' && !value ? 'O estado (UF) é obrigatório' : null
  },
  { // Inicial
    id: 'cidade_distribuicao', type: 'combobox', field: 'cidade_distribuicao',
    options: stateCities,
    dynamicOptions: true, // Indica que as opções serão carregadas dinamicamente
    allowCustomValues: false, // Não permite valores personalizados para cidades
    question: 'Qual a cidade nesse estado?', required: true,
    condition: (ans) => ans['petition_type'] === 'inicial',
    validation: (value, ans) => ans['petition_type'] === 'inicial' && !value ? 'A cidade é obrigatória' : null
  },
  { // Manifestação, Recursos, Contrarrazoes
    id: 'data_publicacao', type: 'date', field: 'data_publicacao', // Use date picker if possible
    question: 'Qual data ocorreu a publicação do processo?', required: true,
    condition: (ans) => ['manifestacao', 'recursos', 'contrarrazoes'].includes(ans['petition_type']),
    validation: (value, ans) => ['manifestacao', 'recursos', 'contrarrazoes'].includes(ans['petition_type']) && !value ? 'A data da publicação é obrigatória' : null // Add date validation if needed
  },
  { // Contestação
    id: 'houve_citacao', type: 'select', field: 'houve_citacao',
    question: 'Houve citação válida do réu?', required: true,
    options: simNaoOptions,
    condition: (ans) => ans['petition_type'] === 'contestacao',
    validation: (value, ans) => ans['petition_type'] === 'contestacao' && value === undefined ? 'Informe se houve citação válida' : null
  },
  { // Contestação
    id: 'data_citacao', type: 'date', field: 'data_citacao', // Use date picker if possible
    question: 'Qual a data da juntada do mandado/aviso de citação aos autos?', required: true,
    condition: (ans) => ans['petition_type'] === 'contestacao' && ans['houve_citacao'] === true,
    validation: (value, ans) => ans['petition_type'] === 'contestacao' && ans['houve_citacao'] === true && !value ? 'A data da juntada da citação é obrigatória' : null
  },
  { // Contestação, Manifestação, Recursos, Contrarrazoes
    id: 'process_number', type: 'text', field: 'process_number', 
    question: 'Qual o número do processo?', required: true,
    condition: (ans) => typesWithExistingProcess.includes(ans['petition_type']),
    validation: (value, ans) => typesWithExistingProcess.includes(ans['petition_type']) && !value ? 'O número do processo é obrigatório' : null
  },
  { // Inicial, Manifestação, Recursos, Contrarrazoes
    id: 'justica_gratuita', type: 'select', field: 'justica_gratuita',
    question: 'Será necessário solicitar justiça gratuita (isenção de custos) neste processo?', required: true, 
    options: simNaoOptions,
    condition: (ans) => ['inicial', 'manifestacao', 'recursos', 'contrarrazoes'].includes(ans['petition_type']),
    validation: (value, ans) => ['inicial', 'manifestacao', 'recursos', 'contrarrazoes'].includes(ans['petition_type']) && value === undefined ? 'Informe se necessita de justiça gratuita' : null
  },


  // --- Partes no Processo ---
  { // Todos os Tipos
    id: 'partes_processuais', type: 'multiEntry', field: 'partes_processuais',
    question: 'Quem são as partes no processo? (Liste Nome, Tipo de Parte - Autor/Réu, e se é a parte que você representa)', required: true,
    condition: (ans) => ['inicial', 'contestacao', 'manifestacao', 'recursos', 'contrarrazoes'].includes(ans['petition_type']),
    validation: (value, ans) => ['inicial', 'contestacao', 'manifestacao', 'recursos', 'contrarrazoes'].includes(ans['petition_type']) && !value ? 'A identificação das partes é obrigatória' : null
  },


  // --- Informações sobre o caso ---
  { // Inicial
    id: 'tipo_acao_detalhado', type: 'combobox', field: 'tipo_acao_detalhado',
    question: 'Qual é o tipo de ação que deseja a elaboração?', required: true,
    options: initial_type,
    allowCustomValues: true, // Permite valores personalizados
    condition: (ans) => ans['petition_type'] === 'inicial',
    validation: (value, ans) => ans['petition_type'] === 'inicial' && !value ? 'O tipo da ação é obrigatório' : null
  },
  { // Manifestação
    id: 'manifestacao_tipo_especifico', type: 'text', field: 'tipo_manifestacao_especifica',
    question: 'Qual o tipo específico de manifestação que deseja elaborar? (Ex: Réplica, Sobre provas, Embargos de Declaração)', required: true,
    condition: (ans) => ans['petition_type'] === 'manifestacao',
    validation: (value, ans) => ans['petition_type'] === 'manifestacao' && !value ? 'Especifique o tipo de manifestação' : null
  },
  { // Recurso
    id: 'recurso_tipo_especifico', type: 'text', field: 'tipo_recurso_especifica',
    question: 'Qual o tipo específico de recurso que deseja elaborar?', required: true,
    condition: (ans) => ans['petition_type'] === 'recursos',
    validation: (value, ans) => ans['petition_type'] === 'recursos' && !value ? 'Especifique o tipo de recurso' : null
  },
  { // Contrarrazao
    id: 'contrarrazao_tipo_especifico', type: 'text', field: 'tipo_contrarrazao_especifica',
    question: 'Qual o tipo específico de contrarrazão que deseja elaborar?', required: true,
    condition: (ans) => ans['petition_type'] === 'contrarrazoes',
    validation: (value, ans) => ans['petition_type'] === 'contrarrazoes' && !value ? 'Especifique o tipo de contrarrazão' : null
  },
  { // Inicial
    id: 'tem_pedidos_cumulados', type: 'select', field: 'tem_pedidos_cumulados',
    question: 'Tem pedido cumulado?', required: true,
    options: simNaoOptions,
    condition: (ans) => ans['petition_type'] === 'inicial',
    validation: (value, ans) => ans['petition_type'] === 'inicial' && value === undefined ? 'Informe se há pedidos cumulados' : null
  },
  { // Inicial
    id: 'selecao_pedidos_cumulados', 
    type: 'combobox', 
    field: 'selecao_pedidos_cumulados',
    question: 'Selecione os pedidos cumulados', 
    required: true,
    multiple: true, // Habilitando seleção múltipla
    options: pedidos_cumulados,
    allowCustomValues: true, // Permite valores personalizados
    condition: (ans) => ans['petition_type'] === 'inicial' && ans['tem_pedidos_cumulados'] === true,
    validation: (value, ans) => ans['petition_type'] === 'inicial' && ans['tem_pedidos_cumulados'] === true && (!value || (Array.isArray(value) && value.length === 0)) ? 'A seleção dos pedidos cumulados é obrigatória' : null
  },
  { // Inicial
    id: 'relato_fatos', type: 'textarea', field: 'relato_fatos',
    question: 'Poderia me contar um resumo do caso?', required: true,
    condition: (ans) => ans['petition_type'] === 'inicial',
    validation: (value, ans) => ans['petition_type'] === 'inicial' && !value ? 'O relato dos fatos é obrigatório' : null
  },
  { // Contestação
    id: 'relato_caso_reu', type: 'textarea', field: 'relato_caso_reu',
    question: 'Qual a versão do réu sobre os fatos alegados pelo autor?', required: true,
    condition: (ans) => ans['petition_type'] === 'contestacao',
    validation: (value, ans) => ans['petition_type'] === 'contestacao' && !value ? 'O relato do caso pelo réu é obrigatório' : null
  },
  { // Manifestação
    id: 'manifestacao_resumo_processo', type: 'textarea', field: 'resumo_processo_manifestacao',
    question: 'Do que se trata o processo resumidamente e qual o ponto a ser manifestado?', required: true,
    condition: (ans) => ans['petition_type'] === 'manifestacao',
    validation: (value, ans) => ans['petition_type'] === 'manifestacao' && !value ? 'O resumo do processo/ponto a manifestar é obrigatório' : null
  },
  { // Recurso
    id: 'recurso_resumo_processo', type: 'textarea', field: 'resumo_processo_recurso',
    question: 'Do que se trata o processo?', required: true,
    condition: (ans) => ans['petition_type'] === 'recursos',
    validation: (value, ans) => ans['petition_type'] === 'recursos' && !value ? 'O resumo do processo/ponto é obrigatório' : null
  },
  { // Contrarrazao
    id: 'contrarrazao_resumo_processo', type: 'textarea', field: 'resumo_processo_contrarrazao',
    question: 'Nos conte um pouco sobre o caso!', required: true,
    condition: (ans) => ans['petition_type'] === 'contrarrazoes',
    validation: (value, ans) => ans['petition_type'] === 'contrarrazoes' && !value ? 'O resumo do processo/ponto é obrigatório' : null
  },
  { // Contestação
    id: 'tem_preliminares', type: 'select', field: 'tem_preliminares',
    question: 'Existem preliminares a serem arguidas (Ex: incompetência, inépcia da inicial)?', required: true,
    options: simNaoOptions,
    condition: (ans) => ans['petition_type'] === 'contestacao',
    validation: (value, ans) => ans['petition_type'] === 'contestacao' && value === undefined ? 'Informe sobre as preliminares' : null
  },
  { // Contestação
    id: 'selecao_preliminares', type: 'combobox', field: 'selecao_preliminares',
    question: 'Quais preliminares serão arguidas?', required: true,
    options: selecao_preliminares,
    allowCustomValues: true, // Permite valores personalizados
    condition: (ans) => ans['petition_type'] === 'contestacao' && ans['tem_preliminares'] === true,
    validation: (value, ans) => ans['petition_type'] === 'contestacao' && ans['tem_preliminares'] === true && !value ? 'A descrição das preliminares é obrigatória' : null
  },
  { // Contestação
    id: 'tem_prejudiciais', type: 'select', field: 'tem_prejudiciais',
    question: 'Existem prejudiciais de mérito a serem arguidas (Ex: prescrição, decadência)?', required: true,
    options: simNaoOptions,
    condition: (ans) => ans['petition_type'] === 'contestacao',
    validation: (value, ans) => ans['petition_type'] === 'contestacao' && value === undefined ? 'Informe sobre as prejudiciais de mérito' : null
  },
  { // Contestação
    id: 'selecao_prejudiciais', type: 'combobox', field: 'selecao_prejudiciais',
    question: 'Quais prejudiciais de mérito serão arguidas?', required: true,
    options: selecao_prejudiciais,
    allowCustomValues: true, // Permite valores personalizados
    condition: (ans) => ans['petition_type'] === 'contestacao' && ans['tem_prejudiciais'] === true,
    validation: (value, ans) => ans['petition_type'] === 'contestacao' && ans['tem_prejudiciais'] === true && !value ? 'A descrição das prejudiciais é obrigatória' : null
  },
  { // Todos os Tipos
    id: 'topicos_essenciais', type: 'textarea', field: 'topicos_essenciais',
    question: 'Quais são os pontos ou tópicos principais essenciais para incluir na petição?', required: true,
    condition: (ans) => ['inicial', 'contestacao', 'manifestacao', 'recursos', 'contrarrazoes'].includes(ans['petition_type']),
    validation: (value, ans) => ['inicial', 'contestacao', 'manifestacao', 'recursos', 'contrarrazoes'].includes(ans['petition_type']) && !value ? 'A indicação dos tópicos é obrigatória' : null
  },
  { // Todos os Tipos
    id: 'requer_tutela_urgencia', type: 'select', field: 'requer_tutela_urgencia',
    question: 'Será necessário pedir alguma tutela de urgência (liminar)?', required: true,
    options: simNaoOptions,
    condition: (ans) => ['inicial', 'contestacao', 'manifestacao', 'recursos', 'contrarrazoes'].includes(ans['petition_type']),
    validation: (value, ans) => ['inicial', 'contestacao', 'manifestacao', 'recursos', 'contrarrazoes'].includes(ans['petition_type']) && value === undefined ? 'Informe se necessita de tutela de urgência' : null
  },
  { // Todos os Tipos
    id: 'pedido_tutela_urgencia', type: 'textarea', field: 'pedido_tutela_urgencia',
    question: 'Qual seria exatamente o pedido de tutela de urgência?', required: true,
    condition: (ans) => ['inicial', 'contestacao', 'manifestacao', 'recursos', 'contrarrazoes'].includes(ans['petition_type']) && ans['requer_tutela_urgencia'] === true,
    validation: (value, ans) => (['inicial', 'contestacao', 'manifestacao', 'recursos', 'contrarrazoes'].includes(ans['petition_type']) && ans['requer_tutela_urgencia'] === true && !value) ? 'O pedido de tutela de urgência é obrigatório' : null
  },
  { // Contestação
    id: 'tem_reconvencao', type: 'select', field: 'tem_reconvencao',
    question: 'Haverá pedido de reconvenção ou pedido contraposto?', required: true,
    options: simNaoOptions,
    condition: (ans) => ans['petition_type'] === 'contestacao',
    validation: (value, ans) => ans['petition_type'] === 'contestacao' && value === undefined ? 'Informe sobre reconvenção/pedido contraposto' : null
  },
  { // Contestação
    id: 'detalhes_reconvencao', type: 'textarea', field: 'detalhes_reconvencao',
    question: 'Quais são os pedidos de reconvenção ou contraposto?', required: true,
    condition: (ans) => ans['petition_type'] === 'contestacao' && ans['tem_reconvencao'] === true,
    validation: (value, ans) => ans['petition_type'] === 'contestacao' && ans['tem_reconvencao'] === true && !value ? 'A descrição dos pedidos de reconvenção/contraposto é obrigatória' : null
  },
  { // Todos os Tipos
    id: 'advogado_subscritor', type: 'text', field: 'advogado_subscritor',
    question: 'Qual o nome completo e OAB do advogado que vai assinar a petição?', required: true,
    condition: (ans) => ['inicial', 'contestacao', 'manifestacao', 'recursos', 'contrarrazoes'].includes(ans['petition_type']),
    validation: (value, ans) => ['inicial', 'contestacao', 'manifestacao', 'recursos', 'contrarrazoes'].includes(ans['petition_type']) && !value ? 'O nome e OAB do advogado são obrigatórios' : null
  },

  
  // --- Anexos ---
  {
    id: 'attachments', type: 'file', field: 'attachments', question: 'Gostaria de adicionar algum outro anexo à sua petição?', required: false
  }
];
