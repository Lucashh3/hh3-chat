interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

const DEFAULT_WIDTH = 180;
const DEFAULT_HEIGHT = 60;

export function Sparkline({
  data,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  color = "currentColor",
  strokeWidth = 2,
  className
}: SparklineProps) {
  if (!data.length) {
    return <div className="text-xs text-muted-foreground">Sem dados</div>;
  }

  if (data.every((value) => value === data[0])) {
    const y = height / 2;
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden="true">
        <line x1={0} y1={y} x2={width} y2={y} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      </svg>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stepX = data.length > 1 ? width / (data.length - 1) : width;

  const points = data.map((value, index) => {
    const x = index * stepX;
    const normalized = (value - min) / span;
    const y = height - normalized * height;
    return { x, y };
  });

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden="true">
      <path d={path} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
