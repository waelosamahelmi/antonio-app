import { db } from "./db";
import { toppings } from "@shared/schema";

export async function initializeComprehensiveToppings() {
  try {
    // Check if toppings already exist
    const existingToppings = await db.select().from(toppings).limit(1);
    if (existingToppings.length > 0) {
      console.log("Toppings already initialized");
      return;
    }

    console.log("Initializing comprehensive toppings...");

    const allToppings = [
      // Pizza Toppings
      { name: "tomaatti", nameEn: "tomato", nameAr: "طماطم", price: "1.00", category: "pizza", type: "topping", displayOrder: 1 },
      { name: "sipuli", nameEn: "onion", nameAr: "بصل", price: "1.00", category: "pizza", type: "topping", displayOrder: 2 },
      { name: "herkkusieni", nameEn: "mushroom", nameAr: "فطر", price: "1.00", category: "pizza", type: "topping", displayOrder: 3 },
      { name: "paprika", nameEn: "bell pepper", nameAr: "فلفل حلو", price: "1.00", category: "pizza", type: "topping", displayOrder: 4 },
      { name: "oliivi", nameEn: "olive", nameAr: "زيتون", price: "1.00", category: "pizza", type: "topping", displayOrder: 5 },
      { name: "ananas", nameEn: "pineapple", nameAr: "أناناس", price: "1.00", category: "pizza", type: "topping", displayOrder: 6 },
      { name: "jalapeno", nameEn: "jalapeño", nameAr: "هالابينو", price: "1.00", category: "pizza", type: "topping", displayOrder: 7 },
      { name: "jauheliha", nameEn: "ground meat", nameAr: "لحم مفروم", price: "1.00", category: "pizza", type: "topping", displayOrder: 8 },
      { name: "salami", nameEn: "salami", nameAr: "سلامي", price: "1.00", category: "pizza", type: "topping", displayOrder: 9 },
      { name: "pizzasuikale", nameEn: "ham strips", nameAr: "شرائح لحم", price: "1.00", category: "pizza", type: "topping", displayOrder: 10 },
      { name: "tonnikala", nameEn: "tuna", nameAr: "تونة", price: "1.00", category: "pizza", type: "topping", displayOrder: 11 },
      { name: "pekoni", nameEn: "bacon", nameAr: "لحم مقدد", price: "1.00", category: "pizza", type: "topping", displayOrder: 12 },
      { name: "kebabliha", nameEn: "kebab meat", nameAr: "لحم كباب", price: "1.00", category: "pizza", type: "topping", displayOrder: 13 },
      { name: "kana", nameEn: "chicken", nameAr: "دجاج", price: "1.00", category: "pizza", type: "topping", displayOrder: 14 },
      { name: "pepperonimakkara", nameEn: "pepperoni", nameAr: "بيبيروني", price: "1.00", category: "pizza", type: "topping", displayOrder: 15 },
      { name: "simpukka", nameEn: "mussel", nameAr: "بلح البحر", price: "1.00", category: "pizza", type: "topping", displayOrder: 16 },
      { name: "katkarapu", nameEn: "shrimp", nameAr: "جمبري", price: "1.00", category: "pizza", type: "topping", displayOrder: 17 },
      { name: "aurajuusto", nameEn: "blue cheese", nameAr: "جبنة زرقاء", price: "1.00", category: "pizza", type: "topping", displayOrder: 18 },
      { name: "tuplajuusto", nameEn: "extra cheese", nameAr: "جبنة إضافية", price: "1.00", category: "pizza", type: "topping", displayOrder: 19 },
      { name: "salaattijuusto", nameEn: "feta cheese", nameAr: "جبنة فيتا", price: "1.00", category: "pizza", type: "topping", displayOrder: 20 },
      { name: "mozzarellajuusto", nameEn: "mozzarella", nameAr: "موزاريلا", price: "1.00", category: "pizza", type: "topping", displayOrder: 21 },
      { name: "smetana", nameEn: "sour cream", nameAr: "كريمة حامضة", price: "1.00", category: "pizza", type: "topping", displayOrder: 22 },
      { name: "BBQ kastike", nameEn: "BBQ sauce", nameAr: "صوص باربكيو", price: "1.00", category: "pizza", type: "topping", displayOrder: 23 },
      { name: "pesto", nameEn: "pesto", nameAr: "بيستو", price: "1.00", category: "pizza", type: "topping", displayOrder: 24 },
      { name: "curry-mangokastike", nameEn: "curry-mango sauce", nameAr: "صوص كاري مانجو", price: "1.00", category: "pizza", type: "topping", displayOrder: 25 },
      
      // Pizza Extras
      { name: "Gluteeniton pizzapohja", nameEn: "Gluten-free base", nameAr: "قاعدة خالية من الجلوتين", price: "3.00", category: "pizza", type: "extra", displayOrder: 26 },
      { name: "Ruis pizzapohja", nameEn: "Rye pizza base", nameAr: "قاعدة بيتزا الجاودار", price: "2.00", category: "pizza", type: "extra", displayOrder: 27 },
      
      // Pizza Spices (free)
      { name: "Oregano", nameEn: "Oregano", nameAr: "أوريجانو", price: "0.00", category: "pizza", type: "spice", displayOrder: 28 },
      { name: "Valkosipuli", nameEn: "Garlic", nameAr: "ثوم", price: "0.00", category: "pizza", type: "spice", displayOrder: 29 },

      // Kebab Sauces (required)
      { name: "Mieto", nameEn: "Mild", nameAr: "خفيف", price: "0.00", category: "kebab", type: "sauce", isRequired: true, displayOrder: 1 },
      { name: "Keskivahva", nameEn: "Medium", nameAr: "متوسط", price: "0.00", category: "kebab", type: "sauce", isRequired: true, displayOrder: 2 },
      { name: "Vahva", nameEn: "Strong", nameAr: "قوي", price: "0.00", category: "kebab", type: "sauce", isRequired: true, displayOrder: 3 },
      { name: "Valkosipulikastike", nameEn: "Garlic sauce", nameAr: "صوص الثوم", price: "0.00", category: "kebab", type: "sauce", isRequired: true, displayOrder: 4 },
      { name: "Ei kastiketta", nameEn: "No sauce", nameAr: "بدون صوص", price: "0.00", category: "kebab", type: "sauce", isRequired: true, displayOrder: 5 },
      
      // Kebab Extras
      { name: "Tuplaliha", nameEn: "Double meat", nameAr: "لحم مضاعف", price: "3.00", category: "kebab", type: "extra", displayOrder: 6 },
      { name: "Aurajuusto", nameEn: "Blue cheese", nameAr: "جبنة زرقاء", price: "1.00", category: "kebab", type: "extra", displayOrder: 7 },
      { name: "Salaattijuusto", nameEn: "Feta cheese", nameAr: "جبنة فيتا", price: "1.00", category: "kebab", type: "extra", displayOrder: 8 },
      { name: "Ananas", nameEn: "Pineapple", nameAr: "أناناس", price: "1.00", category: "kebab", type: "extra", displayOrder: 9 },
      { name: "Jalapeno", nameEn: "Jalapeño", nameAr: "هالابينو", price: "1.00", category: "kebab", type: "extra", displayOrder: 10 },

      // Chicken Options (same as kebab)
      { name: "Tuplaliha", nameEn: "Double meat", nameAr: "لحم مضاعف", price: "3.00", category: "chicken", type: "extra", displayOrder: 1 },
      { name: "Aurajuusto", nameEn: "Blue cheese", nameAr: "جبنة زرقاء", price: "1.00", category: "chicken", type: "extra", displayOrder: 2 },
      { name: "Salaattijuusto", nameEn: "Feta cheese", nameAr: "جبنة فيتا", price: "1.00", category: "chicken", type: "extra", displayOrder: 3 },
      { name: "Ananas", nameEn: "Pineapple", nameAr: "أناناس", price: "1.00", category: "chicken", type: "extra", displayOrder: 4 },
      { name: "Jalapeno", nameEn: "Jalapeño", nameAr: "هالابينو", price: "1.00", category: "chicken", type: "extra", displayOrder: 5 },

      // Wings Sauces (required)
      { name: "Medium", nameEn: "Medium", nameAr: "متوسط", price: "0.00", category: "wings", type: "sauce", isRequired: true, displayOrder: 1 },
      { name: "Hot", nameEn: "Hot", nameAr: "حار", price: "0.00", category: "wings", type: "sauce", isRequired: true, displayOrder: 2 },
      { name: "X-hot", nameEn: "X-hot", nameAr: "حار جداً", price: "0.00", category: "wings", type: "sauce", isRequired: true, displayOrder: 3 },
      { name: "XX-hot", nameEn: "XX-hot", nameAr: "حار للغاية", price: "0.00", category: "wings", type: "sauce", isRequired: true, displayOrder: 4 },
      { name: "ei kastiketta", nameEn: "no sauce", nameAr: "بدون صوص", price: "0.00", category: "wings", type: "sauce", isRequired: true, displayOrder: 5 },

      // Burger Size (required)
      { name: "Ateria (Ranskalaiset + 0,33L)", nameEn: "Meal (Fries + 0.33L)", nameAr: "وجبة (بطاطس + ٠.٣٣ل)", price: "0.00", category: "burger", type: "size", isRequired: true, displayOrder: 1 },
      
      // Burger Drinks (required when meal)
      { name: "Coca Cola 0,33l", nameEn: "Coca Cola 0.33l", nameAr: "كوكا كولا ٠.٣٣ل", price: "0.00", category: "burger", type: "drink", isRequired: true, displayOrder: 2 },
      { name: "Coca Cola Zero 0,33l", nameEn: "Coca Cola Zero 0.33l", nameAr: "كوكا كولا زيرو ٠.٣٣ل", price: "0.00", category: "burger", type: "drink", isRequired: true, displayOrder: 3 },
      { name: "Fanta 0,33l", nameEn: "Fanta 0.33l", nameAr: "فانتا ٠.٣٣ل", price: "0.00", category: "burger", type: "drink", isRequired: true, displayOrder: 4 },
      
      // Burger Extras
      { name: "aurajuusto", nameEn: "blue cheese", nameAr: "جبنة زرقاء", price: "1.00", category: "burger", type: "extra", displayOrder: 5 },
      { name: "feta", nameEn: "feta", nameAr: "فيتا", price: "1.00", category: "burger", type: "extra", displayOrder: 6 },
      { name: "ananas", nameEn: "pineapple", nameAr: "أناناس", price: "1.00", category: "burger", type: "extra", displayOrder: 7 },
      { name: "jalapeno", nameEn: "jalapeño", nameAr: "هالابينو", price: "1.00", category: "burger", type: "extra", displayOrder: 8 },
      { name: "kananmuna", nameEn: "egg", nameAr: "بيض", price: "1.00", category: "burger", type: "extra", displayOrder: 9 },

      // Drink Sizes (required for drinks)
      { name: "0,33L", nameEn: "0.33L", nameAr: "٠.٣٣ل", price: "0.00", category: "drink", type: "size", isRequired: true, displayOrder: 1 },
      { name: "0,5L", nameEn: "0.5L", nameAr: "٠.٥ل", price: "0.60", category: "drink", type: "size", isRequired: true, displayOrder: 2 },
      { name: "1,5L", nameEn: "1.5L", nameAr: "١.٥ل", price: "2.10", category: "drink", type: "size", isRequired: true, displayOrder: 3 },
    ];

    for (const topping of allToppings) {
      await db.insert(toppings).values(topping);
    }

    console.log("Comprehensive toppings initialized successfully");
  } catch (error) {
    console.error("Error initializing toppings:", error);
  }
}