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

// tslint:disable:no-magic-numbers no-bitwise
function lighten(color: string, amount: number): string {
  const lightenColorComponent = (c: number, amt: number): number => {
    let newC = c;
    if (amt < 0) {
      newC = c * 1 - amt;
    } else if (amt > 0) {
      newC = c + (255 - c) * amt;
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

export function alpha(color: string, amount: number): string {
  const colorHex = color.slice(1); // Remove #
  const colorInt = parseInt(colorHex, 16);
  const red = colorInt >> 16;
  const green = colorInt & 0x0000ff;
  const blue = (colorInt >> 8) & 0x00ff;
  return `rgba(${red}, ${green}, ${blue}, ${amount})`;
}
// tslint:enable:no-magic-numbers no-bitwise

const LIGHT_COLOR_RATIO = 0.2;
export const Colors = {
  Success: Palette.Emerald,
  SuccessLight: lighten(Palette.Emerald, LIGHT_COLOR_RATIO),
  Warning: Palette.SunFlower,
  WarningLight: lighten(Palette.SunFlower, LIGHT_COLOR_RATIO),
  Danger: Palette.Alizarin,
  DangerLight: lighten(Palette.Alizarin, LIGHT_COLOR_RATIO),
  Neutral: Palette.Concrete,
  NeutralLight: lighten(Palette.Concrete, LIGHT_COLOR_RATIO),

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
    backgroundColor: Palette.White,
    disabledOpacity: 0.35,
    minSizeForVariableColumns: 175,

    searchBarHeight: 42,

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

    filterBackgroundColor: Palette.White,
    filterBackgroundColorHover: Palette.Clouds,
    filterBorderColor: Colors.SecondaryDark,
    filterSeparatorColor: Colors.SecondaryDark,
    filterTextColor: Palette.Black,
    filterFontSize: 13,
    fitlerCountIndicatorBackgroundColor: Palette.Clouds,
    fitlerCountIndicatorColor: Palette.Asbestos,
    fitlerCountIndicatorFontSize: 12,
    filterIconOpacity: 0.5,
    filterIconHoverOpacity: 0.75,
    filterIconSelectedOpacity: 1,
  },
  planProd: {
    topBarHeight: 96,
    topBarBackgroundColor: Colors.PrimaryDark,
    topBarTextColor: Colors.TextOnPrimary,
    topBarTitleFontSize: 24,
    topBarTitleFontWeight: 400,
    topBarDetailsFontSize: 14,

    printingBorder: `solid 4px ${Colors.PrimaryDark}`,
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
    encrierBaseHeight: 60,
    basePadding: 24,
    elementsBaseSmallFontSize: 12,
    elementsBaseMediumFontSize: 20,
    elementsBaseLargeFontSize: 26,
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
    tooltipWidth: 300,
    tooltipOpacity: 0.5,
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
    borderThickness: 1,
    borderColor: Colors.SecondaryDark,
    padding: '8px 12px',
    borderRadius: 6,
  },
  checkbox: {
    size: 16,
    iconSize: 10,
    uncheckedBackgroundColor: Palette.Asbestos,
    uncheckedColor: Colors.TextOnSecondary,
    checkedBackgroundColor: Colors.SecondaryDark,
    checkedColor: Colors.TextOnSecondary,
  },
  modal: {
    margin: 24,
    padding: 24,
    closeIconSize: 18,
    backgroundColor: Palette.White,
    borderColor: Colors.PrimaryDark,
    borderWidth: 2,
  },
  loadingIndicator: {
    defaultColor: '#999999',
    largeSize: 64,
    mediumSize: 32,
    smallSize: 16,
  },
  calendar: {
    headerBackgroundColor: Colors.SecondaryDark,
    headerTextColor: Colors.TextOnSecondary,
    dayBackgroundColor: Palette.Clouds,
    dayBorderColor: Colors.SecondaryDark,
    dayCircleSize: 32,
    dayCircleBackgroundColor: Colors.SecondaryDark,
    todayCircleBackgroundColor: Colors.PrimaryDark,
    dayCircleTextColor: Colors.TextOnSecondary,
    dayCircleFontSize: 14,
    dayCircleFontWeight: FontWeight.SemiBold,
    tileHeight: 48,
  },
  viewer: {
    margin: 32,
    padding: 16,
    distanceFromElement: 16,
    shadow: '0px 0px 16px 0px rgba(0,0,0,0.75)',
  },
  schedule: {
    hourHeight: 180,
    verticalPadding: 0,
  },
};
