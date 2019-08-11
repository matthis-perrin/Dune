import {createGlobalStyle} from 'styled-components';
import {theme} from '@root/theme';

export const PlottableCSS = createGlobalStyle`
  .plottable {
    display: block;
    pointer-events: visibleFill;
    position: relative;
    width: 100%;
    height: 100%;
  }

  .plottable .component {
    position: absolute;
  }

  .plottable .background-container,
  .plottable .content,
  .plottable .foreground-container {
    position: absolute;
    width: 100%;
    height: 100%;
  }

  .plottable .foreground-container {
    pointer-events: none;
  }

  .plottable .component-overflow-hidden {
    overflow: hidden;
  }

  .plottable .component-overflow-visible {
    overflow: visible;
  }

  .plottable .plot-canvas-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .plottable .plot-canvas {
    width: 100%;
    height: 100%;
    transform-origin: 0px 0px 0px;
  }

  .plottable text {
    text-rendering: geometricPrecision;
  }

  .plottable .label text {
    font-family: ${theme.base.fontFamily}, sans-serif;
    fill: white;
  }

  .plottable .bar-label-text-area text {
    font-family: ${theme.base.fontFamily}, sans-serif;
    font-size: 12px;
  }

  .plottable .label-area text {
    fill: white;
    font-family: ${theme.base.fontFamily}, sans-serif;
    font-size: 14px;
  }

  .plottable .light-label text {
    fill: white;
  }

  .plottable .dark-label text {
    fill: white;
  }

  .plottable .off-bar-label text {
    fill: white;
  }

  .plottable .stacked-bar-label text {
    fill: white;
    font-style: normal;
  }

  .plottable .stacked-bar-plot .off-bar-label {
    visibility: hidden !important;
  }

  .plottable .axis-label text {
    font-size: 10px;
    font-weight: bold;
    letter-spacing: 1px;
    line-height: normal;
    text-transform: uppercase;
  }

  .plottable .title-label text {
    font-size: 20px;
    font-weight: bold;
  }

  .plottable .axis line.baseline {
    stroke: ${theme.cadencier.lineColor};
    stroke-width: 1px;
  }

  .plottable .axis line.tick-mark {
    stroke: ${theme.cadencier.lineColor};
    stroke-width: 1px;
  }

  .plottable .axis text {
    fill: white;
    font-family: ${theme.base.fontFamily}, sans-serif;
    font-size: 12px;
    font-weight: 200;
    line-height: normal;
  }

  .plottable .axis .annotation-circle {
    fill: white;
    stroke-width: 1px;
    stroke: ${theme.cadencier.lineColor};
  }

  .plottable .axis .annotation-line {
    stroke: ${theme.cadencier.lineColor};
    stroke-width: 1px;
  }

  .plottable .axis .annotation-rect {
    stroke: ${theme.cadencier.lineColor};
    stroke-width: 1px;
    fill: white;
  }

  .plottable .bar-plot .baseline {
    stroke: #999;
  }

  .plottable .gridlines line {
    stroke: ${theme.cadencier.gridLineColor};
    opacity: 0.25;
    stroke-width: 1px;
  }

  .plottable .selection-box-layer .selection-area {
    fill: black;
    fill-opacity: 0.03;
    stroke: ${theme.cadencier.lineColor};
  }
  .plottable .drag-box-layer.x-resizable .drag-edge-lr {
    cursor: ew-resize;
  }
  .plottable .drag-box-layer.y-resizable .drag-edge-tb {
    cursor: ns-resize;
  }

  .plottable .drag-box-layer.x-resizable.y-resizable .drag-corner-tl {
    cursor: nwse-resize;
  }
  .plottable .drag-box-layer.x-resizable.y-resizable .drag-corner-tr {
    cursor: nesw-resize;
  }
  .plottable .drag-box-layer.x-resizable.y-resizable .drag-corner-bl {
    cursor: nesw-resize;
  }
  .plottable .drag-box-layer.x-resizable.y-resizable .drag-corner-br {
    cursor: nwse-resize;
  }

  .plottable .drag-box-layer.movable .selection-area {
    cursor: move;
    cursor: -moz-grab;
    cursor: -webkit-grab;
    cursor: grab;
  }

  .plottable .drag-box-layer.movable .selection-area:active {
    cursor: -moz-grabbing;
    cursor: -webkit-grabbing;
    cursor: grabbing;
  }

  .plottable .guide-line-layer line.guide-line {
    stroke: ${theme.cadencier.lineColor};
    stroke-width: 1px;
  }

  .plottable .drag-line-layer.enabled.vertical line.drag-edge {
    cursor: ew-resize;
  }

  .plottable .drag-line-layer.enabled.horizontal line.drag-edge {
    cursor: ns-resize;
  }

  .plottable .legend text {
    fill: white;
    font-family: ${theme.base.fontFamily}, sans-serif;
    font-size: 12px;
    font-weight: bold;
    line-height: normal;
  }

  .plottable .interpolated-color-legend rect.swatch-bounding-box {
    fill: none;
    stroke: ${theme.cadencier.lineColor};
    stroke-width: 1px;
    pointer-events: none;
  }

  .plottable .waterfall-plot line.connector {
    stroke: ${theme.cadencier.lineColor};
    stroke-width: 1px;
  }

  .plottable .pie-plot .arc.outline {
    stroke-linejoin: round;
  }
`;

