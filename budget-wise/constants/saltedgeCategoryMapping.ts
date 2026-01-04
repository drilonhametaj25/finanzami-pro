// SaltEdge to Finanzami category mapping
// Maps SaltEdge transaction categories to Finanzami preset categories

export interface CategoryMappingResult {
  categoryName: string;
  isIncome: boolean;
  skip: boolean;
}

// Map of SaltEdge categories to Finanzami category names
// Categories must match names in PRESET_CATEGORIES (categories.ts)
export const SALTEDGE_CATEGORY_MAP: Record<string, string> = {
  // Housing
  housing: 'Casa',
  rent: 'Casa',
  mortgage: 'Casa',
  utilities: 'Casa',
  home_improvement: 'Casa',
  home_services: 'Casa',
  household: 'Casa',

  // Food & Groceries
  food_and_groceries: 'Spesa alimentare',
  groceries: 'Spesa alimentare',
  supermarkets: 'Spesa alimentare',
  food: 'Spesa alimentare',

  // Restaurants
  restaurants_and_hotels: 'Ristoranti e bar',
  restaurants: 'Ristoranti e bar',
  cafes_and_restaurants: 'Ristoranti e bar',
  bars_and_cafes: 'Ristoranti e bar',
  fast_food: 'Ristoranti e bar',
  coffee_shops: 'Ristoranti e bar',
  takeout: 'Ristoranti e bar',

  // Transport
  transport: 'Trasporti',
  public_transport: 'Trasporti',
  taxi: 'Trasporti',
  fuel: 'Trasporti',
  parking: 'Trasporti',
  car_rental: 'Trasporti',
  vehicle_maintenance: 'Trasporti',
  car: 'Trasporti',
  auto: 'Trasporti',

  // Entertainment & Leisure
  leisure: 'Svago e intrattenimento',
  entertainment: 'Svago e intrattenimento',
  hobbies: 'Svago e intrattenimento',
  sports: 'Svago e intrattenimento',
  games: 'Svago e intrattenimento',
  movies: 'Svago e intrattenimento',
  music: 'Svago e intrattenimento',
  books: 'Svago e intrattenimento',
  events: 'Svago e intrattenimento',
  gambling: 'Svago e intrattenimento',
  lottery: 'Svago e intrattenimento',

  // Clothing
  clothes_and_shoes: 'Abbigliamento',
  clothing: 'Abbigliamento',
  shoes: 'Abbigliamento',
  accessories: 'Abbigliamento',
  fashion: 'Abbigliamento',

  // Health
  health_and_beauty: 'Salute',
  health: 'Salute',
  pharmacy: 'Salute',
  doctors: 'Salute',
  medical: 'Salute',
  dental: 'Salute',
  optical: 'Salute',
  hospitals: 'Salute',
  healthcare: 'Salute',

  // Personal Care
  beauty: 'Cura personale',
  personal_care: 'Cura personale',
  hair: 'Cura personale',
  spa: 'Cura personale',
  cosmetics: 'Cura personale',
  wellness: 'Cura personale',

  // Education
  education: 'Istruzione e formazione',
  school: 'Istruzione e formazione',
  university: 'Istruzione e formazione',
  courses: 'Istruzione e formazione',
  books_and_education: 'Istruzione e formazione',
  training: 'Istruzione e formazione',

  // Gifts
  gifts: 'Regali',
  charity: 'Regali',
  donations: 'Regali',

  // Work
  work_expenses: 'Lavoro',
  office_supplies: 'Lavoro',
  business_services: 'Lavoro',
  business: 'Lavoro',

  // Technology
  electronics: 'Tecnologia',
  software: 'Tecnologia',
  telecommunications: 'Tecnologia',
  phone: 'Tecnologia',
  internet: 'Tecnologia',
  subscriptions: 'Tecnologia',
  streaming: 'Tecnologia',

  // Travel
  travel: 'Viaggi',
  hotels: 'Viaggi',
  flights: 'Viaggi',
  vacation: 'Viaggi',
  accommodation: 'Viaggi',
  tourism: 'Viaggi',

  // Pets
  pets: 'Animali domestici',
  pet_food: 'Animali domestici',
  veterinary: 'Animali domestici',
  pet_supplies: 'Animali domestici',

  // Default
  uncategorized: 'Altro',
  other: 'Altro',
  fees: 'Altro',
  bank_fees: 'Altro',
  taxes: 'Altro',
  insurance: 'Altro',
  fines: 'Altro',
  government: 'Altro',
};

// Income categories - transactions with these are marked as income
export const INCOME_CATEGORIES: string[] = [
  'income',
  'salary',
  'wages',
  'bonus',
  'interest',
  'dividends',
  'refund',
  'reimbursement',
  'cashback',
  'pension',
  'benefits',
  'rental_income',
  'freelance',
  'commission',
];

// Skip categories - these transactions should not be imported
export const SKIP_CATEGORIES: string[] = [
  'transfers',
  'internal_transfer',
  'savings',
  'investments',
  'atm',
  'atm_withdrawal',
  'bank_transfer',
  'account_transfer',
  'credit_card_payment',
];

/**
 * Maps a SaltEdge category to Finanzami category
 * @param saltedgeCategory - The category from SaltEdge API
 * @returns Object with categoryName, isIncome flag, and skip flag
 */
export const mapSaltEdgeCategory = (saltedgeCategory: string | null | undefined): CategoryMappingResult => {
  if (!saltedgeCategory) {
    return { categoryName: 'Altro', isIncome: false, skip: false };
  }

  const normalized = saltedgeCategory.toLowerCase().replace(/-/g, '_').trim();

  // Check if it's an income category
  if (INCOME_CATEGORIES.includes(normalized)) {
    return { categoryName: 'Lavoro', isIncome: true, skip: false };
  }

  // Check if it should be skipped
  if (SKIP_CATEGORIES.includes(normalized)) {
    return { categoryName: '', isIncome: false, skip: true };
  }

  // Get mapped category or default to "Altro"
  const mappedCategory = SALTEDGE_CATEGORY_MAP[normalized] || 'Altro';

  return { categoryName: mappedCategory, isIncome: false, skip: false };
};

/**
 * Get icon for a SaltEdge category (uses the mapped Finanzami category's icon)
 * This is useful for displaying a preview before the category is fully mapped
 */
export const getSaltEdgeCategoryIcon = (saltedgeCategory: string): string => {
  const { categoryName } = mapSaltEdgeCategory(saltedgeCategory);

  const iconMap: Record<string, string> = {
    Casa: 'home',
    'Spesa alimentare': 'cart',
    'Ristoranti e bar': 'food',
    Trasporti: 'car',
    'Svago e intrattenimento': 'movie',
    Abbigliamento: 'tshirt-crew',
    Salute: 'medical-bag',
    'Istruzione e formazione': 'school',
    Regali: 'gift',
    Lavoro: 'briefcase',
    Tecnologia: 'cellphone',
    Viaggi: 'airplane',
    'Animali domestici': 'paw',
    'Cura personale': 'face-woman',
    Altro: 'dots-horizontal',
  };

  return iconMap[categoryName] || 'dots-horizontal';
};
