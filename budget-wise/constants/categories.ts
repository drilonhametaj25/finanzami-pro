export interface PresetCategory {
  name: string;
  icon: string;
  color: string;
  order_index: number;
}

export const PRESET_CATEGORIES: PresetCategory[] = [
  {
    name: 'Casa',
    icon: 'home',
    color: '#E53935',
    order_index: 0,
  },
  {
    name: 'Spesa alimentare',
    icon: 'cart',
    color: '#43A047',
    order_index: 1,
  },
  {
    name: 'Ristoranti e bar',
    icon: 'food',
    color: '#FB8C00',
    order_index: 2,
  },
  {
    name: 'Trasporti',
    icon: 'car',
    color: '#1E88E5',
    order_index: 3,
  },
  {
    name: 'Svago e intrattenimento',
    icon: 'movie',
    color: '#8E24AA',
    order_index: 4,
  },
  {
    name: 'Abbigliamento',
    icon: 'tshirt-crew',
    color: '#D81B60',
    order_index: 5,
  },
  {
    name: 'Salute',
    icon: 'medical-bag',
    color: '#00ACC1',
    order_index: 6,
  },
  {
    name: 'Istruzione e formazione',
    icon: 'school',
    color: '#5E35B1',
    order_index: 7,
  },
  {
    name: 'Regali',
    icon: 'gift',
    color: '#F4511E',
    order_index: 8,
  },
  {
    name: 'Lavoro',
    icon: 'briefcase',
    color: '#6D4C41',
    order_index: 9,
  },
  {
    name: 'Tecnologia',
    icon: 'cellphone',
    color: '#3949AB',
    order_index: 10,
  },
  {
    name: 'Viaggi',
    icon: 'airplane',
    color: '#039BE5',
    order_index: 11,
  },
  {
    name: 'Animali domestici',
    icon: 'paw',
    color: '#7CB342',
    order_index: 12,
  },
  {
    name: 'Cura personale',
    icon: 'face-woman',
    color: '#FFB300',
    order_index: 13,
  },
  {
    name: 'Altro',
    icon: 'dots-horizontal',
    color: '#757575',
    order_index: 14,
  },
];

// Income categories (for income transactions)
export const INCOME_CATEGORIES = [
  { name: 'Stipendio', icon: 'cash', color: '#43A047' },
  { name: 'Bonus', icon: 'star', color: '#FFB300' },
  { name: 'Regalo', icon: 'gift', color: '#E91E63' },
  { name: 'Rimborso', icon: 'cash-refund', color: '#00ACC1' },
  { name: 'Freelance', icon: 'laptop', color: '#5E35B1' },
  { name: 'Investimenti', icon: 'trending-up', color: '#1E88E5' },
  { name: 'Altro', icon: 'dots-horizontal', color: '#757575' },
];

// Common tags for transactions
export const COMMON_TAGS = [
  'necessario',
  'impulsivo',
  'regalo',
  'lavoro',
  'vacanza',
  'emergenza',
  'festa',
  'ricorrente',
];

// Category icons available for custom categories
export const AVAILABLE_ICONS = [
  'home',
  'cart',
  'food',
  'car',
  'movie',
  'tshirt-crew',
  'medical-bag',
  'school',
  'gift',
  'briefcase',
  'cellphone',
  'airplane',
  'paw',
  'face-woman',
  'dots-horizontal',
  'cash',
  'star',
  'heart',
  'music',
  'gamepad-variant',
  'book',
  'dumbbell',
  'coffee',
  'beer',
  'pizza',
  'gas-station',
  'train',
  'bus',
  'bike',
  'walk',
  'baby-carriage',
  'flower',
  'tree',
  'water',
  'fire',
  'lightbulb',
  'hammer',
  'wrench',
  'palette',
  'camera',
  'headphones',
  'television',
  'washing-machine',
  'fridge',
  'sofa',
  'bed',
  'shower',
  'tooth',
  'pill',
  'eye',
  'hand-heart',
];
