export const Colors = {
  // Brand colors
  primary: '#FFBB10',
  secondary: '#0258AE',
  // Basic colors
  white: '#FFFFFF',
  lightGray: '#E6E6E6',
  gray: '#EDEDED',
  darkGray: '#DDDDDD',
  black: '#000000',
};

const Fonts = {
  main: 'Segoe UI',
};

const FontWeight = {
  Light: 200,
  SemiLight: 300,
  Regular: 400,
  SemiBold: 600,
  Bold: 700,
  Black: 800,
};

const typography = {
  header: {
    fontFamily: Fonts.main,
    fontSize: '46px',
    fontWeight: FontWeight.Light,
    // lineHeight: '56px',
  },
  subHeader: {
    fontFamily: Fonts.main,
    fontSize: '34px',
    fontWeight: FontWeight.Light,
    // lineHeight: '40px',
  },
  title: {
    fontFamily: Fonts.main,
    fontSize: '24px',
    fontWeight: FontWeight.SemiLight,
    // lineHeight: '28px',
  },
  subTitle: {
    fontFamily: Fonts.main,
    fontSize: '20px',
    fontWeight: FontWeight.Regular,
    // lineHeight: '24px',
  },
  base: {
    fontFamily: Fonts.main,
    fontSize: '14px',
    fontWeight: FontWeight.SemiBold,
    // lineHeight: '20px',
  },
  body: {
    fontFamily: Fonts.main,
    fontSize: '14px',
    fontWeight: FontWeight.Regular,
    // lineHeight: '20px',
  },
  caption: {
    fontFamily: Fonts.main,
    fontSize: '12px',
    fontWeight: FontWeight.Regular,
    // lineHeight: '14px',
  },
};

export function getCouleurByName(name?: string): string {
  if (name === 'BLANC') {
    return '#f6f6f6';
  }
  if (name === 'ECRU' || name === 'ECRU ENDUIT') {
    return '#f7d794';
  }
  if (name === 'IVOIRE') {
    return '#f7f1e3';
  }
  if (name === 'JAUNE') {
    return '#f1c40f';
  }
  if (name === 'MARRON') {
    return '#784212';
  }
  if (name === 'NOIR') {
    return '#3d3d3d';
  }
  if (name === 'ORANGE') {
    return '#e67e22';
  }
  if (name === 'PRUNE') {
    return '#9b59b6';
  }
  if (name === 'ROUGE') {
    return '#e74c3c';
  }
  if (name === 'VERT') {
    return '#2ecc71';
  }
  return 'transparent';
}

export function textColorByName(name?: string): string {
  if (name === 'NOIR' || name === 'MARRON') {
    return '#ffffff';
  }
  return '#000000';
}

export const theme = {
  sidebar: {
    width: 240,
    logoSize: 180,
    itemHeight: 48,
    indicatorWidth: 4,
    indicatorHeight: 24,
    indicatorSpacing: 8,
    backgroundColor: Colors.darkGray,
    selectedColor: Colors.primary,
  },
  page: {
    padding: 24,
    backgroundColor: Colors.lightGray,
  },
  administration: {
    titleColor: Colors.secondary,
  },
  table: {
    padding: 8,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    borderThickness: 2,
    headerHeight: 32,
    borderRadius: 2,
    headerPadding: 8,
    headerFontSize: 13,
    headerFontWeight: FontWeight.Bold,
    headerColor: Colors.secondary,
    headerBackgroundColor: Colors.primary,
    headerIconSize: 8,
    headerIconSpacing: 4,
    footerHeight: 32,
    footerFontWeight: FontWeight.SemiBold,
    footerFontSize: 13,
    rowHeight: 32,
    rowFontSize: 14,
    rowFontWeight: FontWeight.SemiBold,
    rowBackgroundColor: Colors.white,
    rowBackgroundColorHovered: Colors.lightGray,
    filterIconOpacity: 0.5,
    filterIconHoverOpacity: 0.75,
    filterIconSelectedOpacity: 1,
  },
  bague: {
    borderColor: Colors.black,
    backgroundColor: '#DDD9C3',
    baseFontSize: 15,
    baseTriangleHeight: 6,
    baseHeight: 50,
  },
  cale: {
    borderColor: Colors.black,
    backgroundColor: '#F2F2F2',
    baseFontSize: 15,
    baseHeight: 30,
  },
  refente: {
    height: 80,
    borderColor: Colors.black,
    backgroundColor: '#F2F2F2',
    baseFontSize: 22,
    chuteBackgroundColor: '#F2F2F2',
    chuteStripeSpacing: 6,
    chuteStripeSize: 1,
    chuteStripeColor: '#333333',
  },
  form: {
    inputBorderColor: '#7F7F7F',
  },
  button: {
    fontSize: 15,
    fontWeight: FontWeight.SemiBold,
    padding: '4px 8px',
    backgroundColor: Colors.primary,
    color: Colors.secondary,
    borderRadius: 3,
    height: 32,
    disabledOpacity: 0.5,
  },
  modal: {
    margin: 24,
    padding: 24,
    closeIconSize: 18,
    backgroundColor: Colors.white,
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  loadingIndicator: {
    defaultColor: '#999999',
    largeSize: 64,
    mediumSize: 32,
    smallSize: 16,
  },
  typography,
};
