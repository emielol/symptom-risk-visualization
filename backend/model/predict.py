"""
File:         predict.py
Author:       Noemie Florant
Description:  Inference logic for the disease diagnosis system. 
              Handles model loading, disease prediction, and symptom 
              contribution analysis.
"""

import pickle
import os
import numpy as np
import pandas as pd
from .encoding import encode_user_symptoms

# Define paths relative to this file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "artifacts/model.pkl")
FEATURE_MAP_PATH = os.path.join(BASE_DIR, "artifacts/feature_map.pkl")
SEVERITY_PATH = os.path.join(BASE_DIR, "artifacts/severity_map.pkl")

def load_model_and_metadata():
    """
    Loads trained SVM model and associated metadata artifacts.
    """
    try:
        with open(MODEL_PATH, 'rb') as file:
            model = pickle.load(file)
        with open(FEATURE_MAP_PATH, 'rb') as file:
            feature_map = pickle.load(file)
        with open(SEVERITY_PATH, 'rb') as file:
            severity_dict = pickle.load(file)
        return model, feature_map, severity_dict
    except FileNotFoundError as e:
        print(f"Error: Missing artifact file. {e}")
        raise


def predict_top_k_from_json(model, request_json, feature_columns, severity_table, k=5):
    """
    Predicts top K diseases based on input symptoms.
    """
    # Vectorize the text symptoms
    vector = encode_user_symptoms(
        request_json,
        feature_columns,
        severity_table
        )

    # Get probabilities across all classes
    probabilities = model.predict_proba([vector])[0]
    classes = model.classes_

    # Pair and sort diseases by probabilities
    disease_probs = sorted(
        zip(classes, probabilities), 
        key=lambda x: x[1], 
        reverse=True)


    # Format the top K results into a clean list of dictionaries
    top_k_predictions = []

    for disease, probability in disease_probs[:k]:
        top_k_predictions.append({
            "disease": str(disease),
            "probability": round(float(probability), 4) # Rounding to 4 places for clean UI/UX
        })

    return top_k_predictions

def calculate_symptom_contributions(
    model, 
    request_json, 
    predictions, 
    feature_columns, 
    severity_table
):
    """
    Calculates the impact of each symptom on the final predictions.
    
    Uses a 'Leave-One-Out' approach to see how much the probability 
    drops when a specific symptom is removed.
    """
    selected_symptoms = request_json.get("symptoms", [])
    
    # Establish the baseline (Probability with ALL symptoms present)
    baseline_vector = encode_user_symptoms(request_json, feature_columns, severity_table)
    baseline_probs = model.predict_proba([baseline_vector])[0]
    
    # Map disease predictions to their indeces in the model's predictions array
    classes = model.classes_
    disease_to_idx = {disease: idx for idx, disease in enumerate(classes)}

    # Map features to their indeces in features array
    feature_to_idx = {name: i for i, name in enumerate(feature_columns)}
    
    # Store our raw math results temporarily
    raw_impact_results = {}

    # Analyze each disease prediction individually
    for pred in predictions:
        disease = pred['disease']
        d_idx = disease_to_idx[disease]
        baseline_prob = baseline_probs[d_idx]
        
        disease_scores = {}
        
        for symptom in selected_symptoms:
            # We assume the symptom is already cleaned from app.jsx
            if symptom not in feature_to_idx:
                continue
                
            s_idx = feature_to_idx[symptom]
            
            # --- THE 'LEAVE-ONE-OUT' EXPERIMENT ---
            # Create a copy and 'mute' this specific symptom (set to 0)
            temp_vector = baseline_vector.copy()  
            temp_vector[s_idx] = 0
            
            # Re-predict to see the impact of that omission
            new_probs = model.predict_proba([temp_vector])[0]
            new_prob = new_probs[d_idx]
            
            # Calculate impact: Difference in probability * severity weight
            prob_drop = max(0, baseline_prob - new_prob)
            weight = severity_table.get(symptom, 1)
            
            disease_scores[symptom] = prob_drop * weight

        raw_impact_results[disease] = disease_scores

    # --- Scaling for the UI ---
    # Find the highest impact score to use as our 100% reference point
    all_scores = [score for d_scores in raw_impact_results.values() for score in d_scores.values()]
    highest_impact = max(all_scores) if all_scores else 1

    final_analysis = {}

    for disease, scores in raw_impact_results.items():
        final_analysis[disease] = {
            symptom: {
                'raw': round(score, 6),
                'scaled': round((score / highest_impact) * 100, 2) if highest_impact > 0 else 0
            }
            # 'score' is pulled from the 'scores' dictionary values here
            for symptom, score in scores.items()
        }
        
    return final_analysis

