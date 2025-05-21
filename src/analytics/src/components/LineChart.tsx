import React, { useEffect, useRef, useState } from 'react';

interface LineChartProps {
  data: { label: string; value: number }[];
  title: string;
  height?: number;
  lineColor?: string;
  fillColor?: string;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  title,
  height = 200,
  lineColor = 'stroke-indigo-500',
  fillColor = 'fill-indigo-500/10'
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; value: number; label: string } | null>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return;

    const svg = svgRef.current;
    const container = containerRef.current;
    const width = container.clientWidth;
    const paddingTop = 20;
    const paddingBottom = 30;
    const chartHeight = height - paddingTop - paddingBottom;

    // Clear previous content
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    // Calculate scales
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const padding = maxValue * 0.1;

    const yScale = (value: number) => {
      return paddingTop + chartHeight - ((value - minValue + padding) / (maxValue - minValue + padding * 2)) * chartHeight;
    };

    const xScale = (index: number) => {
      return (index / (data.length - 1)) * width;
    };

    // Create gradient for area
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'areaGradient');
    gradient.setAttribute('x1', '0');
    gradient.setAttribute('y1', '0');
    gradient.setAttribute('x2', '0');
    gradient.setAttribute('y2', '1');

    const stops = [
      { offset: '0%', color: 'rgba(99, 102, 241, 0.2)' },
      { offset: '100%', color: 'rgba(99, 102, 241, 0.0)' }
    ];

    stops.forEach(stop => {
      const stopEl = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stopEl.setAttribute('offset', stop.offset);
      stopEl.setAttribute('stop-color', stop.color);
      gradient.appendChild(stopEl);
    });

    svg.appendChild(gradient);

    // Create path for line
    let pathD = `M ${xScale(0)} ${yScale(data[0].value)}`;

    for (let i = 1; i < data.length; i++) {
      const x1 = xScale(i - 1);
      const y1 = yScale(data[i - 1].value);
      const x2 = xScale(i);
      const y2 = yScale(data[i].value);

      // Create a curved line using cubic bezier
      const xMid = (x1 + x2) / 2;
      pathD += ` C ${xMid} ${y1}, ${xMid} ${y2}, ${x2} ${y2}`;
    }

    // Create path element for line
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathD);
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '2.5');
    path.setAttribute('fill', 'none');
    path.classList.add(lineColor);

    // Create path for area below line
    let areaPathD = pathD;
    areaPathD += ` L ${xScale(data.length - 1)} ${paddingTop + chartHeight} L ${xScale(0)} ${paddingTop + chartHeight} Z`;

    const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    areaPath.setAttribute('d', areaPathD);
    areaPath.setAttribute('fill', 'url(#areaGradient)');

    // Create dots for data points
    const dotsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    data.forEach((d, i) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const x = xScale(i);
      const y = yScale(d.value);

      circle.setAttribute('cx', x.toString());
      circle.setAttribute('cy', y.toString());
      circle.setAttribute('r', '4');
      circle.setAttribute('fill', 'white');
      circle.setAttribute('stroke', 'currentColor');
      circle.setAttribute('stroke-width', '2');
      circle.classList.add(lineColor);

      // Add hover effect
      circle.addEventListener('mouseenter', () => {
        circle.setAttribute('r', '6');
        setTooltip({ x, y, value: d.value, label: d.label });
      });

      circle.addEventListener('mouseleave', () => {
        circle.setAttribute('r', '4');
        setTooltip(null);
      });

      dotsGroup.appendChild(circle);
    });

    // Append elements in correct order
    svg.appendChild(areaPath);
    svg.appendChild(path);
    svg.appendChild(dotsGroup);

    // Create labels
    const labelsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    data.forEach((d, i) => {
      if (i % Math.ceil(data.length / 7) === 0 || i === data.length - 1) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', xScale(i).toString());
        text.setAttribute('y', (paddingTop + chartHeight + 20).toString());
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '11');
        text.classList.add('text-gray-500', 'font-medium');
        text.textContent = d.label;
        labelsGroup.appendChild(text);
      }
    });

    svg.appendChild(labelsGroup);

  }, [data, height, lineColor, fillColor]);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-gray-100">
      <h3 className="text-xl font-semibold tracking-tight text-gray-800 mb-6">{title}</h3>
      <div ref={containerRef} className="relative">
        <svg
          ref={svgRef}
          className="w-full"
          style={{ height: `${height}px` }}
          preserveAspectRatio="none"
        />
        {tooltip && (
          <div
            className="absolute pointer-events-none bg-gray-900 dark:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm transform -translate-x-1/2 -translate-y-full"
            style={{
              left: tooltip.x,
              top: tooltip.y - 8,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
            }}
          >
            <div className="font-medium">{tooltip.value.toLocaleString()}</div>
            <div className="text-xs text-gray-300">{tooltip.label}</div>
            <div
              className="absolute bottom-0 left-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-700 transform rotate-45 translate-y-1/2 -translate-x-1/2"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default LineChart;
