/**
 * File:        PredictionBarChart.jsx
 * Author:      Noemie Florant
 * Description: Visualizes model predictions using a horizontal bar chart.
 *              Uses Recharts for responsive, SVG-based rendering.
 */

import {
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Bar,
  ResponsiveContainer
} from 'recharts';

/**
 * Custom Tooltip Formatter
 * Displays both the normalized UI confidence and the raw model math.
 */
const formatTooltip = (value, name, props) => {
  const relativeConf = `${(value * 100).toFixed(0)}% Relative Conf.`;
  const rawModelProb = `Model Probability: ${(props.payload.raw_probability * 100).toFixed(2)}%`;
  
  return [relativeConf, rawModelProb];
};

export default function PredictionBarChart({ predictions }) {
  // Prevent chart from crashing if data is missing/loading
  if (!Array.isArray(predictions) || predictions.length === 0) {
    return (
      <div className="text-zinc-400 text-center py-12">
        No predictions to display
      </div>
      );
  }

  // Component render
  return (
    <div className="bg-zinc-900 rounded-xl p-6 shadow-lg">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={predictions}
          layout="vertical"
          margin={{ top: 10, right: 10, left:10, bottom: 10 }}
        >
          {/* Subtle grid lines for better value estimation */}
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          
          {/* X-axis = 0-1 probability range */}
          <XAxis
            type="number"
            domain={[0, 1]}
            tick={{ fill: "#ccc" }}
          />

          {/* Y-axis = disease name */}
          <YAxis
            dataKey="disease"
            type="category"
            tick={{ fill: "#ccc" }}
            width={150}
          />
          {/* Detailed hover information */}
          <Tooltip
            formatter={formatTooltip}
            contentStyle={{ backgroundColor: '#27272a', border: '1px solid #3f3f46' }}
            labelStyle={{ color: '#ffffff' }}
            itemStyle={{ color: '#e1c1f3ff' }}
            wrapperStyle={{ zIndex: 1000 }}
            position={{ x: 'auto', y: 'auto' }}
            allowEscapeViewBox={{ x: false, y: false }}
          />

          {/* The Data Bar */}
          <Bar
            dataKey="probability"
            fill="#6019a2ff"
            radius={[6, 6, 6, 6]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}