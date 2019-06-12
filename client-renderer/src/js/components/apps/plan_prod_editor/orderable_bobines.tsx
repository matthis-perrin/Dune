import * as React from 'react';
import styled from 'styled-components';

import {CURVE_EXTRA_SPACE, BOBINE_STROKE_WIDTH} from '@root/components/common/bobine';
import {BobineWithPose} from '@root/components/common/bobine_with_pose';
import {DivProps} from '@root/components/core/common';
import {CAPACITE_MACHINE} from '@root/lib/constants';

import {getPoseSize} from '@shared/lib/cliches';
import {getRefenteLaizes} from '@shared/lib/refentes';
import {BobineFilleWithPose, Refente} from '@shared/models';

interface OrderableBobinesProps extends DivProps {
  pixelPerMM: number;
  bobines: BobineFilleWithPose[];
  refente: Refente;
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

    if (mmOffset > 0) {
      while (mmOffset > 0) {
        const bobine = bobines[draggedBobineIndex + shiftCount + 1];
        if (!bobine) {
          break;
        }
        const pose = getPoseSize(bobine.pose);
        if (mmOffset < (bobine.laize || 0) * (pose - 0.5)) {
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
        if (Math.abs(mmOffset) < (bobine.laize || 0) * (pose - 0.5)) {
          break;
        }
        mmOffset += (bobine.laize || 0) * pose;
        shiftCount--;
      }
    }

    if (shiftCount === 0) {
      return bobines;
    }

    const newBobines = [...bobines];
    const from = draggedBobineIndex;
    const to = from + shiftCount;
    newBobines.splice(to, 0, newBobines.splice(from, 1)[0]);
    return newBobines;
  }

  private getOffsetSize(): number {
    const {pixelPerMM} = this.props;
    return pixelPerMM * CAPACITE_MACHINE * 2 * CURVE_EXTRA_SPACE;
  }

  private readonly handleMouseMove = (event: React.MouseEvent): void => {
    if (this.state.dragStart !== undefined) {
      this.setState({dragEnd: this.convertPosX(event.clientX)});
    }
  };

  private readonly handleMouseUp = (event: React.MouseEvent): void => {
    this.setState({dragStart: undefined, dragEnd: undefined});
  };

  private readonly handleMouseDown = (event: React.MouseEvent): void => {
    this.setState({dragStart: this.convertPosX(event.clientX), dragEnd: undefined});
  };

  private renderBobineWithPose(
    bobine: BobineFilleWithPose,
    index: number,
    negativeMargin: boolean,
    invisible: boolean
  ): JSX.Element {
    const {pixelPerMM} = this.props;
    return (
      <BobineWithPoseWrapper style={{visibility: invisible ? 'hidden' : 'visible'}}>
        <BobineWithPose
          key={`${bobine.ref}-${index}`}
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
    const elements: JSX.Element[] = this.getNewBobinesOrder(
      draggedBobineIndex,
      dragStart,
      dragEnd
    ).map((bobine, index) =>
      this.renderBobineWithPose(
        bobine,
        index,
        true,
        draggedBobineIndex !== undefined && bobines[draggedBobineIndex] === bobine
      )
    );

    let draggedElement = <React.Fragment />;
    if (dragStart !== undefined && dragEnd !== undefined && draggedBobineIndex !== undefined) {
      const bobine = bobines[draggedBobineIndex];
      const leftPos =
        this.getBobinePosX(draggedBobineIndex) +
        dragEnd -
        dragStart -
        this.getOffsetSize() -
        2 * BOBINE_STROKE_WIDTH;
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
          {this.renderBobineWithPose(bobine, -1, false, false)}
        </div>
      );
    }

    return (
      <div style={{position: 'relative'}}>
        <OrderableBobinesWrapper
          ref={this.wrapperRef}
          onMouseDown={(event: React.MouseEvent) => this.handleMouseDown(event)}
          onMouseMove={(event: React.MouseEvent) => this.handleMouseMove(event)}
          onMouseUp={(event: React.MouseEvent) => this.handleMouseUp(event)}
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
