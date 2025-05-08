
// Este arquivo agora serve como um façade para o serviço petitionSettings
// Mantém a compatibilidade com código existente que usa este arquivo

import { petitionSettings } from './petition/petitionSettings';

// Exporte tanto como padrão quanto como um objeto nomeado para garantir compatibilidade
export { petitionSettings };
export default petitionSettings;
