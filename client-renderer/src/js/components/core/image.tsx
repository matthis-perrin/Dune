import styled from 'styled-components';
import {ReactProps, uiComponentMixin, UIComponentProps} from '@root/components/core/common';

export interface ImageProps extends ReactProps, UIComponentProps {
  width: number;
  height: number;
  src: string;
  backgroundColor?: string;
}

export const Image = styled.div`
  background-position: center center;
  background-size: contain;
  background-repeat: no-repeat;
  ${(props: ImageProps) => `
    width: ${props.width}px;
    height: ${props.height}px;
    background-color: ${props.backgroundColor || 'transparent'};
    background-image: url(${props.src});
  `} ${uiComponentMixin<ImageProps>()};
`;
