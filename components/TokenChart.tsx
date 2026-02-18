"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Box } from "@chakra-ui/react";

interface ChartPoint {
  time: number;
  close: number;
}

// Shift UTC timestamps to local time for lightweight-charts display
// and extend line to current time with last known price
function toLocalLineData(data: ChartPoint[]) {
  const tzOffsetSec = new Date().getTimezoneOffset() * 60;
  const points = data.map((c) => ({
    time: (c.time - tzOffsetSec) as unknown as import("lightweight-charts").UTCTimestamp,
    value: c.close,
  }));

  // Extend to "now" so the chart doesn't look stuck when there are no recent trades
  if (points.length > 0) {
    const nowUtc = Math.floor(Date.now() / 1000);
    const nowLocal = (nowUtc - tzOffsetSec) as unknown as import("lightweight-charts").UTCTimestamp;
    const lastPoint = points[points.length - 1];
    // Only add if "now" is more than 60s ahead of last candle
    if ((nowLocal as unknown as number) - (lastPoint.time as unknown as number) > 60) {
      points.push({ time: nowLocal, value: lastPoint.value });
    }
  }

  return points;
}

export function TokenChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesRef = useRef<any>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const firstLoadRef = useRef(true);

  // Fetch chart data from dedicated endpoint
  const fetchChart = useCallback(async () => {
    try {
      const res = await fetch("/api/token/chart");
      if (!res.ok) return;
      const json = await res.json();
      if (json.chart?.length) {
        setChartData(json.chart);
      }
    } catch {
      // silent
    }
  }, []);

  // Poll chart data every 10 seconds
  useEffect(() => {
    fetchChart();
    const interval = setInterval(fetchChart, 10_000);
    return () => clearInterval(interval);
  }, [fetchChart]);

  // Create chart once on mount
  useEffect(() => {
    if (!containerRef.current) return;

    let mounted = true;

    import("lightweight-charts").then((lc) => {
      if (!mounted || !containerRef.current) return;

      const chart = lc.createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
        layout: {
          background: { type: lc.ColorType.Solid, color: "#1a1a2e" },
          textColor: "#9ca3af",
          fontSize: 11,
        },
        grid: {
          vertLines: { color: "rgba(255,255,255,0.04)" },
          horzLines: { color: "rgba(255,255,255,0.04)" },
        },
        crosshair: {
          vertLine: {
            color: "rgba(139,92,246,0.4)",
            style: lc.LineStyle.Dashed,
          },
          horzLine: {
            color: "rgba(139,92,246,0.4)",
            style: lc.LineStyle.Dashed,
          },
        },
        rightPriceScale: {
          borderColor: "rgba(255,255,255,0.1)",
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
        timeScale: {
          borderColor: "rgba(255,255,255,0.1)",
          timeVisible: true,
          secondsVisible: false,
        },
        handleScroll: { vertTouchDrag: false },
      });

      chartRef.current = chart;

      const series = chart.addSeries(lc.AreaSeries, {
        lineColor: "#180E67",
        topColor: "rgba(139, 92, 246, 0.4)",
        bottomColor: "rgba(139, 92, 246, 0.02)",
        lineWidth: 2,
        priceFormat: {
          type: "custom" as const,
          formatter: (price: number) => {
            if (price >= 1) return `$${price.toFixed(2)}`;
            if (price >= 0.001) return `$${price.toFixed(6)}`;
            return `$${price.toPrecision(4)}`;
          },
        },
      });

      seriesRef.current = series;

      // Resize handler
      const observer = new ResizeObserver(() => {
        if (containerRef.current && chartRef.current) {
          chartRef.current.applyOptions({
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
          });
        }
      });
      if (containerRef.current) {
        observer.observe(containerRef.current);
      }
    });

    return () => {
      mounted = false;
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, []);

  // Update chart data smoothly whenever new data arrives
  useEffect(() => {
    if (!seriesRef.current || chartData.length === 0) return;
    const lineData = toLocalLineData(chartData);
    seriesRef.current.setData(lineData);
    // fitContent only on first load
    if (firstLoadRef.current && chartRef.current && lineData.length > 0) {
      chartRef.current.timeScale().fitContent();
      firstLoadRef.current = false;
    }
  }, [chartData]);

  return (
    <Box
      ref={containerRef}
      w="full"
      h="full"
      minH={{ base: "300px", md: "400px" }}
    />
  );
}
