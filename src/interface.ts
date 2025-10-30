export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Type = "line" | "rect";

export interface Line {
  id: string;
  type: "line";
  // 线段的起点和终点（像素坐标）
  shape: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  z: number;
  style: {
    lineWidth: number; // 空心圆
    stroke: string; // 圆边框颜色
    lineDash?: number[];
  };
  coordinateSystem: null;
}
export type OnChangeParams = Partial<{
  lineWidth: number; // 空心圆
  stroke: string; // 圆边框颜色
  lineDash?: number[];
}>;

export interface TempLine {
  start: Point;
  end: Point;
}

// 监听是否点击了画布
export interface ZRMouseEvent {
  offsetX: number;
  offsetY: number;
  // 其它可能的字段（如需要可扩展）
  [key: string]: unknown;
}

export interface ChartClickParams {
  event: ZRMouseEvent;
  [key: string]: unknown;
}
