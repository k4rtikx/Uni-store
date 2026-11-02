/**
 * Centralized campus and marketplace domain constants
 */

export const CATEGORIES = [
  'Books',
  'Lab Equipment',
  'Electronics',
  'Stationery',
  'Clothing',
  'Bags & Accessories',
  'Furniture',
  'Other',
];

export const CATEGORY_FILTERS = ['All', ...CATEGORIES];

export const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'];

export const CONDITION_FILTERS = ['All', ...CONDITIONS];

export const COLLEGES = [
  'Rustamji Institute of Technology (RJIT), Tekanpur',
  'RGPV (Rajiv Gandhi Proudyogiki Vishwavidyalaya), Bhopal',
  'MITS (Madhav Institute of Technology & Science), Gwalior',
  'Jiwaji University, Gwalior',
  'IIITM (ABV-IIITM), Gwalior',
  'Other Campus / University',
];

export const DEFAULT_COLLEGE = 'Rustamji Institute of Technology (RJIT), Tekanpur';

export const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
];

export const STATUS_OPTIONS = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'Available', value: 'AVAILABLE' },
  { label: 'Sold', value: 'SOLD' },
];
