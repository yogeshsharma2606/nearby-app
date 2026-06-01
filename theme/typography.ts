/** Inter — loaded in app/_layout.tsx */
export const FONT = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const typography = {
  hero: {
    fontFamily: FONT.bold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.6,
  },
  title: {
    fontFamily: FONT.semiBold,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: -0.25,
  },
  subtitle: {
    fontFamily: FONT.semiBold,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.15,
  },
  sectionLabel: {
    fontFamily: FONT.semiBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  body: {
    fontFamily: FONT.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily: FONT.medium,
    fontSize: 15,
    lineHeight: 22,
  },
  caption: {
    fontFamily: FONT.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  captionMedium: {
    fontFamily: FONT.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  chip: {
    fontFamily: FONT.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  button: {
    fontFamily: FONT.semiBold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.15,
  },
  badge: {
    fontFamily: FONT.semiBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.2,
  },
};
