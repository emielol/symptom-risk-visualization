/**
 * File:        CategorySelector.jsx
 * Author:      Noemie Florant
 * Description: Collapsible category component for organizing symptoms by
 *              body system. Expands/collapses on header click.
 */

import { useState } from "react";

/**
 * CategorySelector Component
 * 
 * @param {string} title - Category name (e.g., "Respiratory")
 * @param {string} icon - Emoji icon for category
 * @param {string[]} symptoms - Array of symptom identifiers in this category
 * @param {string[]} selectedSymptoms - Currently selected symptoms
 * @param {function} onToggle - Callback when symptom is toggled
 * @param {boolean} defaultExpanded - Whether category starts expanded
 */
export default function CategorySelector({
  title,
  icon = "📋",
  symptoms = [],
  selectedSymptoms = [],
  onToggle,
  defaultExpanded = false
}) {
  // State
  const [search, setSearch] = useState("");
  const [isExpanded, setIsExpanded] = useState(defaultExpanded); // Track whether category is expanded

  // filter symptoms that include the what the user is searching
  const filteredSymptoms = symptoms.filter(symptom => symptom.toLowerCase().includes(search.toLowerCase()));
  
  // Count how many symptoms in this category are selected
  const selectedCount = symptoms.filter(s => selectedSymptoms.includes(s)).length;
  
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

  /**
   * Toggle category expanded/collapsed state
   */
  function toggleExpanded() {
    setIsExpanded(!isExpanded);
  }

  // --- RENDER ---
  
 return (
    <div className="bg-zinc-900 rounded-xl shadow-lg overflow-hidden">
      {/* ===== Header ===== */}
      <div
        className="p-4 cursor-pointer hover:bg-zinc-800 transition flex justify-between items-center"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 text-white">
          <span className="text-2xl">{icon}</span>
          <h3 className="text-lg font-semibold">{title}</h3>
          <span className="text-sm text-zinc-400">
            ({symptoms.length}
            {selectedCount > 0 && `, ${selectedCount} selected`})
          </span>
        </div>

        <span
          className="text-zinc-400 text-xl transition-transform"
          style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▼
        </span>
      </div>

      {/* ===== Expanded Content ===== */}
      {isExpanded && (
        <div className="p-6 text-white border-t border-zinc-800">
          {/* Search input (PER CATEGORY) */}
          <input
            type="text"
            placeholder={`Search ${title.toLowerCase()} symptoms...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full mb-4 p-2 rounded bg-zinc-800 border border-zinc-700 placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition"
          />

          {/* Symptom Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {filteredSymptoms.map(symptom => (
              <button
                key={symptom}
                onClick={() => onToggle(symptom)}
                className={`text-sm px-3 py-2 rounded-lg border transition
                  ${
                    selectedSymptoms.includes(symptom)
                      ? "bg-purple-600 border-purple-500 text-white"
                      : "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                  }`}
              >
                {formatSymptomName(symptom)}
              </button>
            ))}
          </div>

          {/* Feedback */}
          {search && (
            <p className="mt-3 text-sm text-zinc-400">
              Showing {filteredSymptoms.length} of {symptoms.length}
            </p>
          )}

          {filteredSymptoms.length === 0 && (
            <p className="text-center text-zinc-500 py-6">
              No symptoms found matching "{search}"
            </p>
          )}
        </div>
      )}
    </div>
    );
}