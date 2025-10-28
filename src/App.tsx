import React, { useRef, useEffect, useState, use } from "react";
import * as echarts from "echarts";
import "echarts/lib/chart/candlestick";
import "echarts/lib/component/tooltip";
import "echarts/lib/component/grid";
import { useDebounceFn } from "ahooks";
import Indicator from "./indicator";
// import "echarts/lib/component/xAxis";
// import "echarts/lib/component/yAxis";

const KLineFreeDraw = () => {
  // 1. 图表实例和容器
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // 2. 状态管理：起点、线段数组
  const [startPoint, setStartPoint] = useState(null); // 起点 {x: 数据x, y: 数据y, pixelX: 像素x, pixelY: 像素y}
  const [lines, setLines] = useState([]); // 所有绘制的线段
  // 记录所有点
  const [point, setPoint] = useState([]);

  const [tempLine, setTempLine] = useState(null); // 临时线段（随鼠标移动）

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

    // 鼠标离开线段时，清除索引
    const handleMouseOut = (params) => {
      if (params.seriesType === "line" && params.seriesName !== "临时线段") {
      }
    };

    const handleClick = (params) => {
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
        console.log("起点（数据坐标）：", formattedPoint);
      } else {
        // 第二次点击：生成线段
        const newLine = {
          name: `线段${Date.now()}`,
          type: "line",
          data: [
            [startPoint.x, startPoint.y], // 起点数据坐标
            [formattedPoint.x, formattedPoint.y], // 终点数据坐标
          ],
          triggerLineEvent: true,
          lineStyle: {
            color: "#ff9500",
            width: 2,
          },
          showSymbol: false,
          itemStyle: { color: "#ff9500" },
          // 线段tooltip显示数据坐标
          tooltip: {
            formatter: (params) => {
              const isStart = params.dataIndex === 0;
              const p = isStart ? startPoint : formattedPoint;
              return `${isStart ? "起点" : "终点"}</br>日期：${
                p.date
              }</br>价格：${p.y}</br>x索引：${p.x}`;
            },
          },
          markPoint: {
            symbol: "circle",
            symbolSize: 8,
            itemStyle: {
              color: "#fff",
              borderColor: "#ff0000",
              borderWidth: 2,
            },
            data: [], // 初始为空数组
          },
        };

        // 添加线段并清空起点
        setLines((prev) => [...prev, newLine]);
        setStartPoint(null);
        setPoint([]);
        setTempLine(null);
      }
    };

    const zr = chartInstance.current.getZr();
    // 绑定全局点击事件（图表内任何位置点击都会触发）
    zr.on("click", handleClick);
    chartInstance.current.on("mouseover", handleMouseOver);
    chartInstance.current.on("mouseout", handleMouseOut);
    zr.on("mousemove", handleMouseMove);

    return () => {
      zr?.off("click", handleClick);
      chartInstance.current.off("mouseover", handleMouseOver);
      chartInstance.current.off("mouseout", handleMouseOut);
      zr.off("mousemove", handleMouseMove);
    };
  }, [startPoint]);

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
        tooltip: {
          formatter: `起点：${item.date}</br>价格：${item.y}`,
        },
      })),
      ...lines.map((item) => ({
        ...item,
        showSymbol: false,
        symbolSize: 8, // 圆点大小
        itemStyle: { color: "#ff9500" },
        symbol: "circle",
      })),
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

    chartInstance.current.setOption({ series: newSeries });
  }, [lines, klineData, point, tempLine]);

  // 7. 清除所有线段
  const clearAllLines = () => {
    setLines([]);
    setStartPoint(null);
  };

  return (
    <div style={{ width: "100vw", height: "90vh", position: "relative" }}>
      <div ref={chartRef} style={{ width: "100%", height: "100%" }} />

      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          display: "flex",
          gap: 10,
        }}
      >
        <button
          onClick={clearAllLines}
          style={{
            padding: "8px 16px",
            backgroundColor: "#6b7280",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          清除所有线段
        </button>
        <div style={{ color: "#333", padding: "8px 0" }}>
          {startPoint
            ? "已选择起点，点击任意位置选择终点..."
            : "点击任意位置选择起点..."}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Indicator />
      <KLineFreeDraw />
    </div>
  );
};
export default App;
