import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, handleSupabaseError, formatSupabaseResponse } from "@/lib/supabase-client";
import { useSupabaseAuth } from "@/lib/supabase-auth-context";

// Get restaurant settings
export function useRestaurantSettings() {
  const { user } = useSupabaseAuth();
  
  return useQuery({
    queryKey: ["restaurant-settings"],
    queryFn: async () => {
      console.log('⚙️ Fetching restaurant settings from Supabase...');
      
      const { data, error } = await supabase
        .from('restaurant_settings')
        .select('*')
        .single();

      if (error) {
        console.error('❌ Failed to fetch restaurant settings:', error);
        // Return default settings if none exist
        if (error.code === 'PGRST116') { // No rows returned
          return {
            isOpen: true,
            openingHours: "10:00-22:00",
            pickupHours: "10:00-21:30",
            deliveryHours: "11:00-21:00",
            lunchBuffetHours: "11:00-15:00",
            specialMessage: "",
            defaultPrinterId: null,
            printerAutoReconnect: true,
            printerTabSticky: true
          };
        }
        handleSupabaseError(error);
      }

      console.log('✅ Restaurant settings fetched successfully');
      return formatSupabaseResponse(data) || {};
    },
    enabled: !!user,
  });
}

// Update restaurant settings
export function useUpdateRestaurantSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settingsData: any) => {
      console.log('⚙️ Updating restaurant settings in Supabase:', settingsData);
      
      // Try to update first, if no rows exist, insert
      const { data: existingData } = await supabase
        .from('restaurant_settings')
        .select('id')
        .single();

      let result;
      if (existingData) {
        // Update existing settings
        const { data, error } = await supabase
          .from('restaurant_settings')
          .update({
            ...settingsData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id)
          .select()
          .single();
        
        if (error) {
          console.error('❌ Failed to update restaurant settings:', error);
          handleSupabaseError(error);
        }
        
        result = data;
      } else {
        // Insert new settings
        const { data, error } = await supabase
          .from('restaurant_settings')
          .insert([{
            ...settingsData,
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();
        
        if (error) {
          console.error('❌ Failed to create restaurant settings:', error);
          handleSupabaseError(error);
        }
        
        result = data;
      }

      console.log('✅ Restaurant settings updated successfully');
      return formatSupabaseResponse(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-settings"] });
    },
  });
}

// Update just printer settings
export function useUpdatePrinterSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (printerSettings: {
      defaultPrinterId?: string | null;
      printerAutoReconnect?: boolean;
      printerTabSticky?: boolean;
    }) => {
      console.log('🖨️ Updating printer settings in Supabase:', printerSettings);
      
      // Get existing settings first
      const { data: existingData } = await supabase
        .from('restaurant_settings')
        .select('*')
        .single();

      let result;
      if (existingData) {
        // Update existing settings
        const { data, error } = await supabase
          .from('restaurant_settings')
          .update({
            default_printer_id: printerSettings.defaultPrinterId,
            printer_auto_reconnect: printerSettings.printerAutoReconnect,
            printer_tab_sticky: printerSettings.printerTabSticky,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id)
          .select()
          .single();
        
        if (error) {
          console.error('❌ Failed to update printer settings:', error);
          handleSupabaseError(error);
        }
        
        result = data;
      } else {
        // Insert new settings with defaults
        const { data, error } = await supabase
          .from('restaurant_settings')
          .insert([{
            is_open: true,
            opening_hours: "10:00-22:00",
            pickup_hours: "10:00-21:30",
            delivery_hours: "11:00-21:00",
            lunch_buffet_hours: "11:00-15:00",
            special_message: "",
            default_printer_id: printerSettings.defaultPrinterId,
            printer_auto_reconnect: printerSettings.printerAutoReconnect ?? true,
            printer_tab_sticky: printerSettings.printerTabSticky ?? true,
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();
        
        if (error) {
          console.error('❌ Failed to create restaurant settings:', error);
          handleSupabaseError(error);
        }
        
        result = data;
      }

      console.log('✅ Printer settings updated successfully');
      return formatSupabaseResponse(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-settings"] });
    },
  });
}
