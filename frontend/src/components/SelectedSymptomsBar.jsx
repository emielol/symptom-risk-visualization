/**
 * File:        SelectedSymptomsBar.jsx
 * Author:      Noemie Florant
 * Description: Displays currently selected symptoms as removable tags.
 *              Provides quick overview and easy removal.
 * ============================================================================
 */

/**
 * SelectedSymptomsBar Component
 * 
 * @param {string[]} selectedSymptoms - Currently selected symptoms
 * @param {function} onRemove - Callback when symptom is removed (receives symptom name)
 * @param {function} onClear - Callback when "Clear All" is clicked
 */
export default function SelectedSymptomsBar({ 
  selectedSymptoms = [], 
  onRemove,
  onClear 
}) {
 
  /**
   * Format symptom name for display
   * "high_fever" → "High Fever"
   */
  function formatSymptomName(symptom) {
    return symptom
      .replaceAll("_", " ")
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
  
  // Don't show anything if no symptoms selected
  if (selectedSymptoms.length === 0) return null;
  
  // --- RENDERING ---
  return (
    <div className="bg-zinc-900 rounded-xl p-6 shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">
          Selected Symptoms ({selectedSymptoms.length})
        </h3>
        <button
          onClick={onClear}
          className="text-sm text-red-400 hover:text-red-300 transition"
        >
          Clear All
        </button>
      </div>

      {/* Symptom Tags */}
      <div className="flex flex-wrap gap-2">
        {selectedSymptoms.map(symptom => (
          <span
            key={symptom}
            className="bg-purple-700 px-3 py-1.5 rounded-full text-sm text-white flex items-center gap-2 cursor-pointer hover:bg-purple-600 transition group"
            onClick={() => onRemove(symptom)}
          >
            {formatSymptomName(symptom)}
            <span className="opacity-70 group-hover:opacity-100 font-bold">
              ×
            </span>
          </span>
        ))}
      </div>
      {/* UX Hint: Only visible when symptoms exist */}
      <p className="mt-4 text-[10px] text-zinc-500 italic">
        Click a symptom to remove it from the diagnostic query.
      </p>
    </div>
  );
}