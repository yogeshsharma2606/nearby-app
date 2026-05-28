export interface PlaceCategory {
  id: string;
  label: string;
  /** Plural label for use in counts ("5 petrol pumps found") */
  labelPlural: string;
  emoji: string;
  /** Google Places Nearby Search `type` parameter (omit to search by keyword only) */
  googleType?: string;
  /** Optional keyword for Google Places when type alone is insufficient */
  keyword?: string;
  /** Overpass API tag used as fallback when Google key is not set */
  overpassTag: string;
}

export const PLACE_CATEGORIES: PlaceCategory[] = [
  {
    id: 'petrol',
    label: 'Petrol Pump',
    labelPlural: 'Petrol Pumps',
    emoji: '⛽',
    googleType: 'gas_station',
    overpassTag: 'amenity=fuel',
  },
  {
    id: 'temple',
    label: 'Temple',
    labelPlural: 'Temples',
    emoji: '🛕',
    googleType: 'hindu_temple',
    overpassTag: 'amenity=place_of_worship',
  },
  {
    id: 'washroom',
    label: 'Washroom',
    labelPlural: 'Washrooms',
    emoji: '🚻',
    // Google Places has no dedicated toilet type — keyword-only search works best
    keyword: 'public toilet restroom washroom',
    overpassTag: 'amenity=toilets',
  },
  {
    id: 'parking',
    label: 'Parking',
    labelPlural: 'Parking Areas',
    emoji: '🅿️',
    googleType: 'parking',
    overpassTag: 'amenity=parking',
  },
  {
    id: 'metro',
    label: 'Metro Station',
    labelPlural: 'Metro Stations',
    emoji: '🚇',
    googleType: 'subway_station',
    overpassTag: 'railway=station',
  },
  {
    id: 'hospital',
    label: 'Hospital',
    labelPlural: 'Hospitals',
    emoji: '🏥',
    googleType: 'hospital',
    overpassTag: 'amenity=hospital',
  },
  {
    id: 'atm',
    label: 'ATM',
    labelPlural: 'ATMs',
    emoji: '🏧',
    googleType: 'atm',
    overpassTag: 'amenity=atm',
  },
  {
    id: 'restaurant',
    label: 'Restaurant',
    labelPlural: 'Restaurants',
    emoji: '🍽️',
    googleType: 'restaurant',
    overpassTag: 'amenity=restaurant',
  },
];

export const DEFAULT_CATEGORY = PLACE_CATEGORIES[0];
