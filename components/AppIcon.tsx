import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type IonName = ComponentProps<typeof Ionicons>['name'];

interface Props {
  name: IonName;
  size?: number;
  color: string;
}

/** UI chrome icons (search, navigation, theme, etc.) */
export function AppIcon({ name, size = 22, color }: Props) {
  return <Ionicons name={name} size={size} color={color} />;
}
