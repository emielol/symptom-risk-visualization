"""
File:         train.py
Author:       Noemie Florant
Description:  End-to-end training pipeline: loads data, cleans symptoms,
              builds a weighted feature matrix, and builds the SVM model.
"""

import os
import pandas as pd
import numpy as np
import pickle
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, classification_report

from encoding import build_severity_dict

# Finds the directory where THIS file lives
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Build the paths relative to this file
DATASET_PATH = os.path.join(BASE_DIR, "data", "dataset.csv")
SEVERITY_PATH = os.path.join(BASE_DIR, "data", "Symptom-severity.csv")
ARTIFACT_DIR = os.path.join(BASE_DIR, "artifacts")


def normalize_symptom(symptom: str) -> str:
    """Standardizes symptom strings for consistency across datasets."""
    if not isinstance(symptom, str):
        return ""
    return (
        symptom.strip()
        .lower()
        .replace(" ", "_")
        .replace("__", "_")
    )


def clean_dataset(training_df: pd.DataFrame) -> pd.DataFrame:
    """Cleans raw data and handles specific naming inconsistencies."""
    df = training_df.copy()
    df[df == 'diarrhoea'] = 'diarrhea' # Specific naming inconsistency
    
    # Apply normalization to symptom columns
    for col in df.columns[1:]:  # Skip Disease
        df[col] = (df[col].astype(str).apply(normalize_symptom))

    return df


def extract_all_symptoms(training_df: pd.DataFrame):
    """Extracts a unique, sorted list of all symptoms present in the dataset"""
    symptoms = set()
    for col in training_df.columns[1:]:
        symptoms.update(training_df[col].unique())
    
    # Remove any empty strings or 'nan' that might have been picked up
    symptoms.discard("nan")
    symptoms.discard("")
    return sorted(list(symptoms))


def build_feature_matrix(training_df, symptom_list, severity_lookup):
    """
    Transforms wide-format symptom data into a numerical feature matrix.
    
    Returns:
        X (pd.DataFrame): Severity-weighted feature matrix.
        y (pd.Series): Target labels (Diseases).
    """
    X = pd.DataFrame(0, index=training_df.index, columns=symptom_list)

    # Logic: Iterate through symptoms and fill the feature matrix.
    for row_idx, row in training_df.iterrows():
        for symptom in row[1:]:
            if symptom in X.columns:
                X.at[row_idx, symptom] = severity_lookup.get(symptom, 1)

    y = training_df["Disease"]
    return X, y


def train_model(X, y, random_state=42):
    """
    Trains an SVM with cross-validation for robust performance estimation.
    
    Uses 5-fold CV on 80% of data, then trains final model on all training data.
    Evaluates on held-out 20% test set for honest final assessment.
    """
    # Hold out 20% for final testing 
    X_train_full, X_test, y_train_full, y_test = train_test_split(
        X, y, test_size=0.2, shuffle=True, random_state=random_state
    )
    
    # Initialize model
    model = SVC(probability=True, random_state=random_state)
    
    # 5-Fold Cross-Validation
    print(f"--- Running 5-Fold Cross-Validation ---")
    cv_scores = cross_val_score(
        model, 
        X_train_full, 
        y_train_full, 
        cv=5,  # 5 folds
        scoring='accuracy',
        n_jobs=-1  # Use all CPU cores 
    )
    
    print(f"CV Fold Scores: {[f'{score:.2%}' for score in cv_scores]}")
    print(f"Mean CV Accuracy: {cv_scores.mean():.2%}") # 97.13%
    print(f"Std Deviation: ±{cv_scores.std():.2%}") # .99%
    print()
    
    # Train final model on ALL training data
    print(f"--- Training Final Model ---")
    model.fit(X_train_full, y_train_full)
    
    # Final honest evaluation on test set
    y_pred = model.predict(X_test)
    test_accuracy = accuracy_score(y_test, y_pred)
    
    print(f"--- Model Training Complete ---")
    print(f"Final Test Accuracy: {test_accuracy:.2%}") # 95.08%
    print()

    return model


def main():
    """Execution entry point for the training pipeline."""
    # Ensure artifacts directory exists
    os.makedirs(ARTIFACT_DIR, exist_ok=True)

    # Load and Clean data
    raw_data = pd.read_csv(DATASET_PATH)
    severity_df = pd.read_csv(SEVERITY_PATH)
    
    cleaned_data = clean_dataset(raw_data)
    deduped_cleaned_data = cleaned_data.drop_duplicates()

    # Build severity lookup 
    severity_dict = build_severity_dict(severity_df)
    severity_dict = {normalize_symptom(k): v for k, v in severity_dict.items()}
    
    # Feature Engineering
    feature_map = extract_all_symptoms(deduped_cleaned_data)
    X, y = build_feature_matrix(deduped_cleaned_data, feature_map, severity_dict)
    
    # Train model
    model = train_model(X, y)

    # Persist artifacts
    artifacts = {
        "model.pkl": model,
        "feature_map.pkl": feature_map,
        "severity_map.pkl": severity_dict
    }

    for filename, obj in artifacts.items():
        path = os.path.join(ARTIFACT_DIR, filename)
        with open(path, "wb") as f:
            pickle.dump(obj, f)
        print(f"Saved: {path}")

    return model


if __name__ == "__main__":
    main()
