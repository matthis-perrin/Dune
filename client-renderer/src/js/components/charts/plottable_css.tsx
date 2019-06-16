import {createGlobalStyle} from 'styled-components';

export const PlottableCSS = createGlobalStyle`
  .plottable-colors-0 {
    background-color: #5279c7;
  }

  .plottable-colors-1 {
    background-color: #fd373e;
  }

  .plottable-colors-2 {
    background-color: #63c261;
  }

  .plottable-colors-3 {
    background-color: #fad419;
  }

  .plottable-colors-4 {
    background-color: #2c2b6f;
  }

  .plottable-colors-5 {
    background-color: #ff7939;
  }

  .plottable-colors-6 {
    background-color: #db2e65;
  }

  .plottable-colors-7 {
    background-color: #99ce50;
  }

  .plottable-colors-8 {
    background-color: #962565;
  }

  .plottable-colors-9 {
    background-color: #06cccc;
  }
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
    font-family: "Helvetica Neue", sans-serif;
    fill: #32313F;
  }

  .plottable .bar-label-text-area text {
    font-family: "Helvetica Neue", sans-serif;
    font-size: 12px;
  }

  .plottable .label-area text {
    fill: #32313F;
    font-family: "Helvetica Neue", sans-serif;
    font-size: 14px;
  }

  .plottable .light-label text {
    fill: white;
  }

  .plottable .dark-label text {
    fill: #32313F;
  }

  .plottable .off-bar-label text {
    fill: #32313F;
  }

  .plottable .stacked-bar-label text {
    fill: #32313F;
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
    stroke: #CCC;
    stroke-width: 1px;
  }

  .plottable .axis line.tick-mark {
    stroke: #CCC;
    stroke-width: 1px;
  }

  .plottable .axis text {
    fill: #32313F;
    font-family: "Helvetica Neue", sans-serif;
    font-size: 12px;
    font-weight: 200;
    line-height: normal;
  }

  .plottable .axis .annotation-circle {
    fill: white;
    stroke-width: 1px;
    stroke: #CCC;
  }

  .plottable .axis .annotation-line {
    stroke: #CCC;
    stroke-width: 1px;
  }

  .plottable .axis .annotation-rect {
    stroke: #CCC;
    stroke-width: 1px;
    fill: white;
  }

  .plottable .bar-plot .baseline {
    stroke: #999;
  }

  .plottable .gridlines line {
    stroke: #3C3C3C;
    opacity: 0.25;
    stroke-width: 1px;
  }

  .plottable .selection-box-layer .selection-area {
    fill: black;
    fill-opacity: 0.03;
    stroke: #CCC;
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
    stroke: #CCC;
    stroke-width: 1px;
  }

  .plottable .drag-line-layer.enabled.vertical line.drag-edge {
    cursor: ew-resize;
  }

  .plottable .drag-line-layer.enabled.horizontal line.drag-edge {
    cursor: ns-resize;
  }

  .plottable .legend text {
    fill: #32313F;
    font-family: "Helvetica Neue", sans-serif;
    font-size: 12px;
    font-weight: bold;
    line-height: normal;
  }

  .plottable .interpolated-color-legend rect.swatch-bounding-box {
    fill: none;
    stroke: #CCC;
    stroke-width: 1px;
    pointer-events: none;
  }

  .plottable .waterfall-plot line.connector {
    stroke: #CCC;
    stroke-width: 1px;
  }

  .plottable .pie-plot .arc.outline {
    stroke-linejoin: round;
  }
`;