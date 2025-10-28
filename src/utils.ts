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

const generateLine = (startPoint, formattedPoint) => {
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
        return `${isStart ? "起点" : "终点"}</br>日期：${p.date}</br>价格：${
          p.y
        }</br>x索引：${p.x}`;
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
  return newLine;
};
export { generateRect, generateLine };
