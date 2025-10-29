import { uniqueId } from "lodash";
import type { Line, Point } from "./interface";
import type { ECElementEvent } from "echarts";

const generateRect = (data) => {
  const newRect = {
    $action: "replace",
    type: "rect", // 图形类型：矩形
    id: data.id ?? uniqueId(),
    left: data.x, // 左上角x（像素坐标）
    top: data.y, // 左上角y（像素坐标）
    shape: {
      width: data.width, // 宽度
      height: data.height, // 高度
    },
    style: {
      fill: "rgba(255, 165, 0, 0.1)", // 填充半透明橙色
      stroke: "#ff9500", // 边框色
      lineWidth: 2, // 边框粗细
    },
    coordinateSystem: null,
    z: 10, // 矩形在圆下方
  };

  return newRect;
};

const generateLine = (start: Point, end: Point, id?: string): Line => {
  const newLine = {
    $action: "replace",
    id: id || uniqueId(),
    type: "line",
    // 线段的起点和终点（像素坐标）
    shape: {
      x1: start.x,
      y1: start.y,
      x2: end.x,
      y2: end.y,
    },
    z: 10,
    style: {
      stroke: "solid", // 空心圆
      lineWidth: 2,
    },
    coordinateSystem: null, // 像素级定位（不依赖坐标轴）
  } as Line;
  return newLine;
};

const generateCircle = (dot: { x: number; y: number }, id?: string) => ({
  $action: "replace",
  id: id || uniqueId(),
  type: "circle", // 图形类型：圆形
  left: dot.x - 6, // 像素x坐标（相对于图表容器）
  top: dot.y - 6, // 像素y坐标（相对于图表容器）
  shape: {
    r: 6,
  },
  z: 20,
  style: {
    fill: "black", // 填充色
    stroke: "#1890ff", // 边框色
    lineWidth: 2, // 边框宽度
  },
  coordinateSystem: null,
});

// 2. 辅助函数：判断鼠标是否靠近线段（碰撞检测）
const isPointNearLine = (mouseParams: ECElementEvent, line: Line) => {
  const { offsetX: mx, offsetY: my } = mouseParams; // 鼠标像素坐标
  const { x1, y1, x2, y2 } = line.shape;

  // 计算鼠标到线段的垂直距离（简化版）
  const A = mx - x1;
  const B = my - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  const dotProduct = A * C + B * D; // 点积
  const lineLengthSquared = C * C + D * D; // 线段长度的平方
  let t = dotProduct / lineLengthSquared;

  // 限制 t 在 [0, 1] 范围内（线段两端的延长线不计入）
  t = Math.max(0, Math.min(1, t));
  // 计算线段上最近点的坐标
  const nearestX = x1 + t * C;
  const nearestY = y1 + t * D;
  // 计算鼠标到最近点的距离
  const distanceSquared = (mx - nearestX) ** 2 + (my - nearestY) ** 2;
  // 距离小于 5px（25 = 5²）视为悬浮
  return distanceSquared < 25;
};

export { generateRect, generateLine, generateCircle, isPointNearLine };
