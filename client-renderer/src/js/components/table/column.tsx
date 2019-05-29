import * as React from 'react';
import styled from 'styled-components';

import {SVGIcon} from '@root/components/core/svg_icon';
import {theme} from '@root/theme/default';

export type ColumnSortMode = 'asc' | 'desc' | 'none';
export enum ColumnType {
  String,
  Number,
  Date,
  Boolean,
}

interface ColumnHeaderProps {
  sort: ColumnSortMode;
  type: ColumnType;
  title: string;
  isFirst: boolean;
  isLast: boolean;
  onClick?(evt: React.MouseEvent): void;
}

export class ColumnHeader extends React.Component<ColumnHeaderProps> {
  public render(): JSX.Element {
    const {sort, title, onClick, type, isFirst, isLast} = this.props;

    const titleWrapper = <TitleWrapper>{title}</TitleWrapper>;
    const icon =
      sort === 'none' ? (
        <React.Fragment />
      ) : sort === 'desc' ? (
        <SortingIcon name="caret-down" width={theme.table.headerIconSize} />
      ) : (
        <SortingIcon name="caret-up" width={theme.table.headerIconSize} />
      );

    const wrapperProps = {isFirst, isLast, onClick};
    if (type === ColumnType.Number) {
      return (
        <NumberColumnHeaderWrapper {...wrapperProps}>
          {titleWrapper}
          {icon}
        </NumberColumnHeaderWrapper>
      );
    }
    return (
      <ColumnHeaderWrapper {...wrapperProps}>
        {titleWrapper}
        {icon}
      </ColumnHeaderWrapper>
    );
  }
}

const SortingIcon = styled(SVGIcon)`
  flex-shrink: 0;
  fill: ${theme.table.headerColor};
  margin-left: ${theme.table.headerIconSpacing}px;
`;

const TitleWrapper = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ColumnHeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: ${theme.table.headerHeight}px;
  color: ${theme.table.headerColor};
  box-sizing: border-box;
  ${(props: {isFirst: boolean; isLast: boolean}) => `
    padding-left: ${props.isFirst ? theme.table.headerPadding : theme.table.headerPadding / 2}px;
    padding-right: ${props.isLast ? theme.table.headerPadding : theme.table.headerPadding / 2}px;
  `}
  cursor: pointer;
  font-size: ${theme.table.headerFontSize}px;
  font-weight: ${theme.table.headerFontWeight};
`;

const NumberColumnHeaderWrapper = styled(ColumnHeaderWrapper)`
  justify-content: flex-end;
`;
