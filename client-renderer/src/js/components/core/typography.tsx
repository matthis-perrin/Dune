import * as React from 'react';
import styled from 'styled-components';

import {ReactProps, uiComponentMixin, UIComponentProps} from '@root/components/core/common';
import {theme} from '@root/theme/default';

type TypographyProps = UIComponentProps & ReactProps;

//
// HEADER
//

class Header extends React.Component<TypographyProps, {}> {
  public static displayName = 'Header';
  public render(): JSX.Element {
    return <StyledHeader {...this.props}>{this.props.children}</StyledHeader>;
  }
}

const StyledHeader = styled.h1`
  margin: 0;
  padding: 0;
  font-family: ${theme.typography.header.fontFamily};
  font-size: ${theme.typography.header.fontSize};
  font-weight: ${theme.typography.header.fontWeight};
  line-height: ${theme.typography.header.fontSize};
  ${uiComponentMixin};
`;

//
// SUB HEADER
//

class SubHeader extends React.Component<TypographyProps, {}> {
  public static displayName = 'SubHeader';
  public render(): JSX.Element {
    return <StyledSubHeader {...this.props}>{this.props.children}</StyledSubHeader>;
  }
}

const StyledSubHeader = styled.h2`
  margin: 0;
  padding: 0;
  font-family: ${theme.typography.subHeader.fontFamily};
  font-size: ${theme.typography.subHeader.fontSize};
  font-weight: ${theme.typography.subHeader.fontWeight};
  line-height: ${theme.typography.subHeader.fontSize};
  ${uiComponentMixin};
`;

//
// TITLE
//

class Title extends React.Component<TypographyProps, {}> {
  public static displayName = 'Title';
  public render(): JSX.Element {
    return <StyledTitle {...this.props}>{this.props.children}</StyledTitle>;
  }
}

const StyledTitle = styled.h3`
  margin: 0;
  padding: 0;
  font-family: ${theme.typography.title.fontFamily};
  font-size: ${theme.typography.title.fontSize};
  font-weight: ${theme.typography.title.fontWeight};
  line-height: ${theme.typography.title.fontSize};
  ${uiComponentMixin};
`;

//
// SUB TITLE
//

class SubTitle extends React.Component<TypographyProps, {}> {
  public static displayName = 'SubTitle';
  public render(): JSX.Element {
    return <StyledSubTitle {...this.props}>{this.props.children}</StyledSubTitle>;
  }
}

const StyledSubTitle = styled.h4`
  margin: 0;
  padding: 0;
  font-family: ${theme.typography.subTitle.fontFamily};
  font-size: ${theme.typography.subTitle.fontSize};
  font-weight: ${theme.typography.subTitle.fontWeight};
  line-height: ${theme.typography.subTitle.fontSize};
  ${uiComponentMixin};
`;

//
// BASE
//

class Base extends React.Component<TypographyProps, {}> {
  public static displayName = 'Base';
  public render(): JSX.Element {
    return <StyledBase {...this.props}>{this.props.children}</StyledBase>;
  }
}

const StyledBase = styled.div`
  margin: 0;
  padding: 0;
  font-family: ${theme.typography.base.fontFamily};
  font-size: ${theme.typography.base.fontSize};
  font-weight: ${theme.typography.base.fontWeight};
  line-height: ${theme.typography.base.fontSize};
  ${uiComponentMixin};
`;

//
// Body
//

class Body extends React.Component<TypographyProps, {}> {
  public static displayName = 'Body';
  public render(): JSX.Element {
    return <StyledBody {...this.props}>{this.props.children}</StyledBody>;
  }
}

const StyledBody = styled.div`
  margin: 0;
  padding: 0;
  font-family: ${theme.typography.body.fontFamily};
  font-size: ${theme.typography.body.fontSize};
  font-weight: ${theme.typography.body.fontWeight};
  line-height: ${theme.typography.body.fontSize};
  ${uiComponentMixin};
`;

//
// Caption
//

class Caption extends React.Component<TypographyProps, {}> {
  public static displayName = 'Caption';
  public render(): JSX.Element {
    return <StyledCaption {...this.props}>{this.props.children}</StyledCaption>;
  }
}

const StyledCaption = styled.div`
  margin: 0;
  padding: 0;
  font-family: ${theme.typography.caption.fontFamily};
  font-size: ${theme.typography.caption.fontSize};
  font-weight: ${theme.typography.caption.fontWeight};
  line-height: ${theme.typography.caption.fontSize};
  ${uiComponentMixin};
`;

// Exports
export const Typo = {
  Header,
  SubHeader,
  Title,
  SubTitle,
  Base,
  Body,
  Caption,
};
