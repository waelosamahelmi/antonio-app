import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/language-context";
import { useRestaurantSettings, useUpdateRestaurantSettings } from "@/hooks/use-restaurant-settings";
import { useRestaurantConfig, useUpdateRestaurantConfig } from "@/hooks/use-restaurant-config";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, 
  Store, 
  Truck, 
  UtensilsCrossed,
  AlertCircle,
  Save,
  Power,
  Coffee,
  CheckCircle,
  Timer,
  Settings
} from "lucide-react";

interface RestaurantSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RestaurantSettingsModal({ isOpen, onClose }: RestaurantSettingsModalProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  // Hooks for data management
  const { data: restaurantSettings, isLoading: settingsLoading } = useRestaurantSettings();
  const { data: restaurantConfig, isLoading: configLoading } = useRestaurantConfig();
  const updateSettings = useUpdateRestaurantSettings();
  const updateConfig = useUpdateRestaurantConfig();
  
  // Local state
  const [isForceOpen, setIsForceOpen] = useState(false);
  const [specialMessage, setSpecialMessage] = useState("");
  const [autoAcceptEnabled, setAutoAcceptEnabled] = useState(false);
  const [autoAcceptDeliveryTime, setAutoAcceptDeliveryTime] = useState("30");
  const [autoAcceptPickupTime, setAutoAcceptPickupTime] = useState("15");

  // Load settings when modal opens
  useEffect(() => {
    if (isOpen && restaurantSettings) {
      setIsForceOpen(restaurantSettings.isOpen ?? false);
      setSpecialMessage(restaurantSettings.specialMessage ?? "");
    }
  }, [isOpen, restaurantSettings]);

  // Load auto-accept settings from localStorage (legacy support)
  useEffect(() => {
    if (isOpen) {
      const savedSettings = localStorage.getItem('restaurantSettings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          setAutoAcceptEnabled(settings.autoAcceptEnabled ?? false);
          setAutoAcceptDeliveryTime(settings.autoAcceptDeliveryTime?.toString() ?? "30");
          setAutoAcceptPickupTime(settings.autoAcceptPickupTime?.toString() ?? "15");
        } catch (error) {
          console.error('Error loading auto-accept settings:', error);
        }
      }
    }
  }, [isOpen]);

  const handleSave = async () => {
    try {
      // Save restaurant settings to database
      await updateSettings.mutateAsync({
        isOpen: isForceOpen,
        specialMessage: specialMessage,
        openingHours: "Managed via Site Configuration",
        pickupHours: "Managed via Site Configuration", 
        deliveryHours: "Managed via Site Configuration",
        lunchBuffetHours: "Managed via Site Configuration",
      });

      // Save auto-accept settings to localStorage (legacy)
      const autoAcceptSettings = {
        autoAcceptEnabled,
        autoAcceptDeliveryTime: parseInt(autoAcceptDeliveryTime),
        autoAcceptPickupTime: parseInt(autoAcceptPickupTime),
      };
      localStorage.setItem('restaurantSettings', JSON.stringify({
        ...autoAcceptSettings,
        isOpen: isForceOpen,
        specialMessage: specialMessage,
      }));

      toast({
        title: t("Asetukset tallennettu", "Settings Saved"),
        description: t("pizzerian asetukset on päivitetty onnistuneesti", "Restaurant settings have been updated successfully"),
      });

      onClose();
    } catch (error) {
      console.error('Error saving restaurant settings:', error);
      toast({
        title: t("Virhe", "Error"),
        description: t("Asetusten tallentaminen epäonnistui", "Failed to save settings"),
        variant: "destructive",
      });
    }
  };

  // Determine current status based on force open and hours
  const getCurrentStatus = () => {
    if (isForceOpen) return "open";
    
    // If we have config hours, check them
    if (restaurantConfig?.hours?.general) {
      const now = new Date();
      const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      
      const dayHours = restaurantConfig.hours.general[currentDay];
      if (dayHours && !dayHours.closed) {
        if (currentTime >= dayHours.open && currentTime <= dayHours.close) {
          return "open";
        }
      }
    }
    
    return "closed";
  };

  const status = getCurrentStatus();

  if (settingsLoading || configLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>{t("pizzerian tiedot", "Restaurant Info")}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>{t("pizzerian tiedot", "Restaurant Info")}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Restaurant Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Power className="w-5 h-5" />
                <span>{t("pizzerian tila", "Restaurant Status")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge 
                    variant={status === "open" ? "default" : "secondary"}
                    className={status === "open" ? "bg-green-500" : "bg-red-500"}
                  >
                    {status === "open" ? t("AVOINNA", "OPEN") : t("SULJETTU", "CLOSED")}
                  </Badge>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={isForceOpen}
                      onCheckedChange={setIsForceOpen}
                    />
                    <Label>{t("Pakota auki (ohittaa aukioloajat)", "Force Open (Override Hours)")}</Label>
                  </div>
                </div>
                {!isForceOpen && (
                  <div className="text-sm text-gray-600">
                    {t("Aukioloaikojen mukaan", "Following scheduled hours")}
                  </div>
                )}
                {isForceOpen && (
                  <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    {t("pizzeria on pakotettu auki aukioloajoista riippumatta", "Restaurant is forced open regardless of scheduled hours")}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Hours Management Note */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-medium text-blue-900">{t("Aukioloaikojen hallinta", "Hours Management")}</h4>
                  <p className="text-sm text-blue-700">
                    {t(
                      "Aukioloajat määritellään nyt 'Sivuston asetukset' -osiossa. Siellä voit asettaa erilliset ajat yleisille aukioloajoille, noudolle ja toimitukselle.",
                      "Opening hours are now managed in the 'Site Configuration' section. There you can set separate hours for general, pickup, and delivery services."
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Special Message */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span>{t("Erityisviesti", "Special Message")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={specialMessage}
                onChange={(e) => setSpecialMessage(e.target.value)}
                placeholder={t("Kirjoita erityisviesti asiakkaille...", "Write a special message for customers...")}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Auto-Accept Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>{t("Automaattinen hyväksyntä", "Auto-Accept Orders")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">{t("Ota käyttöön automaattinen hyväksyntä", "Enable automatic order acceptance")}</Label>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {t("Kaikki uudet tilaukset hyväksytään automaattisesti ja tulostetaan", "All new orders will be automatically accepted and printed")}
                  </div>
                </div>
                <Switch checked={autoAcceptEnabled} onCheckedChange={setAutoAcceptEnabled} />
              </div>
              
              {autoAcceptEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label className="flex items-center space-x-2">
                      <Truck className="w-4 h-4" />
                      <span>{t("Kotiinkuljetus (min)", "Delivery Time (min)")}</span>
                    </Label>
                    <Select value={autoAcceptDeliveryTime} onValueChange={setAutoAcceptDeliveryTime}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 min</SelectItem>
                        <SelectItem value="20">20 min</SelectItem>
                        <SelectItem value="25">25 min</SelectItem>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="35">35 min</SelectItem>
                        <SelectItem value="40">40 min</SelectItem>
                        <SelectItem value="45">45 min</SelectItem>
                        <SelectItem value="50">50 min</SelectItem>
                        <SelectItem value="60">60 min</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="flex items-center space-x-2">
                      <UtensilsCrossed className="w-4 h-4" />
                      <span>{t("Nouto (min)", "Pickup Time (min)")}</span>
                    </Label>
                    <Select value={autoAcceptPickupTime} onValueChange={setAutoAcceptPickupTime}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 min</SelectItem>
                        <SelectItem value="15">15 min</SelectItem>
                        <SelectItem value="20">20 min</SelectItem>
                        <SelectItem value="25">25 min</SelectItem>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="35">35 min</SelectItem>
                        <SelectItem value="40">40 min</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              {t("Peruuta", "Cancel")}
            </Button>
            <Button onClick={handleSave} disabled={updateSettings.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {updateSettings.isPending ? t("Tallennetaan...", "Saving...") : t("Tallenna asetukset", "Save Settings")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}