import React from 'react';

import {ScheduleStopModal} from '@root/components/common/schedule_stop_modal';
import {bridge} from '@root/lib/bridge';

interface MaintenanceModalProps {
  date: Date;
  onDone(): void;
}

export class MaintenanceModal extends React.Component<MaintenanceModalProps> {
  public static displayName = 'MaintenanceModal';

  public render(): JSX.Element {
    const {date, onDone} = this.props;
    return (
      <ScheduleStopModal
        date={date}
        onSave={(start, end, title) => bridge.createMaintenance(start, end, title)}
        onDone={onDone}
      />
    );
  }
}
