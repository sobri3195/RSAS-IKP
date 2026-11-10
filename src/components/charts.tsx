import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { subMonths, format } from "date-fns";
import { id } from "date-fns/locale";
import type { Incident } from "../schemas/models";
import { aggregate, colors, gradeLabel, deadline } from "../utils/domain";
import { Empty } from "./ui";
export const palette = [
  "#3b8dba",
  "#55b8af",
  "#9da9e4",
  "#efbf67",
  "#ed8990",
  "#8a9fb8",
  "#4d6d93",
];
export function TrendChart({ items }: { items: Incident[] }) {
  const months = Array.from({ length: 6 }, (_, n) =>
    subMonths(new Date(), 5 - n),
  );
  const data = months.map((d) => ({
    name: format(d, "MMM", { locale: id }),
    KPC: 0,
    KNC: 0,
    KTC: 0,
    KTD: 0,
    ...Object.fromEntries(
      ["KPC", "KNC", "KTC", "KTD"].map((kind) => [
        kind,
        items.filter(
          (i) =>
            i.incident.incidentDate.slice(0, 7) === format(d, "yyyy-MM") &&
            i.incident.kind === kind,
        ).length,
      ]),
    ),
  }));
  return items.length ? (
    <ResponsiveContainer width="100%" height={235}>
      <AreaChart
        data={data}
        margin={{ top: 12, right: 12, left: -24, bottom: 0 }}
      >
        <defs>
          {palette.slice(0, 4).map((c, n) => (
            <linearGradient
              key={c}
              id={`gradient-${n}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={c} stopOpacity={0.23} />
              <stop offset="100%" stopColor={c} stopOpacity={0.01} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid
          vertical={false}
          stroke="#edf1f5"
          strokeDasharray="4 4"
        />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#7e8d9e", fontSize: 11 }}
          dy={10}
        />
        <YAxis
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#7e8d9e", fontSize: 11 }}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #e5ebf0",
            fontSize: 12,
          }}
        />
        {["KPC", "KNC", "KTC", "KTD"].map((k, n) => (
          <Area
            key={k}
            type="monotone"
            dataKey={k}
            stroke={palette[n]}
            strokeWidth={2.3}
            fill={`url(#gradient-${n})`}
            dot={false}
            activeDot={{ r: 5 }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  ) : (
    <Empty description="Grafik tampil setelah laporan tersedia." />
  );
}
export function RiskDonut({ items }: { items: Incident[] }) {
  const data = aggregate(items, (i) => i.riskAssessment.grade ?? "BELUM");
  const total = items.length;
  return (
    <div className="risk-chart">
      <div className="donut-wrap">
        {total ? (
          <ResponsiveContainer width="100%" height={182}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={79}
                paddingAngle={4}
                cornerRadius={4}
                stroke="none"
                startAngle={90}
                endAngle={-270}
              >
                {data.map((d) => (
                  <Cell
                    key={d.name}
                    fill={colors[d.name as keyof typeof colors] ?? "#dce4ed"}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(v, n) => [
                  `${v} laporan`,
                  gradeLabel[n as keyof typeof gradeLabel] ?? "Belum dinilai",
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : null}
        <div className="donut-center">
          <strong>{total}</strong>
          <small>Total insiden</small>
        </div>
      </div>
      <div className="risk-legend">
        {[...Object.keys(colors), "BELUM"].map((k) => (
          <div key={k}>
            <span>
              <i
                style={{
                  background: colors[k as keyof typeof colors] ?? "#dce4ed",
                }}
              />
              {gradeLabel[k as keyof typeof gradeLabel] ?? "Belum dinilai"}
            </span>
            <b>
              {data.find((d) => d.name === k)?.value ?? 0}
              <small>
                {total
                  ? Math.round(
                      ((data.find((d) => d.name === k)?.value ?? 0) / total) *
                        100,
                    )
                  : 0}
                %
              </small>
            </b>
          </div>
        ))}
      </div>
    </div>
  );
}
export function Bars({
  data,
  horizontal = false,
}: {
  data: { name: string; value: number }[];
  horizontal?: boolean;
}) {
  return data.length ? (
    <ResponsiveContainer width="100%" height={235}>
      <BarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ left: horizontal ? 20 : -25, right: 20, top: 12, bottom: 6 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="#edf1f5"
        />
        {horizontal ? (
          <>
            <XAxis type="number" allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{ fontSize: 10 }}
            />
          </>
        ) : (
          <>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} />
            <YAxis allowDecimals={false} tickLine={false} />
          </>
        )}
        <Tooltip cursor={{ fill: "#f3f7fa" }} />
        <Bar
          dataKey="value"
          name="Jumlah"
          fill="#509cb5"
          radius={[4, 4, 4, 4]}
          maxBarSize={35}
        >
          {data.map((d, n) => (
            <Cell key={d.name} fill={palette[n % palette.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  ) : (
    <Empty />
  );
}

export function TimelinessChart({ items }: { items: Incident[] }) {
  const data = Array.from({ length: 6 }, (_, n) =>
    subMonths(new Date(), 5 - n),
  ).map((d) => {
    const sent = items.filter(
      (i) =>
        i.submittedAt &&
        i.incident.incidentDate.slice(0, 7) === format(d, "yyyy-MM"),
    );
    return {
      name: format(d, "MMM", { locale: id }),
      "≤ 48 jam": sent.filter((i) => !deadline(i).late).length,
      "> 48 jam": sent.filter((i) => deadline(i).late).length,
    };
  });
  return items.some((i) => i.submittedAt) ? (
    <ResponsiveContainer width="100%" height={235}>
      <LineChart
        data={data}
        margin={{ top: 15, right: 25, left: -20, bottom: 10 }}
      >
        <CartesianGrid
          vertical={false}
          stroke="#edf1f5"
          strokeDasharray="3 3"
        />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 10 }} />
        <Line dataKey="≤ 48 jam" stroke="#55b8af" strokeWidth={2} />
        <Line dataKey="> 48 jam" stroke="#ed8990" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  ) : (
    <Empty description="Belum ada laporan terkirim pada filter ini." />
  );
}
