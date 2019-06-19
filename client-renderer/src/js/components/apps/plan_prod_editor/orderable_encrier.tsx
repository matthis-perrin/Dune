import {isEqual, range} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {Encrier, ENCRIER_HEIGHT} from '@root/components/apps/plan_prod_editor/encrier';
import {DivProps} from '@root/components/core/common';

import {EncrierColor} from '@shared/lib/encrier';
import {BobineFilleWithPose, Refente} from '@shared/models';

interface OrderableEncrierProps extends DivProps {
  pixelPerMM: number;
  selectedBobines: BobineFilleWithPose[];
  selectedRefente?: Refente;
  encrierColors: EncrierColor[];
  allValidEncrierColors: EncrierColor[][];
  onReorder(newOrder: EncrierColor[]): void;
}

interface OrderableEncrierState {
  dragStart?: number;
  dragEnd?: number;
}

export class OrderableEncrier extends React.Component<
  OrderableEncrierProps,
  OrderableEncrierState
> {
  private readonly wrapperRef = React.createRef<HTMLDivElement>();
  public static displayName = 'OrderableEncrier';

  constructor(props: OrderableEncrierProps) {
    super(props);
    this.state = {};
  }

  private getDraggedEncrierIndex(): number | undefined {
    const {dragStart} = this.state;
    if (!dragStart) {
      return undefined;
    }
    return this.getEncrierIndexAtPos(dragStart);
  }

  private getEncrierIndexAtPos(posY: number): number {
    return Math.floor(posY / ENCRIER_HEIGHT);
  }

  private convertPosY(y: number): number {
    if (this.wrapperRef.current) {
      const wrapperOffset = this.wrapperRef.current.getBoundingClientRect().top;
      const posY = y - wrapperOffset;
      return posY;
    }
    return y;
  }

  private readonly isTargettingMovableEncrier = (event: React.MouseEvent): boolean => {
    const {encrierColors, allValidEncrierColors} = this.props;
    if (allValidEncrierColors.length === 1) {
      return false;
    }
    const posY = this.convertPosY(event.clientY);
    const encrierIndex = this.getEncrierIndexAtPos(posY);

    for (const index of range(encrierColors.length)) {
      if (index !== encrierIndex) {
        const newEncriersOrder = [...encrierColors];
        newEncriersOrder.splice(index, 0, newEncriersOrder.splice(encrierIndex, 1)[0]);
        if (this.isValidEncrierColors(newEncriersOrder)) {
          return true;
        }
      }
    }
    return false;
  };

  private readonly handleMouseMove = (event: React.MouseEvent): void => {
    if (this.state.dragStart !== undefined) {
      this.setState({dragEnd: this.convertPosY(event.clientY)});
    }
  };

  private readonly handleMouseUp = (event: React.MouseEvent): void => {
    const {onReorder} = this.props;
    const {dragStart, dragEnd} = this.state;
    const draggedEncrierIndex = this.getDraggedEncrierIndex();
    const newEncriersOrder = this.getNewEncriersOrder(draggedEncrierIndex, dragStart, dragEnd);
    onReorder(newEncriersOrder.reverse());
    this.setState({dragStart: undefined, dragEnd: undefined});
  };

  private readonly handleMouseDown = (event: React.MouseEvent): void => {
    if (this.isTargettingMovableEncrier(event)) {
      this.setState({dragStart: this.convertPosY(event.clientY), dragEnd: undefined});
    } else {
      this.setState({dragStart: undefined, dragEnd: undefined});
    }
  };

  private isValidEncrierColors(encrierColors: EncrierColor[]): boolean {
    const {allValidEncrierColors} = this.props;
    const reversed = [...encrierColors].reverse();
    for (const validEncrierColors of allValidEncrierColors) {
      if (isEqual(reversed, validEncrierColors)) {
        return true;
      }
    }
    return false;
  }

  private getNewEncriersOrder(
    draggedEncrierIndex?: number,
    dragStart?: number,
    dragEnd?: number
  ): EncrierColor[] {
    const {encrierColors} = this.props;
    const encrierOrder = [...encrierColors].reverse();
    if (draggedEncrierIndex === undefined || dragStart === undefined || dragEnd === undefined) {
      return encrierOrder;
    }
    const offsetInPx = dragEnd - dragStart;
    const offsetSign = offsetInPx > 0 ? 1 : -1;
    const offsetInEncrier = Math.round((dragEnd - dragStart) / ENCRIER_HEIGHT);
    const newIndex = Math.min(
      encrierOrder.length - 1,
      Math.max(0, draggedEncrierIndex + offsetInEncrier)
    );

    if (newIndex === draggedEncrierIndex) {
      return encrierOrder;
    }

    // We shift the encrier one by one and save the position if it is valid
    let lastValidEncrierOrder = encrierOrder;

    range(newIndex - draggedEncrierIndex + offsetSign).forEach(i => {
      const destinationIndex = draggedEncrierIndex + i;
      const newEncriersOrder = [...encrierOrder];
      newEncriersOrder.splice(
        destinationIndex,
        0,
        newEncriersOrder.splice(draggedEncrierIndex, 1)[0]
      );
      if (this.isValidEncrierColors(newEncriersOrder)) {
        lastValidEncrierOrder = newEncriersOrder;
      }
    });
    return lastValidEncrierOrder;
  }

  public render(): JSX.Element {
    const {pixelPerMM, selectedBobines, selectedRefente, encrierColors} = this.props;
    const {dragStart, dragEnd} = this.state;
    const draggedEncrierIndex = this.getDraggedEncrierIndex();
    const reversedEncrierColors = [...encrierColors].reverse();
    const orderedEncriers = this.getNewEncriersOrder(draggedEncrierIndex, dragStart, dragEnd);

    let draggedElement = <React.Fragment />;
    if (dragStart !== undefined && dragEnd !== undefined && draggedEncrierIndex !== undefined) {
      const encrier = reversedEncrierColors[draggedEncrierIndex];
      const topPos = draggedEncrierIndex * ENCRIER_HEIGHT + dragEnd - dragStart;
      draggedElement = (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: topPos,
            zIndex: 50,
            pointerEvents: 'none',
          }}
        >
          <Encrier
            pixelPerMM={pixelPerMM}
            selectedBobines={selectedBobines}
            selectedRefente={selectedRefente}
            encrierColor={encrier}
          />
        </div>
      );
    }

    return (
      <div style={{position: 'relative'}}>
        <OrderableEncrierWrapper
          style={{
            userSelect: 'none',
          }}
          ref={this.wrapperRef}
          onMouseDown={(event: React.MouseEvent) => this.handleMouseDown(event)}
          onMouseMove={(event: React.MouseEvent) => this.handleMouseMove(event)}
          onMouseUp={(event: React.MouseEvent) => this.handleMouseUp(event)}
        >
          {orderedEncriers.map(encrierColor => {
            return (
              <Encrier
                style={{
                  visibility:
                    dragStart !== undefined &&
                    dragEnd !== undefined &&
                    draggedEncrierIndex !== undefined &&
                    reversedEncrierColors[draggedEncrierIndex] === encrierColor
                      ? 'hidden'
                      : 'visible',
                }}
                pixelPerMM={pixelPerMM}
                selectedBobines={selectedBobines}
                selectedRefente={selectedRefente}
                encrierColor={encrierColor}
              />
            );
          })}
        </OrderableEncrierWrapper>
        {draggedElement}
      </div>
    );
  }
}

const OrderableEncrierWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
`;
