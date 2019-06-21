import styled from 'styled-components';
import {theme} from '@root/theme';

export const Button = styled.button`
  display: inline-block;
  box-sizing: border-box;
  box-shadow: none;
  border: none;
  outline: none;
  cursor: pointer;

  font-family: ${theme.base.fontFamily};
  font-size: ${theme.button.fontSize}px;
  font-weight: ${theme.button.fontWeight};
  padding: ${theme.button.padding};
  background-color: ${theme.button.defaultBackgroundColor};
  color: ${theme.button.color};
  border-radius: ${theme.button.borderRadius}px;
  opacity: ${props => (props.disabled ? theme.button.disabledOpacity : 1)};
  &:hover {
    background-color: ${theme.button.defaultBackgroundColorHover};
  }
  &:active {
    background-color: ${theme.button.defaultBackgroundColor};
  }
`;
