export const palette = {
  // Light Theme: True 3D Tactile Claymorphism (Matches Mockup Reference)
  light: {
    name: 'light',
    // Canvas & Curved Backdrop
    background: '#F6F6FC',           // Soft Porcelain Lavender-White Canvas
    sheetBackground: '#F6F6FC',
    topBackdrop: '#7A63F1',          // Vibrant Soft Clay Violet Header Backdrop
    topBackdropDark: '#634BD9',
    topHeaderBg: '#7A63F1',

    // Puffy White Clay Surfaces
    surface: '#FFFFFF',
    surfaceSubtle: '#F0F2FA',
    surfaceHover: '#E7EAF6',
    border: '#E4E7F5',
    borderSubtle: '#ECEEF8',
    clayBorderTop: '#FFFFFF',
    clayBorderBottom: '#DCE0F2',

    // Hero 3D Purple Clay Card
    brandCard: '#6B52E8',
    brandCardHighlight: 'rgba(255, 255, 255, 0.35)',
    brandCardBottom: '#4C33C6',
    brandCardBorder: 'rgba(255, 255, 255, 0.35)',

    // Typography
    text: '#1E243C',
    textWhite: '#FFFFFF',
    textSecondary: '#7B849E',
    textTertiary: '#9AA3BC',
    textMuted: '#CBD5E1',

    // Brand Accent
    primary: '#7259EE',
    primaryDark: '#5138CC',
    primaryLight: 'rgba(114, 89, 238, 0.12)',

    // Financial Metrics (Pastel Tactile Clay)
    income: '#34C77B',
    incomeDark: '#209E5C',
    incomeHighlight: '#86F0B8',
    incomeLight: '#E8FAF0',
    incomeSurface: '#45CF87',
    incomeBorder: '#24A462',

    expense: '#F06464',
    expenseDark: '#CC4343',
    expenseHighlight: '#FFA3A3',
    expenseLight: '#FFF0F0',
    expenseSurface: '#F2696B',
    expenseBorder: '#CE4546',

    warning: '#F59E0B',
    warningDark: '#D97706',
    warningLight: '#FFFBEB',
    warningSurface: '#FBBF24',
    warningBorder: '#FDE68A',

    info: '#70C7D6',
    infoDark: '#4AA1B0',
    infoLight: '#ECF9FB',

    // 4 Puffy 3D Pastel Action Tiles (Exact Mockup Colors)
    tileMint: '#5AD494',
    tileMintTop: '#9AF5C4',
    tileMintBottom: '#34AD6E',

    tileCoral: '#F59AB3',
    tileCoralTop: '#FFCCD9',
    tileCoralBottom: '#D46D8A',

    tileViolet: '#8A79F6',
    tileVioletTop: '#BCB0FF',
    tileVioletBottom: '#6150CE',

    tileCyan: '#92D9E6',
    tileCyanTop: '#C7F3FA',
    tileCyanBottom: '#5DB2C2',

    // Curved Puffy Purple Bottom Dock
    dockBg: '#6D54EA',
    dockTop: 'rgba(255, 255, 255, 0.35)',
    dockBottom: '#4B33C2',
    dockActive: '#FFFFFF',
    dockInactive: 'rgba(255, 255, 255, 0.62)',

    // Chart Card (Screen 2 Mockup)
    chartBg: '#745CEB',
    chartWell: '#634BD9',
    chartBar: '#F794AD',
    chartBarTop: '#FFC8D7',
    chartBarBottom: '#D46684',

    shadow: '#6D54EA',
    cardShadow: '#7A63F1'
  },

  // Dark Theme: Puffy Velvet Indigo Claymorphism
  dark: {
    name: 'dark',
    background: '#131224',
    sheetBackground: '#131224',
    topBackdrop: '#463599',
    topBackdropDark: '#312375',
    topHeaderBg: '#463599',

    surface: '#1F1D36',
    surfaceSubtle: '#17152B',
    surfaceHover: '#292647',
    border: '#2E2B4F',
    borderSubtle: '#262342',
    clayBorderTop: 'rgba(255, 255, 255, 0.14)',
    clayBorderBottom: '#0C0B18',

    brandCard: '#5B43D6',
    brandCardHighlight: 'rgba(255, 255, 255, 0.28)',
    brandCardBottom: '#3B25A8',
    brandCardBorder: 'rgba(255, 255, 255, 0.25)',

    text: '#F8FAFC',
    textWhite: '#FFFFFF',
    textSecondary: '#A4A9C4',
    textTertiary: '#737999',
    textMuted: '#4E5370',

    primary: '#7D66F5',
    primaryDark: '#5942CC',
    primaryLight: 'rgba(125, 102, 245, 0.18)',

    income: '#43D98C',
    incomeDark: '#24A663',
    incomeHighlight: '#85F5BB',
    incomeLight: 'rgba(67, 217, 140, 0.14)',
    incomeSurface: '#34C77B',
    incomeBorder: '#1E8C52',

    expense: '#FA7476',
    expenseDark: '#D14B4D',
    expenseHighlight: '#FFA8AA',
    expenseLight: 'rgba(250, 116, 118, 0.14)',
    expenseSurface: '#EB5E60',
    expenseBorder: '#BD393B',

    warning: '#FBBF24',
    warningDark: '#D97706',
    warningLight: 'rgba(251, 191, 36, 0.15)',
    warningSurface: '#F59E0B',
    warningBorder: 'rgba(251, 191, 36, 0.35)',

    info: '#6BD4E8',
    infoDark: '#44A8BC',
    infoLight: 'rgba(107, 212, 232, 0.14)',

    tileMint: '#3FC47E',
    tileMintTop: '#7CEDB2',
    tileMintBottom: '#239156',

    tileCoral: '#E67D9A',
    tileCoralTop: '#FFB0C6',
    tileCoralBottom: '#B8516E',

    tileViolet: '#7866E8',
    tileVioletTop: '#A99BFF',
    tileVioletBottom: '#4F3EB8',

    tileCyan: '#69C2D4',
    tileCyanTop: '#A4E9F7',
    tileCyanBottom: '#3E92A3',

    dockBg: '#533DC9',
    dockTop: 'rgba(255, 255, 255, 0.25)',
    dockBottom: '#352299',
    dockActive: '#FFFFFF',
    dockInactive: 'rgba(255, 255, 255, 0.55)',

    chartBg: '#4C39AD',
    chartWell: '#3C2A94',
    chartBar: '#F794AD',
    chartBarTop: '#FFC8D7',
    chartBarBottom: '#C95D7A',

    shadow: '#000000',
    cardShadow: '#000000'
  }
};

