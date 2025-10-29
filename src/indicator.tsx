import { useEffect, useRef, useState } from "react";
import { DeleteOutlined, HolderOutlined } from "@ant-design/icons";
import { Popover } from "antd";
import type { Line } from "./interface";
const colors = [
  "#0000FF",
  "#008000",
  "#FFFF00",
  "#FFA500",
  "#000080",
  "#006400",
  "#8B0000",
  "#808080",
  "#A52A2A",
  "#FFC0CB",
  "#ADD8E6",
  "#90EE90",
  "#FFD700",
  "#C0C0C0",
  "#FF0000",
  "#CC0000",
  "#990000",
  "#660000",
  "#330000",
];

const widths = [1, 2, 3, 4];

const lineStyles = ["solid", "dashed", "dotted"];

const lineDash = [
  [5, 5],
  [10, 5],
  [5, 10],
  [10, 5, 2, 5],
];

interface IndicatorProps {
  onDelete?: () => void;
  onChangeStyle?: (style: number[]) => void;
  onChangeWidth?: (width: number) => void;
  onChangeColor?: (color: string) => void;
  initialLine?: Line;
}
const Indicator = ({
  onDelete,
  onChangeStyle,
  onChangeWidth,
  onChangeColor,
  initialLine,
}: IndicatorProps) => {
  const ref = useRef(null);

  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [open, setOpen] = useState(false);
  const [selectedWidth, setSelectedWidth] = useState(widths[0]);
  const [widthOpen, setWidthOpen] = useState(false);

  const [selectedStyle, setSelectedStyle] = useState(lineStyles[0]);
  const [styleOpen, setStyleOpen] = useState(false);

  const [isDrawing, setIsDrawing] = useState(false);

  const startPos = useRef({ x: 0, y: 0 }); // 鼠标按下时的初始位置
  const elementOffset = useRef({ x: 0, y: 0 }); // 元素初始偏移量（相对于鼠标）
  const [finalPos, setFinalPos] = useState({ x: 100, y: 100 });

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  const handleMousemove = (e: MouseEvent) => {
    if (isDrawing) {
      // 计算鼠标移动的偏移量
      const deltaX = e.clientX - startPos.current.x;
      const deltaY = e.clientY - startPos.current.y;

      // 新位置 = 元素初始偏移 + 鼠标移动偏移
      const newX = elementOffset.current.x + deltaX;
      const newY = elementOffset.current.y + deltaY;

      // 直接操作 DOM，通过 transform 移动元素（避免 setState 触发重渲染）
      ref.current.style.transform = `translate(${newX - 20}px, ${newY - 35}px)`;
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !ref.current) return;

    // 解析最终位置并更新状态（用于下次拖拽的初始位置）
    const transform = window.getComputedStyle(ref.current).transform;
    if (transform !== "none") {
      const matrix = new DOMMatrix(transform);
      setFinalPos({ x: matrix.e, y: matrix.f });
    }

    // 标记结束拖拽
    setIsDrawing(false);
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMousemove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMousemove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDrawing]);

  useEffect(() => {
    if (initialLine) {
      setSelectedWidth(initialLine?.style?.lineWidth);
      setSelectedColor(initialLine?.style?.stroke);
      setSelectedStyle(initialLine?.style?.stroke);
    }
  }, [initialLine]);
  return (
    <div
      ref={ref}
      style={{
        padding: 8,
        border: "1px solid #fff",
        position: "absolute",
        background: "#3b2020ff",
        zIndex: 200,
        borderRadius: 4,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
        transform: `translate(${finalPos.x}px, ${finalPos.y}px)`,
        cursor: isDrawing ? "grabbing" : "grab",
      }}
    >
      <HolderOutlined
        style={{
          color: "#fff",
          cursor: isDrawing ? "grabbing" : "grab",
        }}
        onMouseDown={() => {
          setIsDrawing(true);
        }}
      />

      <Popover
        content={
          <div
            style={{
              display: "flex",
              gap: 8,
              width: 160,
              flexWrap: "wrap",
            }}
          >
            {colors.map((color) => (
              <div
                key={color}
                onClick={() => {
                  setSelectedColor(color);
                  setOpen(false);
                  onChangeColor?.(color);
                }}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  backgroundColor: color,
                }}
              ></div>
            ))}
          </div>
        }
        title={null}
        trigger="click"
        open={open}
        onOpenChange={handleOpenChange}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            backgroundColor: selectedColor,
          }}
        ></div>
      </Popover>

      <Popover
        content={
          <div
            style={{
              display: "flex",
              gap: 8,
              flexDirection: "column",
            }}
          >
            {widths.map((width) => (
              <div
                key={width}
                onClick={() => {
                  setSelectedWidth(width);
                  setWidthOpen(false);
                  onChangeWidth?.(width);
                }}
                style={{
                  width: 20,
                  height: width,
                  borderRadius: 4,
                  backgroundColor: "#3f3b3bff",
                }}
              ></div>
            ))}
          </div>
        }
        title={null}
        trigger="click"
        open={widthOpen}
        onOpenChange={(open) => {
          setWidthOpen(open);
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            color: "#fff",
          }}
        >
          <div
            style={{
              width: 20,
              height: selectedWidth,
              borderRadius: 4,
              backgroundColor: "#fff",
            }}
          ></div>
          {selectedWidth}px
        </div>
      </Popover>

      <Popover
        content={
          <div
            style={{
              display: "flex",
              gap: 8,
              flexDirection: "column",
            }}
          >
            {lineStyles.map((lineStyle, index) => (
              <div
                key={lineStyle}
                onClick={() => {
                  onChangeStyle?.(lineDash[index]);
                  setSelectedStyle(lineStyle);
                  setStyleOpen(false);
                }}
                style={{
                  width: 20,
                  height: 20,
                  background: "transparent",
                  borderTop: `2px ${lineStyle} #3f3b3bff`,
                }}
              ></div>
            ))}
          </div>
        }
        title={null}
        trigger="hover"
        open={styleOpen}
        onOpenChange={(open) => {
          setStyleOpen(open);
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            background: "transparent",
            borderTop: `2px ${selectedStyle} #fff`,
          }}
        ></div>
      </Popover>
      <DeleteOutlined style={{ color: "#fff" }} onClick={onDelete} />
    </div>
  );
};
export default Indicator;
