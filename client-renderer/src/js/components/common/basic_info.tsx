import {omit} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {DivProps} from '@root/components/core/common';

type AcceptableVlue = JSX.Element | string | undefined | number | boolean;

interface Props extends DivProps {
  data: {title: JSX.Element | string; value: JSX.Element | string | undefined | number | boolean}[];
}

export class BasicInfo extends React.Component<Props> {
  public static displayName = 'BasicInfo';

  public renderValue(value: AcceptableVlue): JSX.Element {
    if (typeof value === 'boolean') {
      return <React.Fragment>{value ? 'OUI' : 'NON'}</React.Fragment>;
    }
    if (typeof value === 'undefined') {
      return <UndefinedValue>Non spécifié</UndefinedValue>;
    }
    return <React.Fragment>{value}</React.Fragment>;
  }

  public render(): JSX.Element {
    const {data} = this.props;
    const rest = omit(this.props, ['data']);

    return (
      <table {...rest}>
        <tbody>
          {data.map(({title, value}, index) => (
            <tr key={`line-${index}`}>
              <InfoHeader>{title}</InfoHeader>
              <InfoValue>{this.renderValue(value)}</InfoValue>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}

const InfoHeader = styled.td`
  white-space: nowrap;
  vertical-align: top;
  font-weight: 600;
  padding-right: 10px;
`;

const UndefinedValue = styled.span`
  font-style: italic;
`;

const InfoValue = styled.td``;
