import * as React from 'react';
import {css} from 'styled-components';

export interface ReactProps {
  children?: React.ReactNode;
  // styles?: React.CSSProperties;
}

export interface UIComponentProps {
  margin?: number | string;
  marginTop?: number | string;
  marginRight?: number | string;
  marginBottom?: number | string;
  marginLeft?: number | string;
  padding?: number | string;
  paddingTop?: number | string;
  paddingRight?: number | string;
  paddingBottom?: number | string;
  paddingLeft?: number | string;
}

function asPixelString(value: number | string): string {
  if (typeof value === 'string') {
    return value;
  }
  return `${value}px`;
}

/* tslint:disable-next-line:typedef */
export function uiComponentMixin<T = {}>() {
  return css<T & UIComponentProps>`
    ${props => (props.margin ? `margin: ${asPixelString(props.margin)}` : undefined)};
    ${props => (props.marginTop ? `margin-top: ${asPixelString(props.marginTop)}` : undefined)};
    ${props =>
      props.marginRight ? `margin-right: ${asPixelString(props.marginRight)}` : undefined};
    ${props =>
      props.marginBottom ? `margin-bottom: ${asPixelString(props.marginBottom)}` : undefined};
    ${props => (props.marginLeft ? `margin-left: ${asPixelString(props.marginLeft)}` : undefined)};
    ${props => (props.padding ? `padding: ${asPixelString(props.padding)}` : undefined)};
    ${props => (props.paddingTop ? `padding-top: ${asPixelString(props.paddingTop)}` : undefined)};
    ${props =>
      props.paddingRight ? `padding-right: ${asPixelString(props.paddingRight)}` : undefined};
    ${props =>
      props.paddingBottom ? `padding-bottom: ${asPixelString(props.paddingBottom)}` : undefined};
    ${props =>
      props.paddingLeft ? `padding-left: ${asPixelString(props.paddingLeft)}` : undefined};
  `;
}
