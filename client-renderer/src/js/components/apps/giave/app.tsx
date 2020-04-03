import React from 'react';

interface GiaveAppProps {}

interface GiaveAppState {}

export class GiaveApp extends React.Component<GiaveAppProps, GiaveAppState> {
  public static displayName = 'GiaveApp';

  public constructor(props: GiaveAppProps) {
    super(props);
  }

  public render(): JSX.Element {
    return <div>Giave</div>;
  }
}
