import * as React from 'react';
import styled from 'styled-components';

import {Duration} from '@root/components/common/duration';
import {OperationConstraint as OperationConstraintComponent} from '@root/components/common/operation_constraint';
import {PlanProdStateLight, getConstraints} from '@root/lib/plan_prod';
import {theme, Colors} from '@root/theme';

import {Operation, OperationGroup, OperationConstraint} from '@shared/models';

interface OperationTableProps {
  width: number;
  planProduction: PlanProdStateLight;
  previousPlanProduction: PlanProdStateLight;
  operations: Operation[];
}

interface OperationDetail {
  description: string;
  constraint: OperationConstraint;
  quantity: number;
  duration: number;
}

interface OperationSplit {
  total: number;
  operations: OperationDetail[];
}

interface OperationSplits {
  conducteur: OperationSplit;
  aideConducteur: OperationSplit;
}

export class OperationTable extends React.Component<OperationTableProps> {
  public static displayName = 'OperationTable';

  private splitOperations(
    operations: Operation[],
    constraints: Map<OperationConstraint, number>
  ): OperationSplits {
    const conducteurSplit: OperationSplit = {total: 0, operations: []};
    const aideConducteurSplit: OperationSplit = {total: 0, operations: []};

    const conducteurOperations = operations.filter(o => o.group === OperationGroup.Conducteur);
    const aideConducteurOperations = operations
      .filter(o => o.group === OperationGroup.Aide)
      .sort((o1, o2) => {
        const o1Quantity = constraints.get(o1.constraint) || 0;
        const o2Quantity = constraints.get(o2.constraint) || 0;
        return o2Quantity * o2.duration - o1Quantity * o1.duration;
      });
    const repartissableOperations = operations.filter(
      o => o.group === OperationGroup.Repartissable
    );

    conducteurOperations.forEach(o => {
      const quantity = constraints.get(o.constraint) || 0;
      if (quantity > 0) {
        conducteurSplit.total += o.duration * quantity;
        conducteurSplit.operations.push({
          description: o.description,
          constraint: o.constraint,
          quantity,
          duration: o.duration,
        });
      }
    });

    aideConducteurOperations.forEach(o => {
      const quantity = constraints.get(o.constraint) || 0;
      if (quantity > 0) {
        const operationDetail = {
          description: o.description,
          constraint: o.constraint,
          quantity,
          duration: o.duration,
        };
        if (conducteurSplit.total < aideConducteurSplit.total) {
          conducteurSplit.total += o.duration * quantity;
          conducteurSplit.operations.push(operationDetail);
        } else {
          aideConducteurSplit.total += o.duration * quantity;
          aideConducteurSplit.operations.push(operationDetail);
        }
      }
    });

    repartissableOperations.forEach(o => {
      const quantity = constraints.get(o.constraint) || 0;
      if (quantity > 0) {
        const operationDetail = {
          description: o.description,
          constraint: o.constraint,
          quantity,
          duration: o.duration,
        };
        const duration = o.duration * quantity;
        const diffBetweenOperators = aideConducteurSplit.total - conducteurSplit.total;
        if (diffBetweenOperators > duration / 2) {
          conducteurSplit.total += duration;
          conducteurSplit.operations.push(operationDetail);
        } else if (diffBetweenOperators < -duration / 2) {
          aideConducteurSplit.total += duration;
          aideConducteurSplit.operations.push(operationDetail);
        } else {
          const splittedOperationDetail = {...operationDetail, quantity: quantity / 2};
          conducteurSplit.total += duration / 2;
          conducteurSplit.operations.push(splittedOperationDetail);
          aideConducteurSplit.total += duration / 2;
          aideConducteurSplit.operations.push(splittedOperationDetail);
        }
      }
    });

    return {conducteur: conducteurSplit, aideConducteur: aideConducteurSplit};
  }

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
        return (
          <tr>
            <td>
              {isPreviousSameConstraint ? (
                ''
              ) : (
                <OperationConstraintComponent constraint={constraint} />
              )}
            </td>
            <td>{description}</td>
            <td>
              <Duration durationMs={duration * 1000} />
            </td>
            <td>{`x${quantity}`}</td>
            <td>
              <Duration durationMs={duration * quantity * 1000} />
            </td>
          </tr>
        );
      }),
    ];
  }

  public render(): JSX.Element {
    const {width, planProduction, previousPlanProduction, operations} = this.props;

    const constraints = getConstraints(previousPlanProduction, planProduction);
    const operationsSplits = this.splitOperations(operations, constraints);

    console.log(operationsSplits);
    console.log(constraints);

    this.sortOperationSplit(operationsSplits.conducteur);
    this.sortOperationSplit(operationsSplits.aideConducteur);

    const lines = [
      ...this.renderOperationSplitLines('CONDUCTEUR', operationsSplits.conducteur),
      ...this.renderOperationSplitLines('AIDE CONDUCTEUR', operationsSplits.aideConducteur),
    ];

    const chauffeRefenteOperations = operations.filter(
      o => o.group === OperationGroup.ChauffeRefente && (constraints.get(o.constraint) || 0) > 0
    );
    const chauffePerfoOperations = operations.filter(
      o => o.group === OperationGroup.ChauffePerfo && (constraints.get(o.constraint) || 0) > 0
    );

    const chauffeOperations = chauffeRefenteOperations.concat(chauffePerfoOperations);
    chauffeOperations.forEach(o => {
      lines.push(
        <tr>
          <OperationSplitHeader colSpan={4}>{o.description}</OperationSplitHeader>
          <OperationSplitHeader>
            <Duration durationMs={(constraints.get(o.constraint) || 0) * o.duration * 1000} />
          </OperationSplitHeader>
        </tr>
      );
    });

    return <OperationSplitTable>{lines}</OperationSplitTable>;
  }
}

const OperationSplitHeader = styled.td`
  background-color: ${Colors.PrimaryDark};
  color: ${Colors.TextOnPrimary};
  font-size: 16px;
  padding: 8px 16px;
`;

const OperationSplitTable = styled.table``;
