/**
 * File:        SymptomContributionHeatmap.jsx
 * Author:      Noemie Florant
 * Description: Visualizes which symptoms most strongly influenced each 
 *              disease prediction using a custom heatmap/bar hybrid.
 */

// --- UTILITY HELPERS ---
// Helper to convert snake_case_symptoms to Title Case Sentences
const formatSymptom = (symptom) => {
  return symptom
    .replaceAll("_", " ")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Get intensity color based on scaled importance value (0-100)
const getBackgroundColor = (scaledValue) => {
  if (scaledValue >= 80) return 'bg-purple-600';
  if (scaledValue >= 60) return 'bg-purple-500';
  if (scaledValue >= 40) return 'bg-purple-400';
  if (scaledValue >= 20) return 'bg-purple-300';
  if (scaledValue > 0) return 'bg-purple-200';
  return 'bg-zinc-900';
};
  
// Ensure text remains readable regardless of background darkness
const getTextColor = (scaledValue) => (scaledValue >= 40 ? 'text-white' : 'text-zinc-600');

/**
 * @param {Object[]} predictions - Array of objects: { disease: string, probability: number, raw_probability: number }
 * @param {string[]} selectedSymptoms - The list of symptoms currently active in the UI
 * @param {Object} contributions - Nested map from the backend:
 * Format: { 
 * "Disease Name": { 
 * "symptom_name": { raw: float, scaled: float } 
 * } 
 * }
 */
export default function SymptomContributionHeatmap({ 
  predictions, 
  selectedSymptoms, 
  contributions 
}) {
  // Ensure data exists before rendering
  if (!predictions || predictions.length === 0) {
    return (
      <div className="text-zinc-400 text-center py-8">
        Get predictions to see symptom contribution analysis
      </div>
    );
  }

  if (!selectedSymptoms || selectedSymptoms.length === 0) {
    return (
      <div className="text-zinc-400 text-center py-8">
        No symptoms selected
      </div>
    );
  }

  if (!contributions || Object.keys(contributions).length === 0) {
    return (
      <div className="text-zinc-400 text-center py-8">
        No contribution data available
      </div>
    );
  }

  
  // --- RENDERING ---
  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Symptom Contribution Analysis
        </h3>
        <div className="text-xs text-zinc-400">
          Relative contribution (hover for raw values)
        </div>
      </div>

      {/* Heatmap - Iterate through each predicted disease to show a 
          specific breakdown of which symptoms caused THAT prediction.
      */}
      {predictions.map((prediction) => {
        // Retrieve the specific contribution dictionary for this disease
        const diseaseContribs = contributions[prediction.disease] || {};
        
        // Sort symptoms by scaled importance to THIS disease
        const sortedSymptoms = [...selectedSymptoms].sort((a, b) => {
          const scaledA = diseaseContribs[a]?.scaled || 0;
          const scaledB = diseaseContribs[b]?.scaled || 0;
          return scaledB - scaledA;
        });

        return (
          <div key={prediction.disease} className="bg-zinc-800 rounded-lg p-4">
            {/* Disease Header inside Heatmap */}
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-semibold text-white">
                {prediction.disease}
              </h4>
              <span className="text-sm text-purple-400">
                {prediction.raw_probability !== undefined
                  ? `${(prediction.raw_probability * 100).toFixed(1)}% probability`
                  : "Probability unavailable"}
              </span>
            </div>
            
            {/* Individual Symptom Bars */}
            <div className="grid grid-cols-1 gap-2">
              {sortedSymptoms.map(symptom => {
                const { raw: rawValue, scaled: scaledValue } = diseaseContribs[symptom] || { raw: 0, scaled: 0 };

                return (
                  <div key={symptom} className="flex items-center gap-2">
                    {/* Symptom Label */}
                    <div className="w-32 text-xs text-zinc-300 truncate" title={formatSymptom(symptom)}>
                      {formatSymptom(symptom)}
                    </div>

                    {/* Heatmap Bar Container */}
                    <div className="flex-1">
                      <div 
                        className="relative h-6 bg-zinc-900 rounded overflow-hidden group cursor-help"
                        title={`Raw contribution: ${rawValue.toFixed(6)}`}
                      >
                        {/* Width is the 'scaled' importance % */}
                        <div
                          className={`absolute inset-y-0 left-0 ${getBackgroundColor(scaledValue)} transition-all duration-300 flex items-center justify-end pr-2`}
                          style={{ width: `${Math.max(scaledValue, 2)}%` }}
                        >
                          {/* Only show % text if the bar is wide enough to contain it */}
                          {scaledValue > 15 && (
                            <span className={`text-xs font-medium ${getTextColor(scaledValue)}`}>
                              {scaledValue.toFixed(0)}%
                            </span>
                          )}
                        </div>
                        {/* Show raw value on hover */}
                        <div className="absolute inset-0 bg-zinc-950/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-xs text-white font-mono">
                            Raw: {rawValue.toFixed(6)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="space-y-2 pt-2 border-t border-zinc-700">
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span>Relative contribution:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-purple-600 rounded"></div>
            <span>High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-purple-400 rounded"></div>
            <span>Med</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-purple-200 rounded"></div>
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-zinc-800 rounded border border-zinc-700"></div>
            <span>None</span>
          </div>
        </div>
        <div className="text-xs text-zinc-500 italic">
          💡 Hover over bars to see raw contribution values
        </div>
      </div>
    </div>
  );
}