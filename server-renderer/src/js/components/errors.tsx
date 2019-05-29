import * as React from 'react';
import styled from 'styled-components';

import {ServerErrorData} from '@shared/models';

interface Props {
  errors: ServerErrorData[];
}

export class Errors extends React.Component<Props> {
  public static displayName = 'Errors';

  constructor(props: Props) {
    super(props);
  }

  private padNumber(value: number, padding: number): string {
    let valueStr = String(value);
    while (valueStr.length < padding) {
      valueStr = `0${valueStr}`;
    }
    return valueStr;
  }

  private renderDate(date: Date): string {
    const day = this.padNumber(date.getDate(), 2);
    const month = this.padNumber(date.getMonth() + 1, 2);
    const year = date
      .getFullYear()
      .toString()
      .slice(2);
    const hour = this.padNumber(date.getHours(), 2);
    const minutes = this.padNumber(date.getMinutes(), 2);
    const seconds = this.padNumber(date.getSeconds(), 2);
    return `${day}/${month}/${year} ${hour}:${minutes}:${seconds}`;
  }

  private readonly renderError = (error: ServerErrorData): JSX.Element => {
    const {time, msg} = error;
    const dateStr = this.renderDate(new Date(time));
    return (
      <ErrorLine key={dateStr}>
        <td>{dateStr}</td>
        <td>{msg}</td>
      </ErrorLine>
    );
  };

  public render(): JSX.Element {
    const {errors} = this.props;
    // const content

    return (
      <ErrorsWrapper>
        <Title>{`Erreurs (${errors.length})`}</Title>
        <ErrorsList>
          <ErrorsTable>
            <tbody>{errors.map(this.renderError)}</tbody>
          </ErrorsTable>
        </ErrorsList>
      </ErrorsWrapper>
    );
  }
}

const ErrorsWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const Title = styled.div`
  flex-shrink: 0;
  font-weight: 600;
  display: inline-block;
  margin-bottom: 8px;
  font-size: 22px;
`;

const ErrorsList = styled.div`
  flex-grow: 1;
  font-size: 13px;
`;

const ErrorsTable = styled.table`
  border-collapse: collapse;
`;

const ErrorLine = styled.tr`
  :hover {
    background-color: #ddd;
    cursor: pointer;
  }
`;
