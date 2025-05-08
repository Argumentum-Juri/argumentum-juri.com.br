
import { PetitionStatus } from "@/types/enums";

export interface PetitionSearchParams {
  page: number;
  limit: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortDirection: 'asc' | 'desc';
}
