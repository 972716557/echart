import React, { useRef, useEffect, useState } from "react";
import * as echarts from "echarts";
import "echarts/lib/chart/candlestick";
import "echarts/lib/component/tooltip";
import "echarts/lib/component/grid";
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

  // 5. 监听全局点击事件（任意位置点击都触发）
  useEffect(() => {
    if (!chartInstance.current) return;

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
          lineStyle: {
            color: "#ff9500",
            width: 2,
          },
          symbol: "circle", // 显示端点
          symbolSize: 6,
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
        };

        // 添加线段并清空起点
        setLines((prev) => [...prev, newLine]);
        setStartPoint(null);
        console.log("终点（数据坐标）：", formattedPoint, "线段已绘制");
      }
    };

    const zr = chartInstance.current.getZr();
    // 绑定全局点击事件（图表内任何位置点击都会触发）
    zr.on("click", handleClick);

    return () => {
      zr?.off("click", handleClick);
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
      ...lines,
    ];

    chartInstance.current.setOption({ series: newSeries });
  }, [lines, klineData, point]);

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

export default KLineFreeDraw;
