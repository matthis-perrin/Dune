import styled from 'styled-components';
import {theme} from '@root/theme/default';

export const Button = styled.button`
  display: inline-block;
  font-size: ${theme.button.fontSize}px;
  font-weight: ${theme.button.fontWeight};
  padding: ${theme.button.padding};
  height: ${theme.button.height}px;
  box-sizing: border-box;
  box-shadow: none;
  background-color: ${theme.button.backgroundColor};
  color: ${theme.button.color};
  border-radius: ${theme.button.borderRadius}px;
  opacity: ${props => (props.disabled ? theme.button.disabledOpacity : 1)};
`;
