export const Palette = {
  Turquoise: '#1ABC9C',
  GreenSea: '#16A085',
  Emerald: '#2ECC71',
  Nephritis: '#27AE60',
  PeterRiver: '#3498DB',
  BelizeHole: '#2980B9',
  Amethyst: '#9B59B6',
  Wisteria: '#8E44AD',
  WetAsphalt: '#34495E',
  MidnightBlue: '#2C3E50',
  SunFlower: '#F1C40F',
  Orange: '#F39C12',
  Carrot: '#E67E22',
  Pumpkin: '#D35400',
  Alizarin: '#E74C3C',
  Pomegranate: '#C0392B',
  Clouds: '#ECF0F1',
  Silver: '#BDC3C7',
  Concrete: '#95A5A6',
  Asbestos: '#7F8C8D',
  White: '#FFFFFF',
  Black: '#000000',
  Transparent: 'transparent',
};

// amount: 0 => no change, 1 => white, -1 => black
function lighten(color: string, amount: number): string {
  const lightenColorComponent = (c: number, amount: number): number => {
    let newC = c;
    if (amount < 0) {
      newC = c * 1 - amount;
    } else if (amount > 0) {
      newC = c + (255 - c) * amount;
    }
    return Math.max(0, Math.min(255, Math.round(newC)));
  };
  const colorHex = color.slice(1); // Remove #
  const colorInt = parseInt(colorHex, 16);
  const red = lightenColorComponent(colorInt >> 16, amount);
  const green = lightenColorComponent(colorInt & 0x0000ff, amount);
  const blue = lightenColorComponent((colorInt >> 8) & 0x00ff, amount);
  const rgb = (green | (blue << 8) | (red << 16)).toString(16);
  return `#${rgb}`;
}

export const Colors = {
  Success: Palette.Emerald,
  SuccessLight: lighten(Palette.Emerald, 0.2),
  Warning: Palette.SunFlower,
  WarningLight: lighten(Palette.SunFlower, 0.2),
  Danger: Palette.Alizarin,
  DangerLight: lighten(Palette.Alizarin, 0.2),
  Neutral: Palette.Concrete,
  NeutralLight: lighten(Palette.Concrete, 0.2),

  PrimaryDark: Palette.MidnightBlue,
  PrimaryLight: Palette.WetAsphalt,
  SecondaryDark: Palette.GreenSea,
  SecondaryLight: Palette.Turquoise,

  TextOnPrimary: Palette.White,
  TextOnSecondary: Palette.White,
};

export const FontWeight = {
  Light: 200,
  SemiLight: 300,
  Regular: 400,
  SemiBold: 600,
  Bold: 700,
  Black: 800,
};

interface ColorInfo {
  hex: string;
  textHex: string;
  dangerHex: string;
  hasBorder: boolean;
}

const COLOR_INFO = new Map<string, ColorInfo>([
  ['BLANC', {hex: '#F6F6F6', textHex: '#000000', dangerHex: Colors.Danger, hasBorder: true}],
  ['ECRU', {hex: '#F7D794', textHex: '#000000', dangerHex: Colors.Danger, hasBorder: false}],
  ['ECRU ENDUIT', {hex: '#F7D794', textHex: '#000000', dangerHex: Colors.Danger, hasBorder: false}],
  ['IVOIRE', {hex: '#F7F1E3', textHex: '#000000', dangerHex: Colors.Danger, hasBorder: true}],
  ['JAUNE', {hex: '#FFC700', textHex: '#000000', dangerHex: Colors.Danger, hasBorder: false}],
  ['MARRON', {hex: '#784212', textHex: '#ffffff', dangerHex: Colors.Danger, hasBorder: false}],
  ['NOIR', {hex: '#3D3D3D', textHex: '#ffffff', dangerHex: Colors.Danger, hasBorder: false}],
  ['ORANGE', {hex: '#E67E22', textHex: '#000000', dangerHex: '#000000', hasBorder: false}],
  ['PRUNE', {hex: '#9B59B6', textHex: '#000000', dangerHex: Colors.Danger, hasBorder: false}],
  ['ROUGE', {hex: '#E74C3C', textHex: '#000000', dangerHex: '#000000', hasBorder: false}],
  ['VERT', {hex: '#2ECC71', textHex: '#000000', dangerHex: Colors.Danger, hasBorder: false}],
  ['BLEU', {hex: '#2E71CC', textHex: '#000000', dangerHex: Colors.Danger, hasBorder: false}],
  ['BISTRE', {hex: '#856D4D', textHex: '#ffffff', dangerHex: Colors.Danger, hasBorder: false}],
  ['OR', {hex: '#EED807', textHex: '#000000', dangerHex: Colors.Danger, hasBorder: false}],
  ['POLYPRO', {hex: '#F0F0F0', textHex: '#000000', dangerHex: Colors.Danger, hasBorder: false}],
]);

const DEFAULT_COLOR_INFO = {
  hex: '#ffffff',
  textHex: '#000000',
  dangerHex: Colors.Danger,
  hasBorder: true,
};

export function getColorInfoByName(name?: string): ColorInfo {
  return COLOR_INFO.get(name || '') || DEFAULT_COLOR_INFO;
}

