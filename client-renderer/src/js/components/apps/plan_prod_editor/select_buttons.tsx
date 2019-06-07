import * as React from 'react';
import styled from 'styled-components';

import {BobineMere} from '@root/components/common/bobine_mere';
import {bridge} from '@root/lib/bridge';
import {CAPACITE_MACHINE} from '@root/lib/constants';
import {theme} from '@root/theme/default';

import {getRefenteSize} from '@shared/lib/refentes';
import {Refente, ClientAppType, Perfo, BobineMere as BobineMereModel} from '@shared/models';

interface SelectButtonProps<T> {
  title: string;
  selectable: T[];
  onClick(): void;
}

class SelectButton<T> extends React.Component<SelectButtonProps<T>> {
  public static displayName = 'SelectButton';

  public render(): JSX.Element {
    const {selectable, onClick, title} = this.props;
    const plural = selectable.length > 1 ? 's' : '';

    return (
      <Wrapper onClick={onClick}>
        {`Sélectionner ${title} - ${selectable.length} compatible${plural}`}
      </Wrapper>
    );
  }
}

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: calc(100% - ${theme.page.padding * 2}px);
  height: ${theme.refente.height}px;
  box-sizing: border-box;
  border: dashed 2px #888;
  color: #555;
  font-size: 24px;
  cursor: pointer;
  :hover {
    border: dashed 2px #333;
    color: #111;
  }
`;

export const SelectRefenteButton = (props: {selectable: Refente[]}) => (
  <SelectButton
    title="une refente"
    selectable={props.selectable}
    onClick={() => bridge.openApp(ClientAppType.RefentePickerApp).catch(console.error)}
  />
);

export const SelectPerfoButton = (props: {selectable: Perfo[]}) => (
  <SelectButton
    title="une perfo"
    selectable={props.selectable}
    onClick={() => bridge.openApp(ClientAppType.PerfoPickerApp).catch(console.error)}
  />
);

interface SelectBobineMereButtonProps extends SelectButtonProps<BobineMereModel> {
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
        color="#fff"
        borderColor={isHovered ? '#333' : '#888'}
        dashed
      >
        {`Sélectionner ${title} - ${selectable.length} compatible${plural}`}
      </BobineMereWrapper>
    );
  }
}

const BobineMereWrapper = styled(BobineMere)`
  color: #555;
  font-size: 24px;
  cursor: pointer;
  :hover {
    color: #111;
  }
`;

interface SelectPapierPolyproProps {
  selectable: BobineMereModel[];
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
