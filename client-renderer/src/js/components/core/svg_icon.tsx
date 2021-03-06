import {omit} from 'lodash-es';
import React from 'react';
import styled from 'styled-components';

import {ReactProps, uiComponentMixin, UIComponentProps} from '@root/components/core/common';

const DEFAULT_ICON_WIDTH = 24;
const DEFAULT_ICON_HEIGHT = 24;

const ICONS = {
  gear: {
    viewBox: '0 0 25 25',
    element: (
      <g>
        <path
          d="M24.38,10.175l-2.231-0.268c-0.228-0.851-0.562-1.655-0.992-2.401l1.387-1.763c0.212-0.271,0.188-0.69-0.057-0.934
		l-2.299-2.3c-0.242-0.243-0.662-0.269-0.934-0.057l-1.766,1.389c-0.743-0.43-1.547-0.764-2.396-0.99L14.825,0.62
		C14.784,0.279,14.469,0,14.125,0h-3.252c-0.344,0-0.659,0.279-0.699,0.62L9.906,2.851c-0.85,0.227-1.655,0.562-2.398,0.991
		L5.743,2.455c-0.27-0.212-0.69-0.187-0.933,0.056L2.51,4.812C2.268,5.054,2.243,5.474,2.456,5.746L3.842,7.51
		c-0.43,0.744-0.764,1.549-0.991,2.4l-2.23,0.267C0.28,10.217,0,10.532,0,10.877v3.252c0,0.344,0.279,0.657,0.621,0.699l2.231,0.268
		c0.228,0.848,0.561,1.652,0.991,2.396l-1.386,1.766c-0.211,0.271-0.187,0.69,0.057,0.934l2.296,2.301
		c0.243,0.242,0.663,0.269,0.933,0.057l1.766-1.39c0.744,0.43,1.548,0.765,2.398,0.991l0.268,2.23
		c0.041,0.342,0.355,0.62,0.699,0.62h3.252c0.345,0,0.659-0.278,0.699-0.62l0.268-2.23c0.851-0.228,1.655-0.562,2.398-0.991
		l1.766,1.387c0.271,0.212,0.69,0.187,0.933-0.056l2.299-2.301c0.244-0.242,0.269-0.662,0.056-0.935l-1.388-1.764
		c0.431-0.744,0.764-1.548,0.992-2.397l2.23-0.268C24.721,14.785,25,14.473,25,14.127v-3.252
		C25,10.529,24.723,10.216,24.38,10.175z M12.501,18.75c-3.452,0-6.25-2.798-6.25-6.25s2.798-6.25,6.25-6.25
		s6.25,2.798,6.25,6.25S15.954,18.75,12.501,18.75z"
        />
      </g>
    ),
  },
  calendar: {
    viewBox: '0 0 29.1 29.1',
    element: (
      <g>
        <path d="M21.7 6.1c1.1 0 2-0.9 2-2V2c0-1.1-0.9-2-2-2s-2 0.9-2 2v2.1C19.7 5.2 20.6 6.1 21.7 6.1z" />
        <path d="M28.9 3.5h-4.1v1c0 1.7-1.4 3.1-3.1 3.1 -1.7 0-3.1-1.4-3.1-3.1V3.5h-8.2v1c0 1.7-1.4 3.1-3.1 3.1s-3.1-1.4-3.1-3.1V3.5L0.2 3.4v25.7H2.3h24.6l2 0L28.9 3.5zM26.9 27.1H2.3V10.7h24.6v16.4H26.9z" />
        <path d="M7.4 6.1c1.1 0 2-0.9 2-2V2C9.4 0.9 8.5 0 7.4 0S5.3 0.9 5.3 2v2.1C5.3 5.2 6.2 6.1 7.4 6.1z" />
        <rect x="10.5" y="12.9" width="3.2" height="2.9" />
        <rect x="15.7" y="12.9" width="3.2" height="2.9" />
        <rect x="20.5" y="12.9" width="3.2" height="2.9" />
        <rect x="10.5" y="17.6" width="3.2" height="2.9" />
        <rect x="15.7" y="17.6" width="3.2" height="2.9" />
        <rect x="20.5" y="17.6" width="3.2" height="2.9" />
        <rect x="10.5" y="22.4" width="3.2" height="2.9" />
        <rect x="5.3" y="17.6" width="3.2" height="2.9" />
        <rect x="5.3" y="22.4" width="3.2" height="2.9" />
        <rect x="15.7" y="22.4" width="3.2" height="2.9" />
        <rect x="20.5" y="22.4" width="3.2" height="2.9" />
      </g>
    ),
  },
  'caret-down': {
    viewBox: '0 0 292.4 292.4',
    element: (
      <g>
        <path d="M286.9 69.4c-3.6-3.6-7.9-5.4-12.8-5.4H18.3c-5 0-9.2 1.8-12.8 5.4C1.8 73 0 77.3 0 82.2c0 4.9 1.8 9.2 5.4 12.8l127.9 127.9c3.6 3.6 7.9 5.4 12.9 5.4s9.2-1.8 12.8-5.4L286.9 95.1c3.6-3.6 5.4-7.9 5.4-12.8C292.4 77.3 290.5 73 286.9 69.4z" />
      </g>
    ),
  },
  'caret-left': {
    viewBox: '0 0 292.4 292.4',
    element: (
      <path
        transform="rotate(180 146.2 146.2)"
        d="M223 133.3L95.1 5.4C91.5 1.8 87.2 0 82.2 0c-5 0-9.2 1.8-12.8 5.4 -3.6 3.6-5.4 7.9-5.4 12.8v255.8c0 4.9 1.8 9.2 5.4 12.8 3.6 3.6 7.9 5.4 12.9 5.4 4.9 0 9.2-1.8 12.8-5.4l127.9-127.9c3.6-3.6 5.4-7.9 5.4-12.8C228.4 141.2 226.6 136.9 223 133.3z"
      />
    ),
  },
  'caret-right': {
    viewBox: '0 0 292.4 292.4',
    element: (
      <path d="M223 133.3L95.1 5.4C91.5 1.8 87.2 0 82.2 0c-5 0-9.2 1.8-12.8 5.4 -3.6 3.6-5.4 7.9-5.4 12.8v255.8c0 4.9 1.8 9.2 5.4 12.8 3.6 3.6 7.9 5.4 12.9 5.4 4.9 0 9.2-1.8 12.8-5.4l127.9-127.9c3.6-3.6 5.4-7.9 5.4-12.8C228.4 141.2 226.6 136.9 223 133.3z" />
    ),
  },
  'caret-up': {
    viewBox: '0 0 292.4 292.4',
    element: (
      <g>
        <path d="M286.9 197.3L159 69.4c-3.6-3.6-7.9-5.4-12.8-5.4s-9.2 1.8-12.8 5.4L5.4 197.3C1.8 200.9 0 205.2 0 210.1s1.8 9.2 5.4 12.8c3.6 3.6 7.9 5.4 12.9 5.4h255.8c4.9 0 9.2-1.8 12.8-5.4 3.6-3.6 5.4-7.9 5.4-12.8S290.5 200.9 286.9 197.3z" />
      </g>
    ),
  },
  check: {
    viewBox: '0 0 26 26',
    element: (
      <path d="m0.3 14c-0.2-0.2-0.3-0.5-0.3-0.7s0.1-0.5 0.3-0.7l1.4-1.4c0.4-0.4 1-0.4 1.4 0l0.1 0.1 5.5 5.9c0.2 0.2 0.5 0.2 0.7 0l13.4-13.9h0.1v0c0.4-0.4 1-0.4 1.4 0l1.4 1.4c0.4 0.4 0.4 1 0 1.4l0 0-16 16.6c-0.2 0.2-0.4 0.3-0.7 0.3-0.3 0-0.5-0.1-0.7-0.3l-7.8-8.4-0.2-0.3z" />
    ),
  },
  cross: {
    viewBox: '0 0 21.9 21.9',
    element: (
      <path d="M14.1 11.3c-0.2-0.2-0.2-0.5 0-0.7l7.5-7.5c0.2-0.2 0.3-0.5 0.3-0.7s-0.1-0.5-0.3-0.7l-1.4-1.4C20 0.1 19.7 0 19.5 0c-0.3 0-0.5 0.1-0.7 0.3l-7.5 7.5c-0.2 0.2-0.5 0.2-0.7 0L3.1 0.3C2.9 0.1 2.6 0 2.4 0S1.9 0.1 1.7 0.3L0.3 1.7C0.1 1.9 0 2.2 0 2.4s0.1 0.5 0.3 0.7l7.5 7.5c0.2 0.2 0.2 0.5 0 0.7l-7.5 7.5C0.1 19 0 19.3 0 19.5s0.1 0.5 0.3 0.7l1.4 1.4c0.2 0.2 0.5 0.3 0.7 0.3s0.5-0.1 0.7-0.3l7.5-7.5c0.2-0.2 0.5-0.2 0.7 0l7.5 7.5c0.2 0.2 0.5 0.3 0.7 0.3s0.5-0.1 0.7-0.3l1.4-1.4c0.2-0.2 0.3-0.5 0.3-0.7s-0.1-0.5-0.3-0.7L14.1 11.3z" />
    ),
  },
  filter: {
    viewBox: '0 0 402.577 402.577',
    element: (
      <path d="M400.9 11.4c-3.2-7.4-8.8-11.1-16.9-11.1H18.6c-8 0-13.6 3.7-16.8 11.1 -3.2 7.8-1.9 14.5 4 20l140.8 140.8v138.8c0 5 1.8 9.2 5.4 12.9l73.1 73.1c3.4 3.6 7.7 5.4 12.9 5.4 2.3 0 4.7-0.5 7.1-1.4 7.4-3.2 11.1-8.9 11.1-16.8V172.2L396.9 31.4C402.8 25.9 404.1 19.2 400.9 11.4z" />
    ),
  },
  link: {
    viewBox: '0 0 466 466',
    element: (
      <path d="M442 284.4l-59.4-59.4c-16-16-35.4-24-58.2-24 -23.2 0-43 8.4-59.4 25.1l-25.1-25.1c16.8-16.4 25.1-36.3 25.1-59.7 0-22.8-7.9-42.2-23.7-58l-58.8-59.1c-15.8-16.2-35.2-24.3-58.2-24.3 -22.8 0-42.2 7.9-58 23.7L24.3 65.4C8.1 81.2 0 100.5 0 123.3c0 22.8 8 42.3 24 58.2l59.4 59.4c16 16 35.4 24 58.2 24 23.2 0 43-8.4 59.4-25.1l25.1 25.1c-16.7 16.4-25.1 36.3-25.1 59.7 0 22.8 7.9 42.2 23.7 58l58.8 59.1c15.8 16.2 35.2 24.3 58.2 24.3 22.8 0 42.2-7.9 58-23.7l42-41.7c16.2-15.8 24.3-35.1 24.3-58C465.9 319.8 458 300.4 442 284.4zM201 162.2c-0.6-0.6-2.3-2.4-5.3-5.4 -2.9-3-5-5.1-6.1-6.1 -1.1-1-3-2.5-5.4-4.3 -2.5-1.8-4.9-3-7.3-3.7 -2.4-0.7-5-1-7.9-1 -7.6 0-14.1 2.7-19.4 8 -5.3 5.3-8 11.8-8 19.4 0 2.9 0.3 5.5 1 7.9 0.7 2.4 1.9 4.8 3.7 7.3 1.8 2.5 3.2 4.3 4.3 5.4 1 1.1 3.1 3.2 6.1 6.1 3 3 4.9 4.7 5.4 5.3 -5.7 5.9-12.6 8.8-20.6 8.8 -7.8 0-14.3-2.6-19.4-7.7L62.8 142.8c-5.3-5.3-8-11.8-8-19.4 0-7.4 2.7-13.8 8-19.1l42-41.7c5.5-5.1 12-7.7 19.4-7.7 7.6 0 14.1 2.7 19.4 8l58.8 59.1c5.3 5.3 8 11.8 8 19.4C210.4 149.3 207.3 156.3 201 162.2zM403.1 361.7l-42 41.7c-5.3 4.9-11.8 7.4-19.4 7.4 -7.8 0-14.3-2.6-19.4-7.7l-58.8-59.1c-5.3-5.3-8-11.8-8-19.4 0-8 3.1-14.9 9.4-20.8 0.6 0.6 2.3 2.4 5.3 5.4 3 3 5 5.1 6.1 6.1 1.1 1.1 2.9 2.5 5.4 4.3 2.5 1.8 4.9 3 7.3 3.7 2.4 0.7 5 1 7.9 1 7.6 0 14.1-2.7 19.4-8 5.3-5.3 8-11.8 8-19.4 0-2.9-0.3-5.5-1-7.9 -0.7-2.4-1.9-4.8-3.7-7.3 -1.8-2.5-3.2-4.3-4.3-5.4 -1-1.1-3.1-3.2-6.1-6.1 -3-2.9-4.9-4.7-5.4-5.3 5.7-6.1 12.6-9.1 20.6-9.1 7.6 0 14.1 2.7 19.4 8l59.4 59.4c5.3 5.3 8 11.8 8 19.4C411.1 350 408.5 356.4 403.1 361.7z" />
    ),
  },
  'new-window': {
    viewBox: '0 0 512 512',
    element: (
      <g>
        <path d="m352 15v30c0 8.3 6.7 15 15 15h42.6l-107 107c-5.9 5.9-5.9 15.4 0 21.2l21.2 21.2c5.9 5.9 15.4 5.9 21.2 0l107-107v42.6c0 8.3 6.7 15 15 15h30c8.3 0 15-6.7 15-15v-130c0-8.3-6.7-15-15-15h-130c-8.3 0-15 6.7-15 15zm0 0" />{' '}
        <path d="m97 460c-24.8 0-45-20.2-45-45v-293h-37c-8.3 0-15 6.7-15 15v360c0 8.3 6.7 15 15 15h360c8.3 0 15-6.7 15-15v-37zm0 0" />{' '}
        <path d="m428.5 168.3-62.3 62.3c-8.5 8.5-19.8 13.2-31.8 13.2 0 0 0 0 0 0-12 0-23.3-4.7-31.8-13.2l-21.2-21.2c-8.5-8.5-13.2-19.8-13.2-31.8 0-12 4.7-23.3 13.2-31.8l62.3-62.3c-8.8-5.4-15.6-13.6-19.1-23.5h-227.6c-8.3 0-15 6.7-15 15v340c0 8.3 6.7 15 15 15h340c8.3 0 15-6.7 15-15v-227.6c-9.8-3.5-18.1-10.3-23.5-19.1zm0 0" />
      </g>
    ),
  },
  pin: {
    viewBox: '0 0 475.1 475.1',
    element: (
      <path d="M379.6 247.4c-14.9-18.7-31.8-28.1-50.7-28.1V73.1c9.9 0 18.5-3.6 25.7-10.8 7.2-7.2 10.9-15.8 10.9-25.7 0-9.9-3.6-18.5-10.9-25.7C347.4 3.6 338.8 0 328.9 0H146.2c-9.9 0-18.5 3.6-25.7 10.9 -7.2 7.2-10.8 15.8-10.8 25.7 0 9.9 3.6 18.5 10.9 25.7 7.2 7.2 15.8 10.8 25.7 10.8v146.2c-18.8 0-35.7 9.4-50.7 28.1 -14.9 18.8-22.4 39.8-22.4 63.2 0 4.9 1.8 9.2 5.4 12.8 3.6 3.6 7.9 5.4 12.9 5.4h115.3l21.7 138.5c1 5.1 4 7.7 9.1 7.7h0.3c2.3 0 4.2-0.8 5.9-2.4 1.6-1.6 2.6-3.6 3-5.9l14.6-137.9h122.5c4.9 0 9.2-1.8 12.8-5.4 3.6-3.6 5.4-7.9 5.4-12.8C402 287.2 394.5 266.1 379.6 247.4zM210.1 210.1c0 2.7-0.9 4.8-2.6 6.6 -1.7 1.7-3.9 2.6-6.6 2.6 -2.7 0-4.9-0.9-6.6-2.6 -1.7-1.7-2.6-3.9-2.6-6.6V82.2c0-2.7 0.9-4.9 2.6-6.6 1.7-1.7 3.9-2.6 6.6-2.6 2.7 0 4.9 0.9 6.6 2.6 1.7 1.7 2.6 3.9 2.6 6.6V210.1z" />
    ),
  },
  progress: {
    viewBox: '0 0 561 561',
    element: (
      <path d="M280.5 76.5V0l-102 102 102 102v-76.5c84.2 0 153 68.9 153 153 0 25.5-7.6 51-17.8 71.4l38.3 38.3C471.8 357 484.5 321.3 484.5 280.5 484.5 168.3 392.7 76.5 280.5 76.5zM280.5 433.5c-84.1 0-153-68.8-153-153 0-25.5 7.7-51 17.9-71.4l-38.2-38.2C89.3 204 76.5 239.7 76.5 280.5c0 112.2 91.8 204 204 204V561l102-102 -102-102V433.5z" />
    ),
  },
  zzz: {
    viewBox: '0 0 69.4 69.4',
    element: (
      <path d="M32.9 34.2H3.8c-1.1 0-2.2-0.7-2.6-1.7 -0.4-1.1-0.2-2.3 0.6-3.1L26.1 5.6H3.8c-1.5 0-2.8-1.3-2.8-2.8C1 1.2 2.3 0 3.8 0h29.1c1.1 0 2.2 0.7 2.6 1.7 0.4 1.1 0.2 2.3-0.6 3.1L10.7 28.6h22.3c1.5 0 2.8 1.3 2.8 2.8C35.8 33 34.5 34.2 32.9 34.2zM65.6 40H51.8l15.7-15.4c0.8-0.8 1.1-2 0.6-3.1 -0.4-1.1-1.5-1.7-2.6-1.7H45c-1.5 0-2.8 1.3-2.8 2.8 0 1.5 1.3 2.8 2.8 2.8h13.7L43 40.8c-0.8 0.8-1.1 2-0.6 3.1 0.4 1.1 1.5 1.8 2.6 1.8h20.6c1.5 0 2.8-1.3 2.8-2.8C68.4 41.2 67.1 40 65.6 40zM33.9 63.8h-9.6L35.9 52.5c0.8-0.8 1.1-2 0.6-3.1 -0.4-1.1-1.5-1.7-2.6-1.7H17.5c-1.5 0-2.8 1.3-2.8 2.8 0 1.5 1.3 2.8 2.8 2.8h9.6L15.6 64.6c-0.8 0.8-1.1 2-0.6 3.1 0.4 1.1 1.5 1.8 2.6 1.8h16.4c1.5 0 2.8-1.3 2.8-2.8S35.5 63.8 33.9 63.8z" />
    ),
  },
};

export type SVGIconName = keyof typeof ICONS;

interface SVGIconProps extends UIComponentProps, ReactProps {
  name: SVGIconName;
  width?: number;
  height?: number;
  color?: string;
}

export class SVGIcon extends React.Component<SVGIconProps> {
  public static displayName = 'SVGIcon';

  public render(): JSX.Element {
    const {name, width = DEFAULT_ICON_WIDTH, height = DEFAULT_ICON_HEIGHT, color} = this.props;
    const {viewBox, element} = ICONS[name];
    const extendedProps = omit(this.props, ['name', 'width', 'height', 'children']);
    return (
      <StyledSVG
        {...extendedProps}
        viewBox={viewBox}
        width={width}
        height={height}
        style={{fill: color}}
      >
        {element}
      </StyledSVG>
    );
  }
}

const StyledSVG = styled.svg`
  ${uiComponentMixin};
`;
