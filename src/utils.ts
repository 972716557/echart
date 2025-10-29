import { uniqueId } from "lodash";
import type { Point } from "./interface";

const generateRect = (data) => {
  const newRect = {
    type: "custom", // 自定义系列类型
    renderItem: (params, api) => {
      // 获取当前矩形的数据（来自 rectData[params.dataIndex]）
      const rect = api.value(0); // 从 data 中取出矩形参数

      // 返回矩形的图形描述
      return {
        type: "rect", // 图形类型：矩形
        shape: {
          x: rect.x, // 左上角 x 坐标
          y: rect.y, // 左上角 y 坐标
          width: rect.width, // 宽度
          height: rect.height, // 高度
        },
        style: rect.style, // 样式（填充、边框等）
      };
    },
    data: data.map((rect) => [rect]), // 将矩形数据传递给 renderItem（注意格式）
  };

  return newRect;
};

const generateLine = (start: Point, end: Point, id?: string) => {
  const newLine = {
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
      fill: "transparent", // 空心圆
      stroke: "#1890ff", // 圆边框颜色
      lineWidth: 2,
    },
    coordinateSystem: null, // 像素级定位（不依赖坐标轴）
    // markPoint: {
    //   symbol: "circle",
    //   symbolSize: 8,
    //   itemStyle: {
    //     color: "#fff",
    //     borderColor: "#ff0000",
    //     borderWidth: 2,
    //   },
    //   data: [], // 初始为空数组
    // },
  };
  return newLine;
};

const generateCircle = (dot, id) => ({
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
// 5. 坐标转换工具（像素坐标 -> 数据坐标）
const convertPixelToData = (pixelX: number, pixelY: number) => {
  if (!chartInstance.current) return null;
  const dataCoord = chartInstance.current.convertFromPixel({ seriesIndex: 0 }, [
    pixelX,
    pixelY,
  ]);
  return {
    x: Math.round(dataCoord[0]),
    y: Number(dataCoord[1].toFixed(2)),
  };
};

// 辅助函数：判断鼠标是否靠近线段（简化的碰撞检测）
const isPointNearLine = (mouseParams, line) => {
  const { offsetX: mx, offsetY: my } = mouseParams;
  const { x: x1, y: y1 } = line.start;
  const { x: x2, y: y2 } = line.end;

  // 计算鼠标到线段的距离（简化版，实际可优化精度）
  const A = mx - x1;
  const B = my - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  if (lenSq !== 0) param = dot / lenSq;
  let xx, yy;
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  const dx = mx - xx;
  const dy = my - yy;
  return dx * dx + dy * dy < 25; // 距离小于5px视为悬浮（25=5²）
};

export { generateRect, generateLine, generateCircle, convertPixelToData };
