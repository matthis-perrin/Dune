import * as React from 'react';
import styled from 'styled-components';

import {bridge} from '@root/lib/bridge';
import {theme} from '@root/theme/default';

import {Refente, ClientAppType} from '@shared/models';

interface Props<T> {
  title: string;
  selectable: T[];
  onClick(): void;
}

class SelectButton<T> extends React.Component<Props<T>> {
  public static displayName = 'SelectButton';

  public render(): JSX.Element {
    const {selectable, onClick, title} = this.props;
    const plural = selectable.length > 1 ? 's' : '';

    return (
      <Wrapper onClick={onClick}>
        {`Sélectionner ${title}${plural} - ${selectable.length} disponibles`}
      </Wrapper>
    );
  }
}

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
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
    onClick={() =>
      bridge.openApp(ClientAppType.RefentePickerApp, props.selectable).catch(console.error)
    }
  />
);
