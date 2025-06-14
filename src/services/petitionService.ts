
// This file serves as a re-export of petitionService for backward compatibility
import { petitionService } from './index';

// Add the default petition status to help prevent constraint violations
export const DEFAULT_PETITION_STATUS = 'draft';

export { petitionService };
export default petitionService;