export const PlottableSpeedCSS = createGlobalStyle`
  .plottable {
    display: block;
    pointer-events: visibleFill;
    position: relative;
    width: 100%;
    height: 100%;
  }

  .plottable .component {
    position: absolute;
  }

  .plottable .background-container,
  .plottable .content,
  .plottable .foreground-container {
    position: absolute;
    width: 100%;
    height: 100%;
  }

  .plottable .foreground-container {
    pointer-events: none;
  }

  .plottable .component-overflow-hidden {
    overflow: hidden;
  }

  .plottable .component-overflow-visible {
    overflow: visible;
  }

  .plottable .plot-canvas-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .plottable .plot-canvas {
    width: 100%;
    height: 100%;
    transform-origin: 0px 0px 0px;
  }

  .plottable text {
    text-rendering: geometricPrecision;
  }

  .plottable .label text {
    font-family: ${theme.base.fontFamily}, sans-serif;
    fill: white;
  }

  .plottable .bar-label-text-area text {
    font-family: ${theme.base.fontFamily}, sans-serif;
    font-size: 12px;
  }

  .plottable .label-area text {
    fill: white;
    font-family: ${theme.base.fontFamily}, sans-serif;
    font-size: 14px;
  }

  .plottable .light-label text {
    fill: white;
  }

  .plottable .dark-label text {
    fill: white;
  }

  .plottable .off-bar-label text {
    fill: white;
  }

  .plottable .stacked-bar-label text {
    fill: white;
    font-style: normal;
  }

  .plottable .stacked-bar-plot .off-bar-label {
    visibility: hidden !important;
  }

  .plottable .axis-label text {
    font-size: 10px;
    font-weight: bold;
    letter-spacing: 1px;
    line-height: normal;
    text-transform: uppercase;
  }

  .plottable .title-label text {
    font-size: 20px;
    font-weight: bold;
  }

  .plottable .axis line.baseline {
    stroke: ${theme.cadencier.lineColor};
    stroke-width: 1px;
  }

  .plottable .axis line.tick-mark {
    stroke: ${theme.cadencier.lineColor};
    stroke-width: 1px;
  }

  .plottable .axis text {
    fill: white;
    font-family: ${theme.base.fontFamily}, sans-serif;
    font-size: 12px;
    font-weight: 200;
    line-height: normal;
  }

  .plottable .axis .annotation-circle {
    fill: white;
    stroke-width: 1px;
    stroke: ${theme.cadencier.lineColor};
  }

  .plottable .axis .annotation-line {
    stroke: ${theme.cadencier.lineColor};
    stroke-width: 1px;
  }

  .plottable .axis .annotation-rect {
    stroke: ${theme.cadencier.lineColor};
    stroke-width: 1px;
    fill: white;
  }

  .plottable .bar-area {
    shape-rendering: crispedges;
  }

  .plottable .bar-plot .baseline {
    stroke: #999;
  }

  .plottable .gridlines line {
    stroke: black;
    opacity: 0.25;
    stroke-width: 1px;
  }

  .plottable .selection-box-layer .selection-area {
    fill: black;
    fill-opacity: 0.03;
    stroke: white;
  }
  .plottable .drag-box-layer.x-resizable .drag-edge-lr {
    cursor: ew-resize;
  }
  .plottable .drag-box-layer.y-resizable .drag-edge-tb {
    cursor: ns-resize;
  }

  .plottable .drag-box-layer.x-resizable.y-resizable .drag-corner-tl {
    cursor: nwse-resize;
  }
  .plottable .drag-box-layer.x-resizable.y-resizable .drag-corner-tr {
    cursor: nesw-resize;
  }
  .plottable .drag-box-layer.x-resizable.y-resizable .drag-corner-bl {
    cursor: nesw-resize;
  }
  .plottable .drag-box-layer.x-resizable.y-resizable .drag-corner-br {
    cursor: nwse-resize;
  }

  .plottable .drag-box-layer.movable .selection-area {
    cursor: move;
    cursor: -moz-grab;
    cursor: -webkit-grab;
    cursor: grab;
  }

  .plottable .drag-box-layer.movable .selection-area:active {
    cursor: -moz-grabbing;
    cursor: -webkit-grabbing;
    cursor: grabbing;
  }

  .plottable .guide-line-layer line.guide-line {
    stroke: ${theme.cadencier.lineColor};
    stroke-width: 1px;
  }

  .plottable .drag-line-layer.enabled.vertical line.drag-edge {
    cursor: ew-resize;
  }

  .plottable .drag-line-layer.enabled.horizontal line.drag-edge {
    cursor: ns-resize;
  }

  .plottable .legend text {
    fill: white;
    font-family: ${theme.base.fontFamily}, sans-serif;
    font-size: 12px;
    font-weight: bold;
    line-height: normal;
  }

  .plottable .interpolated-color-legend rect.swatch-bounding-box {
    fill: none;
    stroke: ${theme.cadencier.lineColor};
    stroke-width: 1px;
    pointer-events: none;
  }

  .plottable .waterfall-plot line.connector {
    stroke: ${theme.cadencier.lineColor};
    stroke-width: 1px;
  }

  .plottable .pie-plot .arc.outline {
    stroke-linejoin: round;
  }

  .plottable .component-group {
    background-color: white;
  }
`;
