import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type MciName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const CATEGORY_ICONS: Record<string, MciName> = {
  petrol: 'gas-station',
  temple: 'temple-hindu',
  washroom: 'toilet',
  parking: 'parking',
  metro: 'train',
  hospital: 'hospital-building',
  atm: 'atm',
  restaurant: 'silverware-fork-knife',
};

interface Props {
  categoryId: string;
  size?: number;
  color: string;
}

export function CategoryIcon({ categoryId, size = 20, color }: Props) {
  const name = CATEGORY_ICONS[categoryId] ?? 'map-marker-radius';
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}
