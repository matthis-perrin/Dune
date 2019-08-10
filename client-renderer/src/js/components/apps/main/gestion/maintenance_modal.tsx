import * as React from 'react';
import styled from 'styled-components';

import {Button} from '@root/components/core/button';
import {Input} from '@root/components/core/input';
import {SVGIcon} from '@root/components/core/svg_icon';
import {bridge} from '@root/lib/bridge';
import {Colors, Palette} from '@root/theme';

interface MaintenanceModalProps {
  date: Date;
  onDone(): void;
}

interface MaintenanceModalState {
  title: string;
  start: string;
  end: string;
}

const MAX_HOUR = 23;
const MAX_MINUTE = 59;

export class MaintenanceModal extends React.Component<
  MaintenanceModalProps,
  MaintenanceModalState
> {
  public static displayName = 'MaintenanceModal';

  public constructor(props: MaintenanceModalProps) {
    super(props);
    this.state = {
      title: '',
      start: '17:00',
      end: '18:00',
    };
  }

  private isComplete(): boolean {
    return this.getFormData() !== undefined;
  }

  private readonly handleCreate = (): void => {
    const formData = this.getFormData();
    if (formData === undefined) {
      return;
    }
    const {start, end, title} = formData;
    bridge
      .createMaintenance(start, end, title)
      .then(this.props.onDone)
      .catch(console.error);
  };

  private getFormData(): {start: number; end: number; title: string} | undefined {
    const start = this.getTime(this.state.start);
    const end = this.getTime(this.state.end);
    const {title} = this.state;
    if (title.length > 0 && start !== undefined && end !== undefined && start < end) {
      return {start, end, title};
    }
  }

  private getHourMinutes(value: string): {hour: number; minute: number} | undefined {
    const fragments = value.split(':');
    if (fragments.length !== 2) {
      return undefined;
    }
    const [hourStr, minuteStr] = fragments;
    try {
      const parsedHour = parseFloat(hourStr);
      const parsedMinute = parseFloat(minuteStr);
      if (
        !isFinite(parsedHour) ||
        isNaN(parsedHour) ||
        !isFinite(parsedMinute) ||
        isNaN(parsedMinute)
      ) {
        return undefined;
      }
      const hour = Math.round(parsedHour);
      const minute = Math.round(parsedMinute);
      if (hour < 0 || hour > MAX_HOUR || minute < 0 || minute > MAX_MINUTE) {
        return undefined;
      }
      return {hour, minute};
    } catch {
      return undefined;
    }
  }

  private getTime(value: string): number | undefined {
    const startTime = this.getHourMinutes(value);
    if (!startTime) {
      return undefined;
    }
    const {hour, minute} = startTime;
    const start = new Date(this.props.date);
    start.setHours(hour);
    start.setMinutes(minute);
    return start.getTime();
  }

  public render(): JSX.Element {
    return (
      <ModalBackdrop>
        <ModalWrapper>
          <ModalCloseButton onClick={this.props.onDone}>
            <SVGIcon name="cross" width={18} height={18} />
          </ModalCloseButton>
          <Form>
            <FormLine>
              <FormLabel>Libellé</FormLabel>
              <FormValue>
                <Input
                  focusOnMount
                  value={this.state.title}
                  onChange={event => this.setState({title: event.target.value})}
                />
              </FormValue>
            </FormLine>
            <FormLine>
              <FormLabel>Début</FormLabel>
              <FormValue>
                <Input
                  value={this.state.start}
                  onChange={event => this.setState({start: event.target.value})}
                />
              </FormValue>
            </FormLine>
            <FormLine>
              <FormLabel>Fin</FormLabel>
              <FormValue>
                <Input
                  value={this.state.end}
                  onChange={event => this.setState({end: event.target.value})}
                />
              </FormValue>
            </FormLine>
          </Form>
          <FormButton>
            <Button disabled={!this.isComplete()} onClick={this.handleCreate}>
              Enregistrer
            </Button>
          </FormButton>
        </ModalWrapper>
      </ModalBackdrop>
    );
  }
}

const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.5);
`;

const Form = styled.div`
  display: flex;
  flex-direction: column;
`;

const FormLine = styled.div`
  display: flex;
  align-items: center;
  height: 48px;
`;

const FormButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  margin-top: 16px;
`;

const FormLabel = styled.div`
  width: 128px;
`;

const FormValue = styled.div``;

const ModalCloseButton = styled.button`
  background: none;
  border: none;
  box-shadow: none;
  width: 32px;
  height: 32px;
  display: flex;
  align-item: center;
  justify-content: center;
  position: absolute;
  top: 0;
  right: 0;
  cursor: pointer;
  & > svg {
    fill: ${Palette.Asbestos};
  }
  &:hover > svg {
    fill: ${Palette.Concrete};
  }
`;

const width = 400;
const height = 256;

const ModalWrapper = styled.div`
  position: fixed;
  width: ${width}px
  height: ${height}px;
  left: calc(50% - ${width / 2}px);
  top: calc(50% - ${height / 2}px);
  box-sizing: border-box;
  padding: 32px;
  transition: opacity ease-in-out 300ms;
  background-color: white;
  border: solid 2px ${Colors.SecondaryDark};
  border-radius: 4px;
  z-index: 1000;
`;
