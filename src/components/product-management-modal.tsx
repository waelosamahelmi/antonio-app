import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/language-context";
import { useCategories } from "@/hooks/use-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, Upload, Percent, Tag, Save, Trash2 } from "lucide-react";

interface MenuItem {
  id?: number;
  name: string;
  nameEn: string;
  price: string;
  categoryId: number | null;
  description: string | null;
  descriptionEn: string | null;
  imageUrl: string | null;
  isVegetarian: boolean | null;
  isVegan: boolean | null;
  isGlutenFree: boolean | null;
  isAvailable: boolean | null;
  displayOrder: number | null;
  offerPrice: string | null;
  offerPercentage: number | null;
  offerStartDate: string | null;
  offerEndDate: string | null;
}

interface ProductManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: MenuItem | null;
  onSave: (product: MenuItem) => Promise<void>;
  onDelete?: (productId: number) => Promise<void>;
}

export function ProductManagementModal({ 
  isOpen, 
  onClose, 
  product, 
  onSave, 
  onDelete 
}: ProductManagementModalProps) {
  const { t, language } = useLanguage();
  const { data: categories } = useCategories();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<MenuItem>({
    name: "",
    nameEn: "",
    price: "",
    categoryId: null,
    description: null,
    descriptionEn: null,
    imageUrl: null,
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isAvailable: true,
    displayOrder: null,
    offerPrice: null,
    offerPercentage: null,
    offerStartDate: null,
    offerEndDate: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showOfferSettings, setShowOfferSettings] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        offerPrice: product.offerPrice || null,
        offerPercentage: product.offerPercentage || null,
        offerStartDate: product.offerStartDate || null,
        offerEndDate: product.offerEndDate || null,
      });
      setShowOfferSettings(!!(product.offerPrice || product.offerPercentage));
    } else {
      setFormData({
        name: "",
        nameEn: "",
        price: "",
        categoryId: null,
        description: null,
        descriptionEn: null,
        imageUrl: null,
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: false,
        isAvailable: true,
        displayOrder: null,
        offerPrice: null,
        offerPercentage: null,
        offerStartDate: null,
        offerEndDate: null,
      });
      setShowOfferSettings(false);
    }
  }, [product, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.nameEn || !formData.price || !formData.categoryId) {
      toast({
        title: t("Virhe", "Error"),
        description: t("Täytä kaikki pakolliset kentät", "Please fill all required fields"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await onSave(formData);
      toast({
        title: t("Tallennettu", "Saved"),
        description: t("Tuote tallennettu onnistuneesti", "Product saved successfully"),
      });
      onClose();
    } catch (error) {
      toast({
        title: t("Virhe", "Error"),
        description: t("Tuotteen tallentaminen epäonnistui", "Failed to save product"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!product?.id || !onDelete) return;
    
    if (!confirm(t("Haluatko varmasti poistaa tämän tuotteen?", "Are you sure you want to delete this product?"))) {
      return;
    }

    setIsLoading(true);
    try {
      await onDelete(product.id);
      toast({
        title: t("Poistettu", "Deleted"),
        description: t("Tuote poistettu onnistuneesti", "Product deleted successfully"),
      });
      onClose();
    } catch (error) {
      toast({
        title: t("Virhe", "Error"),
        description: t("Tuotteen poistaminen epäonnistui", "Failed to delete product"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateOfferPrice = () => {
    if (!formData.price || !formData.offerPercentage) return;
    const originalPrice = parseFloat(formData.price);
    const discount = originalPrice * (formData.offerPercentage / 100);
    const offerPrice = originalPrice - discount;
    setFormData(prev => ({ ...prev, offerPrice: offerPrice.toFixed(2) }));
  };

  const calculateOfferPercentage = () => {
    if (!formData.price || !formData.offerPrice) return;
    const originalPrice = parseFloat(formData.price);
    const offerPrice = parseFloat(formData.offerPrice);
    const discount = originalPrice - offerPrice;
    const percentage = (discount / originalPrice) * 100;
    setFormData(prev => ({ ...prev, offerPercentage: Math.round(percentage) }));
  };

  const handleImageUpload = async (file: File) => {
    if (!formData.id) {
      toast({
        title: t("Virhe", "Error"),
        description: t("Tallenna tuote ensin ennen kuvan lataamista", "Save the product first before uploading an image"),
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      const response = await fetch(`/api/menu-items/${formData.id}/images`, {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      setFormData(prev => ({ 
        ...prev, 
        imageUrl: result.imageUrl 
      }));

      toast({
        title: t("Onnistui", "Success"),
        description: t("Kuva ladattu onnistuneesti", "Image uploaded successfully"),
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: t("Virhe", "Error"),
        description: t("Kuvan lataaminen epäonnistui", "Image upload failed"),
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {product ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            <span>
              {product ? 
                t("Muokkaa tuotetta", "Edit Product") : 
                t("Lisää uusi tuote", "Add New Product")
              }
            </span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold dark:text-white">
              {t("Perustiedot", "Basic Information")}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {t("Nimi (suomi)", "Name (Finnish)")} *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameEn">
                  {t("Nimi (englanti)", "Name (English)")} *
                </Label>
                <Input
                  id="nameEn"
                  value={formData.nameEn}
                  onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">
                  {t("Hinta (€)", "Price (€)")} *
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.10"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">
                  {t("Kategoria", "Category")} *
                </Label>
                <Select 
                  value={formData.categoryId?.toString() || ""} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("Valitse kategoria", "Select category")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {language === "fi" ? category.name : category.nameEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description">
                  {t("Kuvaus (suomi)", "Description (Finnish)")}
                </Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descriptionEn">
                  {t("Kuvaus (englanti)", "Description (English)")}
                </Label>
                <Textarea
                  id="descriptionEn"
                  value={formData.descriptionEn || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, descriptionEn: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">
                {t("Kuvan URL", "Image URL")}
              </Label>
              <div className="flex space-x-2">
                <Input
                  id="imageUrl"
                  value={formData.imageUrl || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploading}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <span className="w-4 h-4 animate-spin">⟳</span>
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              {formData.imageUrl && (
                <div className="mt-2">
                  <img 
                    src={formData.imageUrl} 
                    alt="Product preview" 
                    className="w-20 h-20 object-cover rounded-md border"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Dietary Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold dark:text-white">
              {t("Ruokavalio", "Dietary Information")}
            </h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="vegetarian"
                  checked={formData.isVegetarian || false}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVegetarian: checked }))}
                />
                <Label htmlFor="vegetarian">
                  {t("Kasvisruoka", "Vegetarian")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="vegan"
                  checked={formData.isVegan || false}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVegan: checked }))}
                />
                <Label htmlFor="vegan">
                  {t("Vegaaniruoka", "Vegan")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="glutenFree"
                  checked={formData.isGlutenFree || false}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isGlutenFree: checked }))}
                />
                <Label htmlFor="glutenFree">
                  {t("Gluteeniton", "Gluten Free")}
                </Label>
              </div>
            </div>
          </div>

          {/* Promotional Offers */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold dark:text-white flex items-center">
                <Tag className="w-5 h-5 mr-2" />
                {t("Tarjoukset", "Promotional Offers")}
              </h3>
              <Switch
                checked={showOfferSettings}
                onCheckedChange={setShowOfferSettings}
              />
            </div>

            {showOfferSettings && (
              <div className="space-y-4 p-4 border rounded-lg bg-orange-50 dark:bg-orange-900/20">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="offerPrice">
                      {t("Tarjoushinta (€)", "Offer Price (€)")}
                    </Label>
                    <Input
                      id="offerPrice"
                      type="number"
                      step="0.10"
                      value={formData.offerPrice || ""}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, offerPrice: e.target.value }));
                        if (e.target.value && formData.price) {
                          calculateOfferPercentage();
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="offerPercentage">
                      {t("Alennus (%)", "Discount (%)")}
                    </Label>
                    <div className="flex space-x-2">
                      <Input
                        id="offerPercentage"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.offerPercentage || ""}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, offerPercentage: parseInt(e.target.value) || null }));
                        }}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={calculateOfferPrice}
                        disabled={!formData.price || !formData.offerPercentage}
                      >
                        <Percent className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="offerStartDate">
                      {t("Tarjous alkaa", "Offer Start Date")}
                    </Label>
                    <Input
                      id="offerStartDate"
                      type="datetime-local"
                      value={formData.offerStartDate || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, offerStartDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="offerEndDate">
                      {t("Tarjous päättyy", "Offer End Date")}
                    </Label>
                    <Input
                      id="offerEndDate"
                      type="datetime-local"
                      value={formData.offerEndDate || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, offerEndDate: e.target.value }))}
                    />
                  </div>
                </div>

                {formData.offerPrice && formData.price && (
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-600 dark:text-gray-300">
                      {t("Säästö:", "Savings:")}
                    </span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                      €{(parseFloat(formData.price) - parseFloat(formData.offerPrice)).toFixed(2)}
                      {formData.offerPercentage && ` (${formData.offerPercentage}%)`}
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {!showOfferSettings && (formData.offerPrice || formData.offerPercentage) && (
              <div className="text-sm text-orange-600 dark:text-orange-400">
                {t("Tarjousasetukset poistetaan tallennettaessa", "Offer settings will be removed when saved")}
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold dark:text-white">
              {t("Asetukset", "Settings")}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="available"
                  checked={formData.isAvailable || false}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAvailable: checked }))}
                />
                <Label htmlFor="available">
                  {t("Saatavilla", "Available")}
                </Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayOrder">
                  {t("Näyttöjärjestys", "Display Order")}
                </Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || null }))}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <div>
              {product && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t("Poista", "Delete")}</span>
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                {t("Peruuta", "Cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>
                  {isLoading ? 
                    t("Tallennetaan...", "Saving...") : 
                    t("Tallenna", "Save")
                  }
                </span>
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}