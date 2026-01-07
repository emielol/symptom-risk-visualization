"""
File:         encoding.py
Author:       Noemie Florant
Description:  Utility functions for transforming raw symptom text into 
              numerical vectors for ML model inference.
"""
import numpy as np
from typing import List, Dict, Any

def build_severity_dict(severity_map) -> Dict[str, int]:
    """
    Converts a severity DataFrame into a lookup dictionary.
    
    Args:
        severity_df (pd.DataFrame): DataFrame containing 'Symptom' and 'weight' columns.
        
    Returns:
        Dict[str, int]: A dictionary mapping symptom names to their severity weights.
    """
    return dict(zip(severity_map['Symptom'], severity_map['weight']))


def encode_user_symptoms(
    request_json: Dict[str, Any], 
    feature_columns: List[str], 
    severity_lookup: Dict[str, int]
        ) -> List[int]:
    """
    Transforms a list of symptoms from a JSON request into a weighted numerical vector.
    
    Args:
        request_json (dict): The incoming API request body.
        feature_columns (list): The list of features the model was trained on.
        severity_lookup (dict): dictionary mapping symptom names to their severity weights.
    
    Returns:
        List[int]: A numerical vector where indices correspond to feature_columns.
    """
    # Create empty vector of zeroes
    vector = [0] * len(feature_columns)

    # Extract symptoms from request
    input_symptoms = request_json.get("symptoms", [])

    # Pre-build a map of feature names to their index for O(1) lookup speed
    feature_to_idx = {name: i for i, name in enumerate(feature_columns)}

    for symptom in input_symptoms:
        # Standardize string format to match feature column naming conventions
        clean_symptom = symptom.strip().lower().replace(" ", "_")

        if clean_symptom in feature_to_idx:
            index = feature_to_idx[clean_symptom]
            # Use the severity weight, defaulting to 1 if not found in lookup
            vector[index] = severity_lookup.get(symptom, 1)

    return vector
