/**
 * File:        App.jsx
 * Author:      Noemie Florant
 * Description: Main application component for disease diagnosis system.
 *              Manages symptom selection state and coordinates between
 *              all child components.
 */

import { useState, useEffect } from "react"; 
import CategorySelector from "./components/CategorySelector";
import SelectedSymptomsBar from "./components/SelectedSymptomsBar";
import PredictionBarChart from "./components/PredictionBarChart";
import SymptomContributionHeatmap from "./components/SymptomContributionHeatmap";  // ← ADD THIS

export default function App() {    
  // UI & data state
  const [allSymptoms, setAllSymptoms] = useState([]);      // Complete list from backend
  const [selectedSymptoms, setSelectedSymptoms] = useState([]); // User's active choices
  const [loading, setLoading] = useState(true);            // Initial boot state
  const [error, setError] = useState(null);               // API error handling
  const [predictions, setPredictions] = useState([]);      // Model results
  const [symptomContributions, setSymptomContributions] = useState({}); // Explanability data
  
  
  // DATA - Common Symptoms 
  const commonSymptoms = [
    'high_fever',
    'cough',
    'fatigue',
    'headache',
    'nausea',
    'vomiting',
    'diarrhea',
    'abdominal_pain',
    'chest_pain',
    'breathlessness'
  ];

  // DATA - Group symptoms into categories
  const categories = {
    'General/Fever': {
      icon: '🦠',
      symptoms: [
        'high_fever', 'mild_fever', 'fatigue', 'lethargy',
        'malaise', 'sweating', 'shivering', 'chills',
        'weakness_in_limbs', 'dehydration'
      ]
    },
    'Respiratory': {
      icon: '🫁',
      symptoms: [
        'continuous_sneezing', 'cough', 'breathlessness',
        'phlegm', 'throat_irritation', 'runny_nose',
        'congestion', 'chest_pain', 'sinus_pressure',
        'mucoid_sputum', 'rusty_sputum', 'blood_in_sputum'
      ]
    },
    'Digestive': {
      icon: '🤢',
      symptoms: [
        'stomach_pain', 'acidity', 'vomiting', 'indigestion',
        'nausea', 'loss_of_appetite', 'abdominal_pain',
        'diarrhea', 'constipation', 'pain_during_bowel_movements',
        'pain_in_anal_region', 'bloody_stool', 'irritation_in_anus',
        'belly_pain', 'passage_of_gases', 'internal_itching',
        'distention_of_abdomen', 'stomach_bleeding', 'ulcers_on_tongue'
      ]
    },
    'Skin': {
      icon: '🩸',
      symptoms: [
        'itching', 'skin_rash', 'nodal_skin_eruptions',
        'skin_peeling', 'blackheads', 'pus_filled_pimples',
        'scurring', 'blister', 'red_sore_around_nose',
        'yellow_crust_ooze', 'dischromic_patches',
        'silver_like_dusting', 'small_dents_in_nails',
        'inflammatory_nails', 'patches_in_throat', 'yellowish_skin'
      ]
    },
    'Neurological': {
      icon: '🧠',
      symptoms: [
        'headache', 'dizziness', 'spinning_movements',
        'loss_of_balance', 'unsteadiness',
        'weakness_of_one_body_side', 'altered_sensorium',
        'loss_of_smell', 'lack_of_concentration',
        'visual_disturbances', 'blurred_and_distorted_vision',
        'slurred_speech', 'coma'
      ]
    },
    'Musculoskeletal': {
      icon: '💪',
      symptoms: [
        'joint_pain', 'back_pain', 'neck_pain', 'knee_pain',
        'hip_joint_pain', 'muscle_weakness', 'muscle_pain',
        'weakness_in_limbs', 'stiff_neck', 'swelling_joints',
        'movement_stiffness', 'muscle_wasting', 'cramps',
        'painful_walking'
      ]
    },
    'Urinary': {
      icon: '💧',
      symptoms: [
        'burning_micturition', 'spotting_urination',
        'dark_urine', 'yellow_urine', 'bladder_discomfort',
        'foul_smell_ofurine', 'continuous_feel_of_urine',
        'polyuria'
      ]
    },
    'Eyes & Vision': {
      icon: '👁️',
      symptoms: [
        'pain_behind_the_eyes', 'redness_of_eyes',
        'watering_from_eyes', 'sunken_eyes',
        'yellowing_of_eyes', 'puffy_face_and_eyes'
      ]
    },
    'Cardiovascular': {
      icon: '🫀',
      symptoms: [
        'fast_heart_rate', 'palpitations', 'swollen_legs',
        'swollen_blood_vessels', 'prominent_veins_on_calf'
      ]
    },
    'Metabolic/Weight': {
      icon: '⚖️',
      symptoms: [
        'weight_gain', 'weight_loss', 'obesity',
        'excessive_hunger', 'increased_appetite',
        'brittle_nails', 'enlarged_thyroid',
        'swollen_extremeties', 'irregular_sugar_level'
      ]
    },
    'Mental/Mood': {
      icon: '😌',
      symptoms: [
        'anxiety', 'mood_swings', 'restlessness',
        'depression', 'irritability'
      ]
    },
    'Other': {
      icon: '🩺',
      symptoms: [
        'bruising', 'cold_hands_and_feets',
        'acute_liver_failure', 'fluid_overload',
        'swelling_of_stomach', 'swelled_lymph_nodes',
        'toxic_look_(typhos)', 'abnormal_menstruation',
        'extra_marital_contacts', 'drying_and_tingling_lips',
        'family_history', 'receiving_blood_transfusion',
        'receiving_unsterile_injections',
        'history_of_alcohol_consumption', 'prognosis'
      ]
    }
  };

  // --- API ACTIONS ---
  
  // Load available symptoms on first mount
  useEffect(() => { 
    fetchSymptoms(); 
  }, []);

  // Fetch symptoms from Flask backend
  async function fetchSymptoms() {
    try {
      setLoading(true);
      const response = await fetch("http://127.0.0.1:5000/symptoms");
      if (!response.ok) throw new Error("Failed to fetch symptoms");
      
      const data = await response.json();
      setAllSymptoms(data.symptoms); // Sync local list with backend feature columns
      setError(null);
    } catch (err) {
      console.error("Error fetching symptoms:", err);
      setError("Failed to load symptoms. Please try again.");
    } finally {
      setLoading(false);
    }
  }


   /**
   * Submits selected symptoms to the ML backend and processes response.
   * Normalizes probabilities for UX consistency (Top result = 100%).
   */
  async function getPredictions() {
    if (selectedSymptoms.length === 0) {
      alert("Please select at least one symptom");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: selectedSymptoms })
      });

      if (!response.ok) throw new Error("Prediction failed");

      const data = await response.json();
      const rawPredictions = data.predictions;

      // Calculate relative confidence to make the Bar Chart more intuitive
      const maxProb = Math.max(...rawPredictions.map(p => p.probability));
      
      // Scale the results so the top prediction appears as the 100% reference.
      // Raw model probabilities might be low
      const normalizedPredictions = rawPredictions.map(p => ({
        ...p,
        // Preserve the true model probability for tooltips/debugging
        raw_probability: p.probability,  
        // Calculate the relative confidence score (0.0 to 1.0)
        probability: maxProb > 0 ? p.probability / maxProb : 0
      }));

      // Set these states triggers React to re-draw the Bar Chart and Heatmap
      setSymptomContributions(data.symptom_contributions || {});  
      setPredictions(normalizedPredictions);
    } catch (err) { // Error handling
      console.error("Error getting predictions:", err);
      alert("Failed to get predictions. Please try again.");
    }
  }

  // --- SELECTION HANDLERS ---  
  /**
   * Toggle a symptom's selection state
   * If selected, remove it. If not selected, add it.
   */
  function toggleSymptom(symptom) {
    setSelectedSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)  // Remove
        : [...prev, symptom]                // Add
    );
  }

  /**
   * Remove a specific symptom from selection
   */
  function removeSymptom(symptom) {
    setSelectedSymptoms(prev => prev.filter(s => s !== symptom));
  }

  /**
   * Clear all selected symptoms
   */
  function clearAllSymptoms() {
    setSelectedSymptoms([]);
  }

  // --- RENDERING ---
  
  // Loading state
  if (loading) {
    return (
      
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading symptoms...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  return (
    
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8">
    
      {/* ===== HEADER ===== */}
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
          🏥 Disease Diagnosis System
        </h1>
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6 mt-px">
  <div className="flex items-start gap-2">
    <span className="text-xl">⚠️</span>
    <div className="text-sm text-yellow-200">
      <strong>Medical Disclaimer:</strong> This tool is for educational purposes only 
      and should not be used as a substitute for professional medical advice, diagnosis, 
      or treatment. Always consult a qualified healthcare provider.
    </div>
  </div>
</div>
        <p className="text-zinc-400">
          Select your symptoms to get disease predictions
        </p>
      </header>

      {/* --- MAIN CONTENT --- */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* LEFT PANEL - Symptom Selection */}
        <div className="space-y-6">
          
          {/* Common Symptoms Section */}
          <div className="bg-zinc-900 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span>⚡</span>
              Quick Select - Common Symptoms
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {commonSymptoms.map(symptom => (
                <button
                  key={symptom}
                  onClick={() => toggleSymptom(symptom)}
                  className={`text-sm px-3 py-2 rounded-lg border transition
                    ${
                      selectedSymptoms.includes(symptom)
                        ? "bg-purple-600 border-purple-500 text-white"
                        : "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                    }`}
                >
                  {symptom.replaceAll("_", " ").split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Symptoms Bar */}
          <SelectedSymptomsBar
            selectedSymptoms={selectedSymptoms}
            onRemove={removeSymptom}
            onClear={clearAllSymptoms}
          />

          {/* Divider */}
          <div className="text-center text-zinc-500 text-sm py-2">
            or browse by category
          </div>

          {/* All Categories */}
          {Object.entries(categories).map(([categoryName, categoryData]) => (
            <CategorySelector
              key={categoryName}
              title={categoryName}
              icon={categoryData.icon}
              symptoms={categoryData.symptoms}
              selectedSymptoms={selectedSymptoms}
              onToggle={toggleSymptom}
            />
          ))}

          {/* Get Predictions Button */}
          <button
            onClick={getPredictions}
            disabled={selectedSymptoms.length === 0}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition shadow-lg disabled:shadow-none"
          >
            {selectedSymptoms.length === 0
              ? "Select symptoms to get diagnosis"
              : `Get Diagnosis (${selectedSymptoms.length} symptoms)`
            }
          </button>
        </div>

        {/* RIGHT PANEL - Predictions */}
        <div className="bg-zinc-900 rounded-xl p-6 shadow-lg sticky top-8">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Disease Predictions <i>(Relative Confidence)</i>
          </h2>
          
          {/* Predictions Bar Chart */}
          <PredictionBarChart
            key={JSON.stringify(predictions)}
            predictions={predictions}
          />
          {/* Symptom Contribution Heatmap */}
          <div className="mt-8">
            <SymptomContributionHeatmap 
              predictions={predictions}
              selectedSymptoms={selectedSymptoms}
              contributions={symptomContributions}
            />
          </div>
        </div>
      </div>
    </div>
  );
}