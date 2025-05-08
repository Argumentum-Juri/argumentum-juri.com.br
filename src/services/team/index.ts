
import { Team, TeamMember, TeamInvite } from './types';
import { 
  createTeam, 
  getTeamById, 
  updateTeam, 
  deleteTeam, 
  getMyTeams 
} from './teamOperations';
import { getTeamMembers } from './memberOperations';
import { 
  inviteToTeam, 
  getMyInvites, 
  respondToInvite 
} from './inviteOperations';
import { handleUserRegistration } from './userRegistrationService';

// Export all types and functions
// Use export type for TypeScript types
export type { Team, TeamMember, TeamInvite };
  
// Export functions directly
export {
  // Team operations
  createTeam,
  getTeamById,
  updateTeam,
  deleteTeam,
  getMyTeams,
  
  // Team member operations
  getTeamMembers,
  
  // Invite operations
  inviteToTeam,
  getMyInvites,
  respondToInvite,
  
  // User registration
  handleUserRegistration
};

// Export as a service object for backward compatibility
export const teamService = {
  createTeam,
  getTeamById,
  updateTeam,
  deleteTeam,
  getMyTeams,
  getTeamMembers,
  inviteToTeam,
  getMyInvites,
  respondToInvite,
  handleUserRegistration
};
