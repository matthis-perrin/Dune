import {range} from 'lodash-es';
import React from 'react';
import styled from 'styled-components';

import {CURVE_EXTRA_SPACE} from '@root/components/common/bobine';
import {BobineWithPose} from '@root/components/common/bobine_with_pose';
import {DivProps} from '@root/components/core/common';
import {CAPACITE_MACHINE} from '@root/lib/constants';
import {theme} from '@root/theme';

import {getPoseSize} from '@shared/lib/cliches';
import {getRefenteLaizes} from '@shared/lib/refentes';
import {BobineFilleWithPose, Refente} from '@shared/models';

interface OrderableBobinesProps extends DivProps {
  planId: number;
  pixelPerMM: number;
  bobines: BobineFilleWithPose[];
  refente: Refente;
  onReorder(newOrder: BobineFilleWithPose[]): void;
}

interface OrderableBobinesState {
  dragStart?: number;
  dragEnd?: number;
}

export class OrderableBobines extends React.Component<
  OrderableBobinesProps,
  OrderableBobinesState
> {
  private readonly wrapperRef = React.createRef<HTMLDivElement>();
  public static displayName = 'OrderableBobines';

  constructor(props: OrderableBobinesProps) {
    super(props);
    this.state = {};
  }

  private calculateLaizeIndex(posX: number): number {
    const {pixelPerMM, refente} = this.props;
    const laizes = getRefenteLaizes(refente);
    const posMM = posX / pixelPerMM;
    let laizeCounter = 0;
    let laizeIndex = 0;
    while (laizeCounter < posMM) {
      laizeCounter += laizes[laizeIndex];
      laizeIndex++;
    }
    return laizeIndex - 1;
  }

  private getDraggedBobineIndex(): number | undefined {
    const {bobines} = this.props;
    const {dragStart} = this.state;
    if (!dragStart) {
      return undefined;
    }
    const laizeIndex = this.calculateLaizeIndex(dragStart);
    let poseCounter = 0;
    let bobineIndex = 0;
    while (poseCounter + getPoseSize(bobines[bobineIndex].pose) - 1 < laizeIndex) {
      poseCounter += getPoseSize(bobines[bobineIndex].pose);
      bobineIndex++;
    }
    return bobineIndex;
  }

  private getBobinePosX(bobineIndex: number): number {
    const {bobines, pixelPerMM} = this.props;
    let laizeCount = 0;
    for (let i = 0; i < bobineIndex; i++) {
      laizeCount += (bobines[i].laize || 0) * getPoseSize(bobines[i].pose);
    }
    return laizeCount * pixelPerMM;
  }

  private convertPosX(x: number): number {
    if (this.wrapperRef.current) {
      const wrapperOffset =
        this.wrapperRef.current.getBoundingClientRect().left - this.getOffsetSize();
      const posX = x - wrapperOffset;
      return posX;
    }
    return x;
  }

  private bobinesOrderIsValid(bobines: BobineFilleWithPose[]): boolean {
    const {refente} = this.props;
    const laizes = getRefenteLaizes(refente);
    let laizeIndex = 0;
    for (const bobine of bobines) {
      const poseSize = getPoseSize(bobine.pose);
      for (const _ of range(poseSize)) {
        if (laizes[laizeIndex] !== bobine.laize) {
          return false;
        }
        laizeIndex++;
      }
    }
    return true;
  }

  private getClosestValidBobinesOrder(
    bobines: BobineFilleWithPose[],
    draggedBobineIndex: number,
    shift: number
  ): BobineFilleWithPose[] {
    let lastValidBobinesOrder = bobines;
    const shiftSign = shift < 0 ? -1 : 1;
    range(shift).forEach(s => {
      const newBobines = [...bobines];
      const from = draggedBobineIndex;
      const to = from + s + shiftSign;
      newBobines.splice(to, 0, newBobines.splice(from, 1)[0]);
      if (this.bobinesOrderIsValid(newBobines)) {
        lastValidBobinesOrder = newBobines;
      }
    });
    return lastValidBobinesOrder;
  }

  private getNewBobinesOrder(
    draggedBobineIndex?: number,
    dragStart?: number,
    dragEnd?: number
  ): BobineFilleWithPose[] {
    const {bobines, pixelPerMM} = this.props;
    if (draggedBobineIndex === undefined || dragStart === undefined || dragEnd === undefined) {
      return bobines;
    }
    let shiftCount = 0;
    let mmOffset = (dragEnd - dragStart) / pixelPerMM;
    const halfPose = 0.5;

    if (mmOffset > 0) {
      while (mmOffset > 0) {
        const bobine = bobines[draggedBobineIndex + shiftCount + 1];
        if (!bobine) {
          break;
        }
        const pose = getPoseSize(bobine.pose);
        if (mmOffset < (bobine.laize || 0) * (pose - halfPose)) {
          break;
        }
        mmOffset -= (bobine.laize || 0) * pose;
        shiftCount++;
      }
    } else {
      while (mmOffset < 0) {
        const bobine = bobines[draggedBobineIndex + shiftCount - 1];
        if (!bobine) {
          break;
        }
        const pose = getPoseSize(bobine.pose);
        if (Math.abs(mmOffset) < (bobine.laize || 0) * (pose - halfPose)) {
          break;
        }
        mmOffset += (bobine.laize || 0) * pose;
        shiftCount--;
      }
    }

    if (shiftCount === 0) {
      return bobines;
    }

    return this.getClosestValidBobinesOrder(bobines, draggedBobineIndex, shiftCount);
  }

  private getOffsetSize(): number {
    const {pixelPerMM} = this.props;
    return pixelPerMM * CAPACITE_MACHINE * 2 * CURVE_EXTRA_SPACE;
  }

  private commitReorder(): void {
    const {onReorder} = this.props;
    const {dragStart, dragEnd} = this.state;
    const draggedBobineIndex = this.getDraggedBobineIndex();
    const reorderedBobines = this.getNewBobinesOrder(draggedBobineIndex, dragStart, dragEnd);
    onReorder(reorderedBobines);
    this.setState({dragStart: undefined, dragEnd: undefined});
  }

  private readonly handleMouseMove = (event: React.MouseEvent): void => {
    if (this.state.dragStart !== undefined) {
      this.setState({dragEnd: this.convertPosX(event.clientX)});
    }
  };

  private readonly handleMouseLeave = (event: React.MouseEvent): void => {
    this.commitReorder();
  };

  private readonly handleMouseUp = (event: React.MouseEvent): void => {
    this.commitReorder();
  };

  private readonly handleMouseDown = (event: React.MouseEvent): void => {
    this.setState({dragStart: this.convertPosX(event.clientX), dragEnd: undefined});
  };

  private renderBobineWithPose(
    bobine: BobineFilleWithPose,
    index: number,
    negativeMargin: boolean,
    style?: React.CSSProperties
  ): JSX.Element {
    const {pixelPerMM, planId} = this.props;
    return (
      <BobineWithPoseWrapper key={`${bobine.ref}-${index}`} style={style}>
        <BobineWithPose
          planId={planId}
          pixelPerMM={pixelPerMM}
          bobine={bobine}
          style={{zIndex: index + 1}}
          negativeMargin={negativeMargin}
        >{`${bobine.ref}-${bobine.pose}`}</BobineWithPose>
      </BobineWithPoseWrapper>
    );
  }

  public render(): JSX.Element {
    const {bobines} = this.props;
    const {dragStart, dragEnd} = this.state;
    const draggedBobineIndex = this.getDraggedBobineIndex();

    let draggedElement = <React.Fragment />;
    let isDragging = false;
    if (dragStart !== undefined && dragEnd !== undefined && draggedBobineIndex !== undefined) {
      isDragging = true;
      const bobine = bobines[draggedBobineIndex];
      const leftPos =
        this.getBobinePosX(draggedBobineIndex) +
        dragEnd -
        dragStart -
        this.getOffsetSize() -
        2 * theme.planProd.selectedStrokeWidth;
      draggedElement = (
        <div
          style={{
            position: 'absolute',
            left: leftPos,
            top: 0,
            zIndex: 50,
            pointerEvents: 'none',
          }}
        >
          {this.renderBobineWithPose(bobine, -1, false, {visibility: 'visible'})}
        </div>
      );
    }

    const elements: JSX.Element[] = this.getNewBobinesOrder(
      draggedBobineIndex,
      dragStart,
      dragEnd
    ).map((bobine, index) =>
      this.renderBobineWithPose(bobine, index, true, {
        pointerEvents: isDragging ? 'none' : 'all',
        visibility:
          dragStart !== undefined &&
          dragEnd !== undefined &&
          draggedBobineIndex !== undefined &&
          bobines[draggedBobineIndex] === bobine
            ? 'hidden'
            : 'visible',
      })
    );

    return (
      <div style={{position: 'relative'}}>
        <OrderableBobinesWrapper
          ref={this.wrapperRef}
          onMouseDown={(event: React.MouseEvent) => this.handleMouseDown(event)}
          onMouseMove={(event: React.MouseEvent) => this.handleMouseMove(event)}
          onMouseUp={(event: React.MouseEvent) => this.handleMouseUp(event)}
          onMouseLeave={(event: React.MouseEvent) => this.handleMouseLeave(event)}
        >
          {elements}
        </OrderableBobinesWrapper>
        {draggedElement}
      </div>
    );
  }
}

const BobineWithPoseWrapper = styled.div`
  user-select: none;
`;

const OrderableBobinesWrapper = styled.div`
  display: flex;
`;
