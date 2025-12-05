import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, handleSupabaseError, formatSupabaseResponse } from "@/lib/supabase-client";
import { useSupabaseAuth } from "@/lib/supabase-auth-context";

// Get all promotions
export function usePromotions() {
  const { user } = useSupabaseAuth();
  
  return useQuery({
    queryKey: ["promotions"],
    queryFn: async () => {
      console.log('🎁 Fetching promotions...');
      
      const { data, error } = await supabase
        .from('promotions')
        .select(`
          *,
          categories (*),
          branches (*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to fetch promotions:', error);
        handleSupabaseError(error);
      }

      console.log('✅ Promotions fetched:', data?.length || 0);
      return formatSupabaseResponse(data) || [];
    },
    enabled: !!user,
  });
}

// Get active promotions
export function useActivePromotions(categoryId?: number, branchId?: number) {
  const { user } = useSupabaseAuth();
  
  return useQuery({
    queryKey: ["active-promotions", categoryId, branchId],
    queryFn: async () => {
      console.log('🎁 Fetching active promotions...', { categoryId, branchId });
      
      let query = supabase
        .from('promotions')
        .select(`
          *,
          categories (*),
          branches (*)
        `)
        .eq('is_active', true)
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString());

      if (categoryId) {
        query = query.or(`category_id.is.null,category_id.eq.${categoryId}`);
      }

      if (branchId) {
        query = query.or(`branch_id.is.null,branch_id.eq.${branchId}`);
      }

      const { data, error } = await query.order('discount_value', { ascending: false });

      if (error) {
        console.error('❌ Failed to fetch active promotions:', error);
        handleSupabaseError(error);
      }

      console.log('✅ Active promotions fetched:', data?.length || 0);
      return formatSupabaseResponse(data) || [];
    },
    enabled: !!user,
  });
}

// Create promotion
export function useCreatePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      console.log('➕ Creating promotion:', data);
      
      const { data: result, error } = await supabase
        .from('promotions')
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to create promotion:', error);
        handleSupabaseError(error);
      }

      console.log('✅ Promotion created:', result);
      return formatSupabaseResponse(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      queryClient.invalidateQueries({ queryKey: ["active-promotions"] });
    },
  });
}

// Update promotion
export function useUpdatePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      console.log('✏️ Updating promotion:', id, data);
      
      const { data: result, error } = await supabase
        .from('promotions')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to update promotion:', error);
        handleSupabaseError(error);
      }

      console.log('✅ Promotion updated:', result);
      return formatSupabaseResponse(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      queryClient.invalidateQueries({ queryKey: ["active-promotions"] });
    },
  });
}

// Delete promotion
export function useDeletePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      console.log('🗑️ Deleting promotion:', id);
      
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Failed to delete promotion:', error);
        handleSupabaseError(error);
      }

      console.log('✅ Promotion deleted');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      queryClient.invalidateQueries({ queryKey: ["active-promotions"] });
    },
  });
}

// Toggle promotion active status
export function useTogglePromotionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      console.log('🔄 Toggling promotion status:', id, isActive);
      
      const { data, error } = await supabase
        .from('promotions')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to toggle promotion status:', error);
        handleSupabaseError(error);
      }

      console.log('✅ Promotion status toggled');
      return formatSupabaseResponse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      queryClient.invalidateQueries({ queryKey: ["active-promotions"] });
    },
  });
}
