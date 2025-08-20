import { useState } from "react";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { ServiceHighlights } from "@/components/service-highlights";
import { FeaturedMenuCarousel } from "@/components/featured-menu-carousel";
import { MenuSection } from "@/components/menu-section";
import { AboutSection } from "@/components/about-section";
import { TestimonialsSection } from "@/components/testimonials-section";
import { ContactSection } from "@/components/contact-section";
import { Footer } from "@/components/footer";
import { CartModal } from "@/components/cart-modal";
import { CheckoutModal } from "@/components/checkout-modal";

export default function Home() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const handleCartOpen = () => setIsCartOpen(true);
  const handleCartClose = () => setIsCartOpen(false);
  const handleCheckoutOpen = () => setIsCheckoutOpen(true);
  const handleCheckoutClose = () => setIsCheckoutOpen(false);
  const handleBackToCart = () => {
    setIsCheckoutOpen(false);
    setIsCartOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header onCartClick={handleCartOpen} />
      <Hero />
      <ServiceHighlights />
      <FeaturedMenuCarousel />
      <MenuSection />
      <AboutSection />
      <TestimonialsSection />
      <ContactSection />
      <Footer />
      
      <CartModal
        isOpen={isCartOpen}
        onClose={handleCartClose}
        onCheckout={handleCheckoutOpen}
      />
      
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={handleCheckoutClose}
        onBack={handleBackToCart}
      />
    </div>
  );
}
