import { useRef, useEffect, useState } from "react";
import * as echarts from "echarts";
import "echarts/lib/chart/candlestick";
import "echarts/lib/component/tooltip";
import "echarts/lib/component/grid";
import { useDebounceFn } from "ahooks";
import {
  DeleteOutlined,
  EditOutlined,
  PushpinOutlined,
} from "@ant-design/icons";
import Indicator from "./indicator";
import "./index.css";
import RectIcon from "./assets/rect";
import { generateCircle, generateLine, generateRect } from "./utils";
import type { EChartsType } from "echarts";
import type { Point } from "./interface";
import { uniqueId } from "lodash";

// 3. 模拟K线数据
const klineData = [
  [2320.26, 2320.26, 2287.3, 2362.94],
  [2300, 2291.3, 2288.26, 2308.38],
  [2295.35, 2346.5, 2295.35, 2346.92],
  [2347.22, 2358.98, 2337.35, 2363.8],
  [2358.4, 2363.9, 2351.75, 2363.9],
  [2361.65, 2372.62, 2355.48, 2373.42],
  [2373.42, 2330.86, 2328.07, 2373.42],
  [2332.08, 2286.97, 2280.11, 2333.83],
  [2287.1, 2264.93, 2261.43, 2287.1],
  [2264.11, 2277.48, 2253.3, 2277.48],
];
const dateData = [
  "2023-01-01",
  "2023-01-02",
  "2023-01-03",
  "2023-01-04",
  "2023-01-05",
  "2023-01-06",
  "2023-01-07",
  "2023-01-08",
  "2023-01-09",
  "2023-01-10",
];

