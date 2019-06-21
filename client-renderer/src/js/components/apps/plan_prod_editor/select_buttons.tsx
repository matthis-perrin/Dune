import * as React from 'react';
import styled from 'styled-components';

import {Bobine} from '@root/components/common/bobine';
import {bridge} from '@root/lib/bridge';
import {CAPACITE_MACHINE} from '@root/lib/constants';
import {theme} from '@root/theme';

import {getRefenteSize} from '@shared/lib/refentes';
import {Refente, ClientAppType, Perfo, BobineMere, BobineFilleWithMultiPose} from '@shared/models';

interface SelectButtonProps<T> {
  title: string;
  selectable: T[];
  onClick(): void;
  pixelPerMM: number;
}

class SelectButton<T> extends React.Component<SelectButtonProps<T>> {
  public static displayName = 'SelectButton';

  public render(): JSX.Element {
    const {selectable, onClick, title, pixelPerMM} = this.props;
    const plural = selectable.length > 1 ? 's' : '';

    return (
      <SelectButtonWrapper onClick={onClick} style={{width: CAPACITE_MACHINE * pixelPerMM}}>
        {`Sélectionner ${title} (${selectable.length} compatible${plural})`}
      </SelectButtonWrapper>
    );
  }
}

const SelectButtonWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: ${theme.refente.height}px;
  box-sizing: border-box;
  border: dashed 2px ${theme.planProd.selectableBorderColor};
  color: ${theme.planProd.selectableTextColor};
  background-color: ${theme.planProd.contentBackgroundColor};
  font-size: 24px;
  cursor: pointer;
  :hover {
    border: dashed ${theme.planProd.selectableStrokeWidth}px
      ${theme.planProd.selectableHoverBorderColor};
    color: ${theme.planProd.selectableHoverTextColor};
  }
`;

interface SelectBobineButtonProps {
  selectable: BobineFilleWithMultiPose[];
  size: number;
  pixelPerMM: number;
}

export class SelectBobineButton extends React.Component<SelectBobineButtonProps> {
  public static displayName = 'SelectBobineButton';

  public render(): JSX.Element {
    const {selectable, pixelPerMM, size} = this.props;
    const width = size * pixelPerMM;
    const plural = selectable.length > 1 ? 's' : '';

    const smallMode = width < 350;
    const content = smallMode
      ? '+'
      : `Sélectionner des bobines - ${selectable.length} compatible${plural}`;

    return (
      <SelectBobineButtonWrapper
        onClick={() => bridge.openApp(ClientAppType.BobinesPickerApp)}
        style={{width}}
      >
        {content}
      </SelectBobineButtonWrapper>
    );
  }
}

const SelectBobineButtonWrapper = styled(SelectButtonWrapper)``;

interface SelectRefenteProps {
  selectable: Refente[];
  pixelPerMM: number;
}

export const SelectRefenteButton = (props: SelectRefenteProps) => (
  <SelectButton
    title="une refente"
    selectable={props.selectable}
    onClick={() => bridge.openApp(ClientAppType.RefentePickerApp).catch(console.error)}
    pixelPerMM={props.pixelPerMM}
  />
);

interface SelectPerfoProps {
  selectable: Perfo[];
  pixelPerMM: number;
}

export const SelectPerfoButton = (props: SelectPerfoProps) => (
  <SelectButton
    title="une perfo"
    selectable={props.selectable}
    onClick={() => bridge.openApp(ClientAppType.PerfoPickerApp).catch(console.error)}
    pixelPerMM={props.pixelPerMM}
  />
);

interface SelectBobineMereButtonProps extends SelectButtonProps<BobineMere> {
  selectedRefente?: Refente;
  pixelPerMM: number;
}

export class SelectBobineMereButton extends React.Component<
  SelectBobineMereButtonProps,
  {isHovered: boolean}
> {
  public static displayName = 'SelectBobineMereButton';

  constructor(props: SelectBobineMereButtonProps) {
    super(props);
    this.state = {isHovered: false};
  }

  public render(): JSX.Element {
    const {selectable, onClick, title, pixelPerMM, selectedRefente} = this.props;
    const {isHovered} = this.state;
    const plural = selectable.length > 1 ? 's' : '';
    const decalage = selectedRefente && selectedRefente.decalage;
    const size =
      selectedRefente && decalage
        ? getRefenteSize(selectedRefente)
        : CAPACITE_MACHINE - (decalage || 0);

    return (
      <BobineMereWrapper
        style={{cursor: 'pointer'}}
        pixelPerMM={pixelPerMM}
        size={size}
        decalage={decalage}
        onMouseEnter={() => this.setState({isHovered: true})}
        onMouseLeave={() => this.setState({isHovered: false})}
        onClick={onClick}
        borderColor={
          isHovered
            ? theme.planProd.selectableHoverBorderColor
            : theme.planProd.selectableBorderColor
        }
        color={theme.planProd.contentBackgroundColor}
        strokeWidth={theme.planProd.selectableStrokeWidth}
        dashed
      >
        {`Sélectionner ${title} (${selectable.length} compatible${plural})`}
      </BobineMereWrapper>
    );
  }
}

const BobineMereWrapper = styled(Bobine)`
  color: ${theme.planProd.selectableTextColor};
  font-size: 24px;
  cursor: pointer;
  :hover {
    color: ${theme.planProd.selectableHoverTextColor};
  }
`;

interface SelectPapierPolyproProps {
  selectable: BobineMere[];
  selectedRefente?: Refente;
  pixelPerMM: number;
}

export const SelectPapierButton = (props: SelectPapierPolyproProps) => (
  <SelectBobineMereButton
    title="un papier"
    selectable={props.selectable}
    selectedRefente={props.selectedRefente}
    pixelPerMM={props.pixelPerMM}
    onClick={() => bridge.openApp(ClientAppType.PapierPickerApp).catch(console.error)}
  />
);

export const SelectPolyproButton = (props: SelectPapierPolyproProps) => (
  <SelectBobineMereButton
    title="un polypro"
    selectable={props.selectable}
    selectedRefente={props.selectedRefente}
    pixelPerMM={props.pixelPerMM}
    onClick={() => bridge.openApp(ClientAppType.PolyproPickerApp).catch(console.error)}
  />
);
