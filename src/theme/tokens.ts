export interface ThemeTokens {
  isDark: boolean;
  background: string;
  surface: string;
  surfaceVariant: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  tertiary: string;
  onPrimary: string;
  onBackground: string;
  onSurface: string;
  onSurfaceMuted: string;
  outline: string;
  error: string;
  scrim: string;
}

export type ThemeName = 'red' | 'green' | 'white' | 'purple';
export type ThemeMode = 'auto' | ThemeName;
