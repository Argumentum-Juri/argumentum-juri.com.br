
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types";

export const adminService = {
  getAllUsers: async (): Promise<{ data: Profile[] }> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching all users:", error);
        return { data: [] };
      }
      
      return { data: data as Profile[] };
    } catch (error) {
      console.error("Error in getAllUsers:", error);
      return { data: [] };
    }
  },
  
  getAllAdminUsers: async (): Promise<{ data: Profile[] }> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_admin', true)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching admin users:", error);
        return { data: [] };
      }
      
      return { data: data as Profile[] };
    } catch (error) {
      console.error("Error in getAllAdminUsers:", error);
      return { data: [] };
    }
  },
  
  async toggleAdminStatus(userId: string, makeAdmin: boolean): Promise<boolean> {
    const { data, error } = await supabase
      .rpc("toggle_admin_status", {
        target_user_id: userId,
        set_admin: makeAdmin
      });
    
    if (error) {
      console.error("Error toggling admin status:", error);
      throw error;
    }
    
    return data;
  },
  
  async getUserPetitionSettings(userId: string): Promise<any> {
    const { data, error } = await supabase
      .from("petition_settings")
      .select("*")
      .eq("user_id", userId)
      .single();
    
    if (error) {
      console.error("Error fetching user petition settings:", error);
      return null;
    }
    
    return data;
  },
  
  async createAdminUser(email: string, password: string, name: string): Promise<{success: boolean, error?: any, userId?: string}> {
    try {
      // 1. Create the user in auth system
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            fullName: name,
          }
        }
      });

      if (signUpError || !authData.user) {
        console.error("Error creating admin user:", signUpError);
        return { success: false, error: signUpError };
      }

      // 2. Set admin status to true in profiles table
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ is_admin: true })
        .eq("id", authData.user.id);
      
      if (updateError) {
        console.error("Error setting admin status:", updateError);
        return { success: false, error: updateError };
      }
      
      return { success: true, userId: authData.user.id };
    } catch (error) {
      console.error("Unexpected error creating admin user:", error);
      return { success: false, error };
    }
  },

  async removeUser(userId: string): Promise<boolean> {
    try {
      // Obter o token de acesso do usuário atual
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session?.access_token) {
        throw new Error("Usuário não autenticado");
      }
      
      // Chamar a nossa edge function com o token de autenticação
      const response = await fetch(
        "https://mefgswdpeellvaggvttc.supabase.co/functions/v1/remove-admin",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${sessionData.session.access_token}`
          },
          body: JSON.stringify({ userId })
        }
      );
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error("Error removing user:", result);
        throw new Error(result.error || "Erro ao remover usuário");
      }
      
      return true;
    } catch (error) {
      console.error("Error removing user:", error);
      throw error;
    }
  }
};
