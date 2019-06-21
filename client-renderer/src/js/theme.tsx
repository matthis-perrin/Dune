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
};

export const Colors = {
  Success: Palette.Emerald,
  Warning: Palette.SunFlower,
  Danger: Palette.Pomegranate,

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
    // borderColor: Palette.primary,
    // backgroundColor: Palette.white,
    borderThickness: 2,
    headerHeight: 32,
    borderRadius: 2,
    headerPadding: 8,
    headerFontSize: 13,
    headerFontWeight: FontWeight.Bold,
    // headerColor: Palette.secondary,
    // headerBackgroundColor: Palette.primary,
    headerIconSize: 8,
    headerIconSpacing: 4,
    footerHeight: 32,
    footerFontWeight: FontWeight.SemiBold,
    footerFontSize: 13,
    rowHeight: 32,
    rowFontSize: 14,
    rowFontWeight: FontWeight.SemiBold,
    // rowBackgroundColor: Palette.white,
    // rowBackgroundColorHovered: Palette.lightGray,
    filterIconOpacity: 0.5,
    filterIconHoverOpacity: 0.75,
    filterIconSelectedOpacity: 1,
  },
  planProd: {
    selectableBorderColor: '#888',
    selectableHoverBorderColor: '#333',
    selectableTextColor: '#555',
    selectableHoverTextColor: '#111',
    selectableBackgroundColor: '#fff',
    closeDefaultColor: Colors.Danger,
  },
  perfo: {
    hoverBackgroundColor: '#eeeeee',
  },
  bague: {
    // borderColor: Palette.black,
    backgroundColor: '#DDD9C3',
    baseFontSize: 15,
    baseTriangleHeight: 6,
    baseHeight: 50,
  },
  cale: {
    // borderColor: Palette.black,
    backgroundColor: '#F2F2F2',
    baseFontSize: 15,
    baseHeight: 30,
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
    borderRadius: 3,
    disabledOpacity: 0.5,
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
