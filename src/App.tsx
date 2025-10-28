import React, { useRef, useEffect, useState, use } from "react";
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
import { generateLine, generateRect } from "./utils";
// import "echarts/lib/component/xAxis";
// import "echarts/lib/component/yAxis";

const KLineFreeDraw = () => {
  // 1. 图表实例和容器
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef(null);

  // 2. 状态管理：起点、线段数组
  const [startPoint, setStartPoint] = useState(null); // 起点 {x: 数据x, y: 数据y, pixelX: 像素x, pixelY: 像素y}
  const [lines, setLines] = useState([]); // 所有绘制的线段
  const [rects, setRects] = useState([]);
  const [rectsPosition, setRectsPosition] = useState([]);

  // 记录所有点
  const [point, setPoint] = useState([]);

  const [tempLine, setTempLine] = useState(null); // 临时线段（随鼠标移动）

  // 是否在编辑
  const [isEditing, setIsEditing] = useState(true);

  const [editLineKey, setEditLineKey] = useState(-1);

  // 默认是线段
  const [type, setType] = useState("line");

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

  // 5. 坐标转换工具（像素坐标 -> 数据坐标）
  const convertPixelToData = (pixelX, pixelY) => {
    if (!chartInstance.current) return null;
    const dataCoord = chartInstance.current.convertFromPixel(
      { seriesIndex: 0 },
      [pixelX, pixelY]
    );
    return {
      x: Math.round(dataCoord[0]),
      y: Number(dataCoord[1].toFixed(2)),
      date: dateData[Math.round(dataCoord[0])] || "未知日期",
    };
  };

  const { run } = useDebounceFn(
    (params) => {
      const { offsetX: pixelX, offsetY: pixelY } = params.event;
      const endPoint = convertPixelToData(pixelX, pixelY);
      if (endPoint) {
        // 更新临时线段终点（实时跟随鼠标）
        setTempLine({
          start: startPoint,
          end: endPoint,
        });
        // setTempRect({
        //   x: minX,
        //   y: minY,
        //   width,
        //   height,
        //   style: {
        //     fill: "rgba(255, 165, 0, 0.3)",
        //     stroke: "#ff9500",
        //     lineWidth: 2,
        //   },
        // });
      }
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

    const handleMouseOver = (params) => {
      // 在拖拽线的时候不设置2段圆点
      if (
        params.componentType === "series" &&
        params.seriesType === "line" &&
        !startPoint
      ) {
        const seriesIndex = params.seriesIndex;

        // 获取当前系列的数据
        const seriesData =
          chartInstance.current.getOption().series[seriesIndex].data;

        // 计算线段的两端顶点（当前点和前一个点，或者当前点和后一个点）
        const endpoints = [];

        // 当前点
        endpoints.push({
          coord: [seriesData[0][0], seriesData[0][1]],
          symbol: "circle",
          symbolSize: 10,
          itemStyle: {
            color: "#fff",
            borderColor: "#ff0000",
            borderWidth: 2,
          },
        });
        endpoints.push({
          coord: [seriesData[1][0], seriesData[1][1]],
          symbol: "circle",
          symbolSize: 10,
          itemStyle: {
            color: "#fff",
            borderColor: "#ff0000",
            borderWidth: 2,
          },
        });
        // 更新markPoint显示端点
        chartInstance.current.setOption({
          series: [
            {
              markPoint: {
                data: endpoints,
              },
            },
          ],
        });
      }
    };

    const handleClickChart = (params) => {
      if (!isEditing) {
        if (params.componentType === "series" && params.seriesType === "line") {
          const seriesIndex = params.seriesIndex;
          setEditLineKey(seriesIndex);
          console.log(seriesIndex, "seriesIndex");
        }
        return;
      }
    };
    const handleClick = (params) => {
      if (!isEditing) {
        return;
      }
      // 获取点击位置的像素坐标（相对于图表容器的左上角）
      const { offsetX: pixelX, offsetY: pixelY } = params.event;

      // 关键：将像素坐标转换为图表的实际数据坐标（x轴和y轴的值）
      // coordSys 参数指定坐标系，这里用第一个系列（K线）的坐标系
      const dataCoord = chartInstance.current.convertFromPixel(
        { seriesIndex: 0 }, // 使用第0个系列（K线）的坐标系
        [pixelX, pixelY] // 像素坐标
      );

      // dataCoord 格式：[xValue, yValue]
      // xValue：x轴数据值（这里是日期索引，对应dateData的索引）
      // yValue：y轴数据值（价格）
      const [x, y] = dataCoord;

      // 格式化坐标（x取整数索引，y保留两位小数）
      const formattedPoint = {
        x: Math.round(x), // x轴为category类型，取整数索引
        y: Number(y.toFixed(2)), // 价格保留两位小数
        pixelX, // 像素x（用于调试，可选）
        pixelY, // 像素y（用于调试，可选）
        date: dateData[Math.round(x)] || "未知日期", // 对应日期（可选）
      };

      if (!startPoint) {
        // 第一次点击：保存起点
        setStartPoint(formattedPoint);
        setPoint((i) => [...i, formattedPoint]);
      } else {
        if (type === "rect") {
          const tempData = {
            width: Math.abs(pixelX - startPoint.pixelX),
            height: Math.abs(pixelY - startPoint.pixelY),
            x: Math.min(pixelX, startPoint.pixelX), // x轴为category类型，取整数索引
            y: Math.min(pixelY, startPoint?.pixelY), // 价格保留两位小数
          };
          console.log(tempData, "tempData");

          setRectsPosition((i) => [...i, tempData]);
          setStartPoint(null);
          setPoint([]);
        } else {
          // 第二次点击：生成线段
          const newLine = generateLine(startPoint, formattedPoint);
          // 添加线段并清空起点
          setLines((prev) => [...prev, newLine]);
          setEditLineKey(lines.length);
          setStartPoint(null);
          setPoint([]);
          setTempLine(null);
        }
      }
    };

    const zr = chartInstance.current.getZr();
    // 绑定全局点击事件（图表内任何位置点击都会触发）
    zr.on("click", handleClick);
    chartInstance.current.on("click", handleClickChart);

    chartInstance.current.on("mouseover", handleMouseOver);
    // chartInstance.current.on("mouseout", handleMouseOut);
    zr.on("mousemove", handleMouseMove);

    return () => {
      zr?.off("click", handleClick);
      chartInstance.current.off("mouseover", handleMouseOver);
      // chartInstance.current.off("mouseout", handleMouseOut);
      zr.off("mousemove", handleMouseMove);
      chartInstance.current.off("click", handleClickChart);
    };
  }, [startPoint, isEditing]);

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
      ...point.map((item) => ({
        name: "起点",
        type: "scatter", // 用散点图绘制圆环
        data: [[item.x, item.y]],
        symbolSize: 10, // 圆环大小
        itemStyle: {
          color: "transparent", // 填充透明
          borderColor: "#ff9500", // 边框颜色
          borderWidth: 2, // 边框宽度
        },
      })),
      ...lines.map((item) => ({
        ...item,
        showSymbol: false,
      })),
      {
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
            style: {
              fill: "rgba(0, 128, 0, 0.3)",
              stroke: "#008000",
              lineWidth: 2,
            }, // 样式（填充、边框等）
          };
        },
        data: rectsPosition.map((rect) => [rect]), // 将矩形数据传递给 renderItem（注意格式）
      },
      ...(tempLine
        ? [
            {
              name: "临时线段",
              type: "line",
              data: [
                [tempLine.start.x, tempLine.start.y],
                [tempLine.end.x, tempLine.end.y],
              ],
              lineStyle: { color: "#ff9500", width: 2, type: "dashed" }, // 临时线段用虚线
              symbol: "circle",
              symbolSize: 6,
              itemStyle: { color: "#ff9500" },
            },
          ]
        : []),
    ];
    chartInstance.current.setOption(
      {
        series: newSeries,
      },
      {
        replaceMerge: ["series"], // 明确替换series
        // notMerge: true,
      }
    );
  }, [lines, klineData.length, point.length, tempLine]);

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