const TEMP_LINE_ID = uniqueId("line-");
const TEMP_CIRCLE_ID = uniqueId("circle-");
const TEMP_RECT_ID = uniqueId("rect-");
const KLineFreeDraw = () => {
  // 1. 图表实例和容器
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<EChartsType>(null);

  // 2. 状态管理：起点、线段数组
  const [startPoint, setStartPoint] = useState<Point | null>(null); // 起点 {x: 数据x, y: 数据y, pixelX: 像素x, pixelY: 像素y}
  const [lines, setLines] = useState([]); // 所有绘制的线段
  const [tempRect, setTempRect] = useState(null); // 临时矩形（预览用）
  const [confirmedRects, setConfirmedRects] = useState([]); // 已确认的矩形

  // 记录所有点
  const [point, setPoint] = useState([]);

  const [tempLine, setTempLine] = useState<{
    start: Point | null;
    end: Point | null;
  } | null>(null); // 临时线段（随鼠标移动）

  // 是否在编辑
  const [isEditing, setIsEditing] = useState(true);

  const [editLineKey, setEditLineKey] = useState(-1);

  // 默认是线段
  const [type, setType] = useState("line");

  // 4. 初始化图表
  useEffect(() => {
    if (!chartRef.current) return;

    chartInstance.current = echarts.init(chartRef.current);

    // 基础K线配置
    const baseOption = {
      animation: false, // 保留初始渲染动画
      animationUpdate: false, // 关闭数据更新时的过渡动画（核心）
      tooltip: { trigger: "axis" },
      grid: { left: "10%", right: "10%", bottom: "15%", top: "10%" }, // 留出边距，确保点击边缘也能识别
      xAxis: {
        type: "category",
        data: dateData,
        boundaryGap: false,
        name: "日期",
      },
      yAxis: {
        type: "value",
        scale: true,
        name: "价格",
      },
      series: [
        {
          name: "K线",
          type: "candlestick",
          data: klineData,
          itemStyle: {
            color: "#ef232a",
            color0: "#14b143",
            borderColor: "#ef232a",
            borderColor0: "#14b143",
          },
        },
      ],
    };

    chartInstance.current.setOption(baseOption);

    // 窗口 resize 适配
    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      chartInstance.current?.dispose();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const { run } = useDebounceFn(
    (params) => {
      const { offsetX: x, offsetY: y } = params.event;
      if (type === "line") {
        setTempLine({
          start: {
            x: startPoint?.x,
            y: startPoint?.y,
          },
          end: {
            x,
            y,
          },
        });
        return;
      }

      const x1 = startPoint?.x,
        y1 = startPoint?.y;
      const x2 = x,
        y2 = y;
      const rect = {
        id: TEMP_RECT_ID,
        // 左上角坐标（取最小值确保正确定位）
        x: Math.min(x1, x2),
        y: Math.min(y1, y2),
        // 宽高（取绝对值确保为正数）
        width: Math.abs(x2 - x1),
        height: Math.abs(y2 - y1),
      };
      setTempRect(rect);
    },
    {
      wait: 5,
    }
  );
  // 鼠标移动：更新临时线段
  const handleMouseMove = (params) => {
    if (!startPoint) return; // 未长按或无起点，不处理
    run(params);
  };

  // 5. 监听全局点击事件（任意位置点击都触发）
  useEffect(() => {
    if (!chartInstance.current) return;

    const handleClickChart = (params) => {
      if (!isEditing) {
        if (params.componentType === "series" && params.seriesType === "line") {
          const seriesIndex = params.seriesIndex;
          setEditLineKey(seriesIndex);
        }
        return;
      }
    };
    const handleClick = (params) => {
      if (!isEditing) {
        return;
      }
      // 获取点击位置的像素坐标（相对于图表容器的左上角）
      const { offsetX: x, offsetY: y } = params.event;
      const tempPoint = { x, y };

      if (!startPoint) {
        // 第一次点击：保存起点
        setStartPoint(tempPoint);
        setPoint((i) => [...i, tempPoint]);
      } else {
        setStartPoint(null);
        setPoint([]);
        // 生成矩形
        if (type === "rect") {
          setConfirmedRects((i) => [...i, { ...tempRect, id: uniqueId() }]);
          setTempRect(null);
        } else {
          // 第二次点击：生成线段
          const newLine = generateLine(startPoint, tempPoint);
          // 添加线段并清空起点
          setLines((prev) => [...prev, newLine]);
          setEditLineKey(lines.length);
          setTempLine(null);
        }
      }
    };

    const zr = chartInstance.current.getZr();
    // 绑定全局点击事件（图表内任何位置点击都会触发）
    zr.on("click", handleClick);
    chartInstance.current.on("click", handleClickChart);
    zr.on("mousemove", handleMouseMove);

    return () => {
      zr?.off("click", handleClick);
      zr.off("mousemove", handleMouseMove);
      chartInstance.current.off("click", handleClickChart);
    };
  }, [startPoint, isEditing, tempRect]);

  const windowMouseMove = () => {
    if (!isEditing) {
      return;
    }
    const canvas = chartRef.current?.querySelector("canvas");
    if (isEditing) {
      canvas?.classList.add("pencil-cursor"); // 添加铅笔光标样式
    } else {
      canvas?.classList.remove("pencil-cursor"); // 添加铅笔光标样式
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", windowMouseMove);
    return () => {
      window.removeEventListener("mousemove", windowMouseMove);
    };
  }, []);

  // 6. 动态更新线段
  useEffect(() => {
    if (!chartInstance.current) return;

    // 合并K线和所有线段
    const newSeries = [
      {
        name: "K线",
        type: "candlestick",
        data: klineData,
        itemStyle: {
          color: "#ef232a",
          color0: "#14b143",
          borderColor: "#ef232a",
          borderColor0: "#14b143",
        },
      },
    ];

    const graphicElements = point?.map(generateCircle);

    const tempDotElement = tempLine
      ? [generateCircle(tempLine.end, "tempid")]
      : [];

    const tempLineElement = tempLine
      ? [generateLine(tempLine.start, tempLine.end, TEMP_LINE_ID)]
      : [];
    const tempRectElement = tempRect ? [generateRect(tempRect)] : [];

    // 2. 已确认的矩形
    const confirmedRectElements = confirmedRects.map(generateRect);

    chartInstance.current.setOption(
      {
        graphic: {
          elements: [
            ...graphicElements,
            ...lines,
            ...tempLineElement,
            ...tempDotElement,
            ...confirmedRectElements,
            ...tempRectElement,
          ],
        },
        series: newSeries,
        xAxis: {
          type: "category",
          data: dateData, // 时间/类别数据
          // 固定x轴范围（例如：从第0个数据到最后一个数据）
          min: 0, // 最小索引（或具体数据值，如 '2023-01-01'）
          max: dateData.length - 1, // 最大索引（覆盖所有原始数据）
          scale: false, // 关闭自动留白（避免范围扩展）
          boundaryGap: false, // 数据贴边显示，不预留空白
        },
        yAxis: {
          type: "value",
          min: 2000, // 最小价格（根据实际数据调整）
          max: 2500, // 最大价格（根据实际数据调整）
          scale: false, // 关闭自动缩放
        },
      },
      {
        replaceMerge: ["series"], // 明确替换series
        // notMerge: true,
      }
    );
  }, [
    lines,
    klineData.length,
    point.length,
    tempLine,
    confirmedRects,
    tempRect,
  ]);

  // 7. 清除所有线段
  const clearAllLines = () => {
    setLines([]);
    setPoint([]);
    setStartPoint(null);
    setTempLine(null);
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Indicator
        onDelete={() => {
          const temp = [...lines];
          temp.splice(editLineKey - 1, 1);
          setLines(temp);
        }}
        onChangeColor={(color) => {
          const data = lines.map((item, index) => {
            if (index === editLineKey - 1) {
              return {
                ...item,
                lineStyle: {
                  ...item.lineStyle,
                  color,
                },
              };
            }
            return item;
          });
          setLines(data);
        }}
        onChangeWidth={(width) => {
          const data = lines.map((item, index) => {
            if (index === editLineKey - 1) {
              return {
                ...item,
                lineStyle: {
                  ...item.lineStyle,
                  width,
                },
              };
            }
            return item;
          });
          setLines(data);
        }}
        onChangeStyle={(style) => {
          const data = lines.map((item, index) => {
            if (index === editLineKey - 1) {
              return {
                ...item,
                lineStyle: {
                  ...item.lineStyle,
                  type: style,
                },
              };
            }
            return item;
          });
          setLines(data);
        }}
      />
      <div
        style={{
          width: "100vw",
          height: "90vh",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 16,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <PushpinOutlined
            onClick={() => {
              setIsEditing(false);
            }}
          />
          <EditOutlined
            onClick={() => {
              setIsEditing(true);
            }}
          />
          <span
            onClick={() => {
              setType("rect");
            }}
          >
            <RectIcon />
          </span>
          <DeleteOutlined onClick={clearAllLines} />
        </div>
        <div
          ref={chartRef}
          className="pencil-cursor"
          style={{
            width: "100%",
            height: "100%",
          }}
        />
      </div>
    </div>
  );
};

export default KLineFreeDraw;
