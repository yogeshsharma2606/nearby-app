import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { typography } from '../theme/typography';

type Variant = keyof typeof typography;

interface Props extends TextProps {
  variant?: Variant;
  color?: string;
  children: React.ReactNode;
}

export function ThemedText({ variant = 'body', color, style, children, ...rest }: Props) {
  const base = typography[variant] as TextStyle;
  return (
    <Text style={[base, color ? { color } : null, style]} {...rest}>
      {children}
    </Text>
  );
}

export { typography };
