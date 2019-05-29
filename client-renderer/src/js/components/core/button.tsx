import styled from 'styled-components';
import {theme} from '@root/theme/default';

export const Button = styled.div`
  display: inline-block;
  font-size: ${theme.administration.buttonFontSize}px;
  font-weight: ${theme.administration.buttonFontWeight};
  padding: ${theme.administration.buttonPadding};
  height: ${theme.administration.buttonHeight}px;
  box-sizing: border-box;
  box-shadow: none;
  background-color: ${theme.administration.buttonBackgroundColor};
  color: ${theme.administration.buttonColor};
  border-radius: ${theme.administration.buttonBorderRadius}px;
  cursor: pointer;
`;
