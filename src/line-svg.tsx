/**
 * SVG 虚线组件（与 ECharts lineDash 配置适配）
 * @param {Object} props - 线段配置
 * @param {number} props.x1 - 起点 x 坐标
 * @param {number} props.y1 - 起点 y 坐标
 * @param {number} props.x2 - 终点 x 坐标
 * @param {number} props.y2 - 终点 y 坐标
 * @param {string} props.stroke - 线段颜色（默认 #ff4d4f）
 * @param {number} props.lineWidth - 线宽（默认 2）
 * @param {number[]} props.lineDash - 虚线样式数组（如 [5,5]，对应 ECharts lineDash）
 * @param {number} props.lineDashOffset - 虚线偏移量（对应 ECharts lineDashOffset，默认 0）
 * @param {string} props.strokeLinecap - 线端样式（默认 round，可选 butt/square/round）
 */
const SvgDashedLine = ({
  stroke = "#fff",
  lineWidth = 2,
  lineDash = [],
  lineDashOffset = 0,
  strokeLinecap = "round",
}) => {
  // 将 ECharts lineDash 数组转换为 SVG stroke-dasharray 字符串（用空格分隔）
  const strokeDasharray = lineDash.join(" ");

  return (
    <svg width="30" height="4" style={{ display: "block" }}>
      <line
        x1={0}
        y1={0}
        x2={20}
        y2={0}
        stroke={stroke}
        strokeWidth={lineWidth}
        strokeDasharray={strokeDasharray} // 适配 lineDash
        strokeDashoffset={lineDashOffset} // 适配 lineDashOffset
        strokeLinecap={strokeLinecap}
      />
    </svg>
  );
};

export default SvgDashedLine;
