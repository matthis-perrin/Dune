import React from 'react';

import {AutoRefresh} from '@root/components/common/auto_refresh';
import {formatDuration} from '@root/lib/utils';

interface TimerProps {
  start: number;
  end?: number;
}

export class Timer extends React.PureComponent<TimerProps> {
  public static displayName = 'Timer';

  public render(): JSX.Element {
    return (
      <AutoRefresh>
        {() => formatDuration((this.props.end || Date.now()) - this.props.start)}
      </AutoRefresh>
    );
  }
}
