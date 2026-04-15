import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface HorizontalBarChartProps {
  title: string;
  data: { name: string; count: number; id?: string }[];
  sessionLabel: string;
  noDataLabel: string;
  yAxisWidth?: number;
  labelMaxLength?: number;
  activeLabel: string | null;
  setActiveLabel: (label: string | null) => void;
  onBarClick?: (data: any) => void;
  onLabelClick?: (data: any) => void;
}

export function HorizontalBarChart({
  title,
  data,
  sessionLabel,
  noDataLabel,
  yAxisWidth = 140,
  labelMaxLength = 18,
  activeLabel,
  setActiveLabel,
  onBarClick,
  onLabelClick,
}: HorizontalBarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ChartContainer
            config={{
              count: {
                label: sessionLabel,
                color: "var(--chart-1)",
              },
            }}
            className="aspect-auto h-[220px] w-full"
          >
            <BarChart
              accessibilityLayer
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                width={yAxisWidth}
                tick={(props) => {
                  const item = data.find((d) => d.name === props.payload.value);
                  return (
                    <text
                      x={props.x}
                      y={props.y}
                      dy={4}
                      textAnchor="end"
                      fontSize={12}
                      className="fill-muted-foreground cursor-pointer"
                      style={{
                        fill:
                          activeLabel === props.payload.value
                            ? "#10b981"
                            : undefined,
                      }}
                      fontWeight={
                        activeLabel === props.payload.value ? 500 : 400
                      }
                      onClick={() =>
                        onLabelClick
                          ? onLabelClick(item || { name: props.payload.value })
                          : onBarClick?.({ name: props.payload.value })
                      }
                      onMouseEnter={() => setActiveLabel(props.payload.value)}
                      onMouseLeave={() => setActiveLabel(null)}
                    >
                      {props.payload.value.length > labelMaxLength
                        ? `${props.payload.value.slice(0, labelMaxLength)}...`
                        : props.payload.value}
                      <title>{props.payload.value}</title>
                    </text>
                  );
                }}
              />
              <XAxis dataKey="count" type="number" hide />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={[0, 4, 4, 0]}
                barSize={20}
                onClick={onBarClick}
                className="cursor-pointer"
                style={{ outline: "none" }}
                onMouseEnter={(data) => setActiveLabel(data.name || null)}
                onMouseLeave={() => setActiveLabel(null)}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[220px] items-center justify-center text-muted-foreground">
            {noDataLabel}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