export function couleurByName(name?: string): string {
  return (COLOR_INFO.get(name || '') || DEFAULT_COLOR_INFO).hex;
}

export function textColorByName(name?: string): string {
  return (COLOR_INFO.get(name || '') || DEFAULT_COLOR_INFO).textHex;
}

export const theme = {
  base: {
    fontFamily: 'Segoe UI',
  },
  sidebar: {
    width: 270,
    logoSize: 170,
    logoBackgroundColor: Colors.SecondaryDark,
    logoColor: Colors.TextOnSecondary,
    itemHeight: 48,
    itemFontWeight: FontWeight.SemiLight,
    itemFontSize: 20,
    itemColor: Colors.TextOnPrimary,
    indicatorWidth: 4,
    indicatorHeight: 24,
    indicatorSpacing: 16,
    backgroundColor: Colors.PrimaryDark,
    selectedColor: Colors.SecondaryDark,
  },
  page: {
    padding: 50,
    backgroundColor: Colors.PrimaryLight,
  },
  administration: {
    titleColor: Colors.TextOnPrimary,
  },
  table: {
    padding: 8,
    borderRadius: 2,
    borderThickness: 2,
    // borderColor: Palette.primary,
    // backgroundColor: Palette.white,

    headerHeight: 42,
    headerPadding: 8,
    headerFontSize: 13,
    headerFontWeight: FontWeight.SemiBold,
    headerColor: Colors.TextOnPrimary,
    headerBackgroundColor: Colors.PrimaryDark,

    headerIconSize: 8,
    headerIconSpacing: 4,
    headerIconColor: Colors.SecondaryDark,

    footerHeight: 32,
    footerFontWeight: FontWeight.SemiBold,
    footerFontSize: 13,

    rowHeight: 32,
    rowFontSize: 14,
    rowFontWeight: FontWeight.SemiBold,
    rowEvenBackgroundColor: Palette.White,
    rowOddBackgroundColor: Palette.Clouds,
    rowBackgroundColorHovered: Palette.Silver,

    filterIconOpacity: 0.5,
    filterIconHoverOpacity: 0.75,
    filterIconSelectedOpacity: 1,
  },
  planProd: {
    topBarHeight: 96,
    topBarBackgroundColor: Colors.PrimaryDark,
    topBarTitleColor: Colors.TextOnPrimary,
    topBarTextColor: Colors.TextOnPrimary,
    topBarTitleFontSize: 24,
    topBarTitleFontWeight: 400,
    topBarDetailsFontSize: 14,

    contentBackgroundColor: Palette.White,
    closeDefaultColor: Colors.Danger,

    selectableBorderColor: Colors.PrimaryDark,
    selectableHoverBorderColor: Colors.SecondaryDark,
    selectableTextColor: Colors.PrimaryDark,
    selectableHoverTextColor: Colors.SecondaryDark,
    selectableStrokeWidth: 2,

    selectedBorderColor: Colors.PrimaryDark,
    selectedStrokeWidth: 1,

    elementsBaseHeight: 100,
    basePadding: 24,
    elementsBaseSmallFontSize: 12,
    elementsBaseMediumFontSize: 20,
    elementsBaseLargeFontSize: 28,
  },
  perfo: {
    hoverBackgroundColor: '#eeeeee',
  },
  bague: {
    borderColor: Palette.Black,
    backgroundColor: '#DDD9C3',
  },
  cale: {
    borderColor: Palette.Black,
    backgroundColor: Palette.Clouds,
  },
  refente: {
    height: 100,
    // borderColor: Palette.black,
    backgroundColor: '#F2F2F2',
    hoverBackgroundColor: '#eeeeee',
    baseFontSize: 22,
    chuteBackgroundColor: '#F2F2F2',
    chuteStripeSpacing: 6,
    chuteStripeSize: 1,
    chuteStripeColor: '#333333',
  },
  cadencier: {
    whiteBobineBarColor: '#dddddd',
    tooltipBackgroundColor: 'rgba(0, 0, 0, 0.75)',
    textColor: '#ddd',
    lineColor: '#ccc',
    gridLineColor: '#3C3C3C',
  },
  operation: {
    backgroundColor: '#eeeeee',
  },
  form: {
    inputBorderColor: '#7F7F7F',
  },
  button: {
    fontSize: 15,
    fontWeight: FontWeight.Regular,
    padding: '8px 16px',
    defaultBackgroundColor: Colors.SecondaryDark,
    defaultBackgroundColorHover: Colors.SecondaryLight,
    color: Colors.TextOnPrimary,
    borderRadius: 6,
    disabledOpacity: 0.5,
  },
  input: {
    height: 32,
    largeHeight: 32,
    borderThickness: 3,
    borderColor: Colors.SecondaryDark,
    padding: '8px 12px',
    borderRadius: 6,
  },
  modal: {
    margin: 24,
    padding: 24,
    closeIconSize: 18,
    // backgroundColor: Palette.white,
    // borderColor: Palette.primary,
    borderWidth: 2,
  },
  loadingIndicator: {
    defaultColor: '#999999',
    largeSize: 64,
    mediumSize: 32,
    smallSize: 16,
  },
};
