import React from 'react';

import {ScheduleStopModal} from '@root/components/common/schedule_stop_modal';
import {bridge} from '@root/lib/bridge';

interface NonProdModalProps {
  date: Date;
  onDone(): void;
}

export class NonProdModal extends React.Component<NonProdModalProps> {
  public static displayName = 'NonProdModal';

  public render(): JSX.Element {
    const {date, onDone} = this.props;
    return (
      <ScheduleStopModal
        date={date}
        onSave={(start, end, title) => bridge.createNonProd(start, end, title)}
        onDone={onDone}
      />
    );
  }
}
