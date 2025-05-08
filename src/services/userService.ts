
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types";

export const userService = {
  getAllUsers: async (): Promise<{ data: Profile[]; count: number }> => {
    try {
      const { data, error, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching all users:", error);
        return { data: [], count: 0 };
      }
      
      return { 
        data: data as Profile[],
        count: count || 0 
      };
    } catch (error) {
      console.error("Error in getAllUsers:", error);
      return { data: [], count: 0 };
    }
  },

  getAllNonAdminUsers: async (): Promise<{ data: Profile[]; count: number }> => {
    try {
      const { data, error, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('is_admin', false)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching non-admin users:", error);
        return { data: [], count: 0 };
      }
      
      return { 
        data: data as Profile[],
        count: count || 0 
      };
    } catch (error) {
      console.error("Error in getAllNonAdminUsers:", error);
      return { data: [], count: 0 };
    }
  },

  getUserById: async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error("Error fetching user:", error);
        return null;
      }
      
      return data as Profile;
    } catch (error) {
      console.error("Error in getUserById:", error);
      return null;
    }
  },
  
  searchUsers: async (searchTerm: string): Promise<{ data: Profile[]; count: number }> => {
    try {
      const { data, error, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,document.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error searching users:", error);
        return { data: [], count: 0 };
      }
      
      return { 
        data: data as Profile[],
        count: count || 0 
      };
    } catch (error) {
      console.error("Error in searchUsers:", error);
      return { data: [], count: 0 };
    }
  },
  
  getUserPetitions: async (userId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('petitions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
        
      if (error) {
        console.error("Error counting user petitions:", error);
        return 0;
      }
      
      return count || 0;
    } catch (error) {
      console.error("Error in getUserPetitions:", error);
      return 0;
    }
  }
};
