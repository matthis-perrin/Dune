import * as React from 'react';
import styled from 'styled-components';

import {Duration} from '@root/components/common/duration';
import {OperationConstraint as OperationConstraintComponent} from '@root/components/common/operation_constraint';
import {
  PlanProdStateLight,
  getConstraints,
  OperationSplit,
  splitOperations,
} from '@root/lib/plan_prod';
import {Colors, theme} from '@root/theme';

import {Operation} from '@shared/models';

interface OperationTableProps {
  width: number;
  planProduction: PlanProdStateLight;
  previousPlanProduction: PlanProdStateLight;
  operations: Operation[];
}

export class OperationTable extends React.Component<OperationTableProps> {
  public static displayName = 'OperationTable';

  private sortOperationSplit(operationSplit: OperationSplit): void {
    operationSplit.operations.sort((o1, o2) => {
      if (o1.constraint !== o2.constraint) {
        return o1.constraint.localeCompare(o2.constraint);
      }
      return o2.duration * o2.quantity - o1.duration * o1.quantity;
    });
  }

  private renderOperationSplitLines(title: string, operationSplit: OperationSplit): JSX.Element[] {
    const {total, operations} = operationSplit;
    if (operations.length === 0) {
      return [];
    }

    let isEven = false;
    return [
      <tr>
        <OperationSplitHeader colSpan={4}>{title}</OperationSplitHeader>
        <OperationSplitHeader>
          <Duration durationMs={total * 1000} />
        </OperationSplitHeader>
      </tr>,
      ...operations.map((operation, index) => {
        const {constraint, description, duration, quantity} = operation;
        const isPreviousSameConstraint =
          index > 0 && operations[index - 1].constraint === constraint;
        isEven = isPreviousSameConstraint ? isEven : !isEven;
        return (
          <OperationSplitRow
            style={{
              backgroundColor: isEven
                ? theme.table.rowEvenBackgroundColor
                : theme.table.rowOddBackgroundColor,
            }}
          >
            <OperationSplitCell>
              {isPreviousSameConstraint ? (
                ''
              ) : (
                <OperationConstraintComponent constraint={constraint} />
              )}
            </OperationSplitCell>
            <OperationSplitCell>{description}</OperationSplitCell>
            <OperationSplitCell>
              <Duration durationMs={duration * 1000} />
            </OperationSplitCell>
            <OperationSplitCell>{`x${quantity}`}</OperationSplitCell>
            <OperationSplitCell>
              <Duration durationMs={duration * quantity * 1000} />
            </OperationSplitCell>
          </OperationSplitRow>
        );
      }),
    ];
  }

  public render(): JSX.Element {
    const {width, planProduction, previousPlanProduction, operations} = this.props;

    const constraints = getConstraints(previousPlanProduction, planProduction);
    const operationsSplits = splitOperations(operations, constraints);

    this.sortOperationSplit(operationsSplits.conducteur);
    this.sortOperationSplit(operationsSplits.aideConducteur);

    const lines = [
      ...this.renderOperationSplitLines('CONDUCTEUR', operationsSplits.conducteur),
      ...this.renderOperationSplitLines('AIDE CONDUCTEUR', operationsSplits.aideConducteur),
    ];

    operationsSplits.chauffePerfo.operations.forEach(o => {
      lines.push(
        <tr>
          <OperationSplitHeader colSpan={4}>{o.description}</OperationSplitHeader>
          <OperationSplitHeader>
            <Duration durationMs={(constraints.get(o.constraint) || 0) * o.duration * 1000} />
          </OperationSplitHeader>
        </tr>
      );
    });

    operationsSplits.chauffeRefente.operations.forEach(o => {
      lines.push(
        <tr>
          <OperationSplitHeader colSpan={4}>{o.description}</OperationSplitHeader>
          <OperationSplitHeader>
            <Duration durationMs={(constraints.get(o.constraint) || 0) * o.duration * 1000} />
          </OperationSplitHeader>
        </tr>
      );
    });

    return <OperationSplitTable style={{width}}>{lines}</OperationSplitTable>;
  }
}

const OperationSplitHeader = styled.td`
  background-color: ${theme.table.headerBackgroundColor};
  color: ${theme.table.headerColor};
  font-size: ${theme.table.headerFontSize}px;
  font-weight: ${theme.table.headerFontWeight};
  padding: ${theme.table.headerPadding}px;
  height: ${theme.table.headerHeight}px;
  box-sizing: border-box;
  text-transform: uppercase;
`;

const OperationSplitTable = styled.table`
  border-collapse: collapse;
`;

const OperationSplitRow = styled.tr`
  height: ${theme.table.rowHeight}px;
  box-sizing: border-box;
`;

const OperationSplitCell = styled.td`
  padding: ${theme.table.padding}px;
  font-size: ${theme.table.rowFontSize}px;
  font-weight: ${theme.table.rowFontWeight};
`;
// background={
//     rowIndex !== undefined && rowIndex % 2 === 0
//       ? theme.table.rowEvenBackgroundColor
//       : theme.table.rowOddBackgroundColor
//   }
