import React from 'react';
import styled from 'styled-components';

import {bridge} from '@root/lib/bridge';

interface Props {}

export class SpeedSimulator extends React.Component<Props> {
  public static displayName = 'SpeedSimulator';

  private readonly speedInputRef = React.createRef<HTMLInputElement>();
  private readonly minutesInputRef = React.createRef<HTMLInputElement>();

  private readonly handleClick = (): void => {
    const speedInput = this.speedInputRef.current;
    const minutesInput = this.minutesInputRef.current;
    if (!speedInput || !minutesInput) {
      return;
    }
    const speed: number | undefined =
      speedInput.value === '' ? undefined : parseFloat(speedInput.value);
    const minutes = parseFloat(minutesInput.value);
    if ((speed !== undefined && isNaN(speed)) || isNaN(minutes)) {
      return;
    }
    bridge.simulateAutomateSpeed(speed, minutes).catch(console.error);
  };

  public render(): JSX.Element {
    return (
      <Wrapper>
        Simuler la vitesse
        <Input ref={this.speedInputRef} type="text" defaultValue="0" />
        pendant
        <Input ref={this.minutesInputRef} type="text" defaultValue="1" />
        minutes
        <Button onClick={this.handleClick}>Envoyer</Button>
      </Wrapper>
    );
  }
}

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  color: white;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 32px;
  text-align: center;
  margin: 0 8px;
  background: #16a085;
  border: solid 1px white;
  padding: 4px 0px;
  color: white;
`;

const Button = styled.button`
  display: inline-block;
  box-sizing: border-box;
  box-shadow: none;
  border: none;
  outline: none;
  cursor: pointer;

  font-family: Segoe UI;
  font-size: 15px;
  font-weight: 400;
  padding: 4px 8px;
  color: white;
  border-radius: 3px;

  background-color: #1abc9c;
  &:hover {
    background-color: #33d2b3;
  }
  &:active {
    background-color: #1abc9c;
  }

  margin-left: 8px;
`;
