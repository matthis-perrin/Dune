import styled from 'styled-components';
import {ReactProps, uiComponentMixin, UIComponentProps} from '@root/components/core/common';

export interface FlexParentProps extends ReactProps, UIComponentProps {
  // Flex Props
  flexDirection?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  justifyContent?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
  alignContent?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
  // Component Props
  fullWidth?: boolean;
  fullHeight?: boolean;
}

export const FlexParent = styled.div`
  display: flex;
  ${(props: FlexParentProps) => `
    flex-direction: ${props.flexDirection || 'initial'};
    flex-wrap: ${props.flexWrap || 'initial'};
    justify-content: ${props.justifyContent || 'initial'};
    align-items: ${props.alignItems || 'initial'};
    align-content: ${props.alignContent || 'initial'};
    width: ${props.fullWidth ? '100%' : 'auto'};
    height: ${props.fullHeight ? '100%' : 'auto'};
    box-sizing: ${(props.fullWidth || props.fullHeight) && props.padding ? 'border-box' : 'initial'}
  `} ${uiComponentMixin<FlexParentProps>()};
`;

export interface FlexChildProps extends ReactProps, UIComponentProps {
  order?: number;
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: number | string;
  alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
  flex?: boolean;
}

export const FlexChild = styled.div`
  ${(props: FlexChildProps) => `
    display: ${props.flex ? 'flex' : 'initial'};
    order: ${props.order || 'initial'};
    flex-grow: ${props.flexGrow || 'initial'};
    flex-shrink: ${props.flexShrink || 'initial'};
    flex-basis: ${props.flexBasis || 'initial'};
    align-self: ${props.alignSelf || 'initial'};
  `} ${uiComponentMixin<FlexChildProps>()};
`;
