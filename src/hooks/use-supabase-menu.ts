import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, handleSupabaseError, formatSupabaseResponse, convertCamelToSnake } from "@/lib/supabase-client";
import { useSupabaseAuth } from "@/lib/supabase-auth-context";

// Get all categories
export function useSupabaseCategories() {
  const { user } = useSupabaseAuth();
  
  return useQuery({
    queryKey: ["supabase-categories"],
    queryFn: async () => {
      console.log('📂 Fetching categories from Supabase...');
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        console.error('❌ Failed to fetch categories:', error);
        handleSupabaseError(error);
      }

      console.log('✅ Categories fetched successfully:', data?.length || 0, 'categories');
      return formatSupabaseResponse(data) || [];
    },
    enabled: !!user,
  });
}

// Get all menu items
export function useSupabaseMenuItems(categoryId?: number) {
  const { user } = useSupabaseAuth();
  
  return useQuery({
    queryKey: categoryId ? ["supabase-menu-items", categoryId] : ["supabase-menu-items"],
    queryFn: async () => {
      console.log('🍽️ Fetching menu items from Supabase...', categoryId ? `Category: ${categoryId}` : 'All items');
        let query = supabase
        .from('menu_items')
        .select(`
          *,
          categories (*)
        `);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query.order('display_order', { ascending: true });

      if (error) {
        console.error('❌ Failed to fetch menu items:', error);
        handleSupabaseError(error);
      }

      console.log('✅ Menu items fetched successfully:', data?.length || 0, 'items');
      return formatSupabaseResponse(data) || [];
    },
    enabled: !!user,
  });
}

// Get all toppings
export function useSupabaseToppings(category?: string) {
  const { user } = useSupabaseAuth();
  
  return useQuery({
    queryKey: category ? ["supabase-toppings", category] : ["supabase-toppings"],
    queryFn: async () => {
      console.log('🍕 Fetching toppings from Supabase...', category ? `Category: ${category}` : 'All toppings');      let query = supabase
        .from('toppings')
        .select('*')
        .eq('is_active', true);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (error) {
        console.error('❌ Failed to fetch toppings:', error);
        handleSupabaseError(error);
      }

      console.log('✅ Toppings fetched successfully:', data?.length || 0, 'toppings');
      return formatSupabaseResponse(data) || [];
    },
    enabled: !!user,
  });
}

// Update menu item
export function useSupabaseUpdateMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      console.log('🍽️ Updating menu item in Supabase:', id, data);
      console.log('🔍 Original data keys:', Object.keys(data));
      console.log('🔍 Original data:', JSON.stringify(data, null, 2));
      
      // Define allowed fields for menu_items table
      const allowedFields = [
        'name', 'nameEn', 'description', 'descriptionEn', 'price', 
        'categoryId', 'imageUrl', 'isVegetarian', 'isVegan', 'isGlutenFree',
        'isAvailable', 'displayOrder', 'offerPrice', 'offerPercentage',
        'offerStartDate', 'offerEndDate'
      ];
      
      // Filter data to only include allowed fields
      const filteredData = Object.keys(data)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = data[key];
          return obj;
        }, {} as any);
      
      console.log('🔍 Filtered data:', JSON.stringify(filteredData, null, 2));
      
      // Convert camelCase fields to snake_case for database
      const dbData = convertCamelToSnake(filteredData);
      
      console.log('🔄 Converted data for database:', dbData);
      console.log('🔍 Converted data keys:', Object.keys(dbData));
      console.log('🔍 Converted data:', JSON.stringify(dbData, null, 2));
      
      const { data: updatedData, error } = await supabase
        .from('menu_items')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to update menu item:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        handleSupabaseError(error);
      }

      console.log('✅ Menu item updated successfully:', updatedData?.id);
      return formatSupabaseResponse(updatedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supabase-menu-items"] });
    },
  });
}

// Create menu item
export function useSupabaseCreateMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      console.log('🍽️ Creating menu item in Supabase:', data);
      
      // Define allowed fields for menu_items table
      const allowedFields = [
        'name', 'nameEn', 'description', 'descriptionEn', 'price', 
        'categoryId', 'imageUrl', 'isVegetarian', 'isVegan', 'isGlutenFree',
        'isAvailable', 'displayOrder', 'offerPrice', 'offerPercentage',
        'offerStartDate', 'offerEndDate'
      ];
      
      // Filter data to only include allowed fields
      const filteredData = Object.keys(data)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = data[key];
          return obj;
        }, {} as any);
      
      console.log('🔍 Filtered data:', JSON.stringify(filteredData, null, 2));
      
      // Convert camelCase fields to snake_case for database
      const dbData = convertCamelToSnake(filteredData);
      
      console.log('🔄 Converted data for database:', dbData);
      
      const { data: createdData, error } = await supabase
        .from('menu_items')
        .insert([dbData])
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to create menu item:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        handleSupabaseError(error);
      }

      console.log('✅ Menu item created successfully:', createdData?.id);
      return formatSupabaseResponse(createdData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supabase-menu-items"] });
    },
  });
}

// Update topping
export function useSupabaseUpdateTopping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      console.log('🍕 Updating topping in Supabase:', id, data);
      
      // Convert camelCase fields to snake_case for database
      const dbData = convertCamelToSnake(data);
      
      console.log('🔄 Converted topping data for database:', dbData);
      
      const { data: updatedData, error } = await supabase
        .from('toppings')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to update topping:', error);
        handleSupabaseError(error);
      }

      console.log('✅ Topping updated successfully:', updatedData?.id);
      return formatSupabaseResponse(updatedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supabase-toppings"] });
    },
  });
}

// Create topping
export function useSupabaseCreateTopping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      console.log('🍕 Creating topping in Supabase:', data);
      
      // Convert camelCase fields to snake_case for database
      const dbData = convertCamelToSnake(data);
      
      console.log('🔄 Converted topping data for database:', dbData);
      
      const { data: createdData, error } = await supabase
        .from('toppings')
        .insert([dbData])
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to create topping:', error);
        handleSupabaseError(error);
      }

      console.log('✅ Topping created successfully:', createdData?.id);
      return formatSupabaseResponse(createdData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supabase-toppings"] });
    },
  });
}

// Delete topping
export function useSupabaseDeleteTopping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      console.log('🍕 Deleting topping from Supabase:', id);
      
      const { error } = await supabase
        .from('toppings')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Failed to delete topping:', error);
        handleSupabaseError(error);
      }

      console.log('✅ Topping deleted successfully:', id);
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supabase-toppings"] });
    },
  });
}
