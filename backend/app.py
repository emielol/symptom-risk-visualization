"""
File:         app.py
Author:       Noemie Florant
Description:  Flask web server for the disease diagnosis system.
              Serves the web interface and provides REST API endpoints for
              symptom retrieval and disease prediction using the ML model.
"""

import os
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
from .model.predict import (
    load_model_and_metadata,
    predict_top_k_from_json,
    calculate_symptom_contributions
)


# Configuration
TOP_K_PREDICTIONS = 5

# Initialize a flask app
app = Flask(__name__)
CORS(app)

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global model variables - Load model and related data once at startup
try:
    model, feature_map, severity_dict = load_model_and_metadata()
    logger.info("Model and metadata loaded successfully.")
except Exception as e:
    logger.error(f"Failed to load model: {e}")
    raise e


@app.route("/")
def home():
    """Health check endpoint to verify backend status."""
    return jsonify({"status": "backend running"}), 200


@app.route('/symptoms', methods=['GET'])
def get_symptoms():
    """
    Retrieve all available symptom names.
    
    Returns: 
        Response: JSON object containing list of symptom strings.
    """
    symptoms = list(severity_dict.keys())
    return jsonify({"symptoms": symptoms}), 200



@app.route('/predict', methods=['POST'])
def predict():
    """Processes symptoms and returns top disease predictions."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Invalid or missing JSON body'}), 400
    symptoms = data.get('symptoms', [])
    
    # Input validation 
    if not isinstance(symptoms, list) or not symptoms:
        return jsonify({'error': 'Symptoms must be a non-empty list'}), 400
    
    try:
        # Generate predictions in one clean flow with the model
        predictions = predict_top_k_from_json(
            model,
            data,
            feature_map,
            severity_dict,
            TOP_K_PREDICTIONS
        )

        # Generate symptom contributions for each disease prediction
        contributions = calculate_symptom_contributions(
            model,
            data,
            predictions,
            feature_map,
            severity_dict
        )

        # Return predictions as JSON
        return jsonify({
            "predictions": predictions, 
            "symptom_contributions": contributions
            }), 200
    
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify({'error': 'Prediction failed. Internal Server Error'}), 500




# Application Entry Point 
if __name__ == '__main__':
    """
    Run the Flask development server.
    Uses FLASK_DEBUG environment variable to toggle debug mode.
    """
    debug_mode = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    
    # Run the server
    app.run(host='0.0.0.0', port=5000, debug=debug_mode)