import * as React from 'react';
import styled from 'styled-components';

import {AutoFontWeight} from '@root/components/core/auto_font_weight';
import {getStockReel, getStockTerme} from '@root/lib/stocks';
import {numberWithSeparator} from '@root/lib/utils';
import {theme} from '@root/theme';

import {BobineMere, Stock, Color, BobineFilleWithPose} from '@shared/models';

interface BobineMereContentProps {
  color: Color;
  pixelPerMM: number;
  bobine: BobineMere;
  isPolypro: boolean;
  stocks: Map<string, Stock[]>;
  tourCount?: number;
  selectedBobines: BobineFilleWithPose[];
}

export class BobineMereContent extends React.Component<BobineMereContentProps> {
  public static displayName = 'BobineMereContent';

  public render(): JSX.Element {
    const {
      color,
      pixelPerMM,
      bobine,
      isPolypro,
      stocks,
      tourCount = 0,
      selectedBobines,
    } = this.props;
    const {ref, couleurPapier = '', laize = 0, longueur = 0, grammage = 0} = bobine;

    const grammageStr = `${grammage}${isPolypro ? 'g/m²' : 'g'}`;
    const longueurStr = `${numberWithSeparator(longueur)} m`;
    const stockReel = stocks ? getStockReel(ref, stocks) : 0;
    const stockTerme = stocks ? getStockTerme(ref, stocks) : 0;
    const longueurBobineFille = selectedBobines.length > 0 ? selectedBobines[0].longueur || 0 : 0;
    const withDecimal = (value: number): number => Math.round(value * 10) / 10;
    const prod = withDecimal(longueur !== 0 ? (tourCount * longueurBobineFille) / longueur : 0);

    const title = `${ref} ${couleurPapier} ${laize} ${grammageStr} - ${longueurStr}`;
    const stockActuel = `${stockReel} (à terme ${stockTerme})`;
    const stockPrevisionel = '? (à terme ?)';
    const stockAfterProd = `${withDecimal(stockReel - prod)} (à terme ${withDecimal(
      stockTerme - prod
    )})`;

    const large = theme.planProd.elementsBaseLargeFontSize * pixelPerMM;
    const medium = theme.planProd.elementsBaseMediumFontSize * pixelPerMM;
    const small = theme.planProd.elementsBaseSmallFontSize * pixelPerMM;
    const colorStyle = {color: color.textHex};

    return (
      <BobineMereContentWrapper>
        <AutoFontWeight style={colorStyle} fontSize={large}>
          <BobineMereContentTitle>{title}</BobineMereContentTitle>
        </AutoFontWeight>
        <BobineMereContentStocks>
          <BobineMereContentStock>
            <AutoFontWeight style={colorStyle} fontSize={small}>
              <BobineMereContentStockTitle>STOCK ACTUEL</BobineMereContentStockTitle>
            </AutoFontWeight>
            <AutoFontWeight style={colorStyle} fontSize={medium}>
              <BobineMereContentStockContent>{stockActuel}</BobineMereContentStockContent>
            </AutoFontWeight>
          </BobineMereContentStock>
          <BobineMereContentStock>
            <AutoFontWeight style={colorStyle} fontSize={small}>
              <BobineMereContentStockTitle>PRÉVISIONNEL</BobineMereContentStockTitle>
            </AutoFontWeight>
            <AutoFontWeight style={colorStyle} fontSize={medium}>
              <BobineMereContentStockContent>{stockPrevisionel}</BobineMereContentStockContent>
            </AutoFontWeight>
          </BobineMereContentStock>
          <BobineMereContentStock>
            <AutoFontWeight style={colorStyle} fontSize={small}>
              <BobineMereContentStockTitle>APRÈS PROD</BobineMereContentStockTitle>
            </AutoFontWeight>
            <AutoFontWeight style={colorStyle} fontSize={medium}>
              <BobineMereContentStockContent>{stockAfterProd}</BobineMereContentStockContent>
            </AutoFontWeight>
          </BobineMereContentStock>
        </BobineMereContentStocks>
      </BobineMereContentWrapper>
    );
  }
}

const BobineMereContentWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
`;
const BobineMereContentTitle = styled.div`
  text-align: center;
`;
const BobineMereContentStocks = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-evenly;
`;
const BobineMereContentStock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;
const BobineMereContentStockTitle = styled.div``;
const BobineMereContentStockContent = styled.div``;