// True Puffy 3D Claymorphism Card Helper
export const getClayCard = (themeMode = 'light') => {
  const isDark = themeMode === 'dark';
  return {
    backgroundColor: isDark ? '#1F1D36' : '#FFFFFF',
    borderRadius: 24,
    borderTopWidth: 2,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomWidth: 4.5,
    borderTopColor: isDark ? 'rgba(255, 255, 255, 0.14)' : '#FFFFFF',
    borderLeftColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
    borderRightColor: isDark ? 'rgba(0, 0, 0, 0.25)' : '#ECEEF8',
    borderBottomColor: isDark ? '#0D0C1A' : '#DCE0F3',
    shadowColor: isDark ? '#000000' : '#7A63F1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: isDark ? 0.45 : 0.13,
    shadowRadius: 18,
    elevation: 7
  };
};

// Puffy 3D Clay Button Helper
export const getClayButton = (themeMode = 'light', customBg, customBottom) => {
  const isDark = themeMode === 'dark';
  let bg = customBg || (isDark ? '#7D66F5' : '#7259EE');
  let bottom = customBottom || (isDark ? '#543DC4' : '#4E35C4');

  if (customBg === 'income') {
    bg = '#45CF87';
    bottom = '#24A462';
  } else if (customBg === 'expense') {
    bg = '#F2696B';
    bottom = '#CE4546';
  } else if (customBg === 'primary') {
    bg = isDark ? '#7D66F5' : '#7259EE';
    bottom = isDark ? '#543DC4' : '#4E35C4';
  }

  return {
    backgroundColor: bg,
    borderRadius: 18,
    borderTopWidth: 2,
    borderLeftWidth: 1.5,
    borderRightWidth: 1,
    borderBottomWidth: 4.5,
    borderTopColor: 'rgba(255, 255, 255, 0.42)',
    borderLeftColor: 'rgba(255, 255, 255, 0.25)',
    borderRightColor: 'rgba(0, 0, 0, 0.08)',
    borderBottomColor: bottom,
    shadowColor: bottom,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5
  };
};

// Soft Recessed Clay Input Helper
export const getClayInput = (themeMode = 'light') => {
  const isDark = themeMode === 'dark';
  return {
    backgroundColor: isDark ? '#151329' : '#F3F4FB',
    borderRadius: 16,
    borderTopWidth: 2,
    borderLeftWidth: 1.5,
    borderRightWidth: 1,
    borderBottomWidth: 1.5,
    borderTopColor: isDark ? '#0B0A17' : '#DDE1F2',
    borderLeftColor: isDark ? '#0D0C1C' : '#E3E6F5',
    borderRightColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
    borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF'
  };
};

// Soft Puffy Clay Pill Helper
export const getClayPill = (themeMode = 'light') => {
  const isDark = themeMode === 'dark';
  return {
    borderRadius: 14,
    borderTopWidth: 1.5,
    borderBottomWidth: 3,
    borderTopColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.9)',
    borderBottomColor: isDark ? '#0C0B18' : '#D9DDF0'
  };
};

export const categoryColors = {
  Food: { color: '#F2696B', darkColor: '#CE4546', bg: '#FFF0F0', icon: 'fast-food' },
  Bills: { color: '#F59AB3', darkColor: '#D46D8A', bg: '#FFF2F6', icon: 'flash' },
  Travel: { color: '#70C7D6', darkColor: '#4BA1B0', bg: '#ECF9FB', icon: 'car-sport' },
  Shopping: { color: '#8A79F6', darkColor: '#6150CE', bg: '#F2F0FF', icon: 'bag-handle' },
  Health: { color: '#45CF87', darkColor: '#24A462', bg: '#E8FAF0', icon: 'medkit' },
  Entertainment: { color: '#F59E0B', darkColor: '#D97706', bg: '#FFFBEB', icon: 'game-controller' },
  Education: { color: '#6366F1', darkColor: '#4338CA', bg: '#EEF2FF', icon: 'book' },
  General: { color: '#7D66F5', darkColor: '#5942CC', bg: '#F2F0FF', icon: 'cube' }
};
