
// Este arquivo agora serve como um façade para o módulo refatorado
// Mantém a compatibilidade com código existente que usa este arquivo

import { petitionService } from './petition';
export { petitionService };
export default petitionService;
