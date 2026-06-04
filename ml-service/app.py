from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os
import re
import numpy as np
from feature_extraction import URLFeatureExtractor

app = Flask(__name__)
CORS(app)

# Global variables for models
url_model = None
message_model = None
tfidf_vectorizer = None
feature_extractor = None

def load_models():
    """Load trained models"""
    global url_model, message_model, tfidf_vectorizer, feature_extractor
    
    print("📦 Loading ML models...")
    
    try:
        url_model = joblib.load('models/url_classifier.pkl')
        print("✅ URL classifier loaded")
    except Exception as e:
        print(f"⚠️ URL classifier not found: {e}")
        print("   Run train_models.py first")
    
    try:
        message_model = joblib.load('models/message_classifier.pkl')
        print("✅ Message classifier loaded")
    except Exception as e:
        print(f"⚠️ Message classifier not found: {e}")
    
    try:
        tfidf_vectorizer = joblib.load('models/tfidf_vectorizer.pkl')
        print("✅ TF-IDF vectorizer loaded")
    except Exception as e:
        print(f"⚠️ TF-IDF vectorizer not found: {e}")
    
    try:
        feature_extractor = URLFeatureExtractor()
        print("✅ Feature extractor loaded")
    except Exception as e:
        print(f"⚠️ Feature extractor error: {e}")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'models_loaded': url_model is not None,
        'message_model_loaded': message_model is not None,
        'service': 'ML Prediction Service',
        'version': '1.0.0'
    })

@app.route('/predict/url', methods=['POST'])
def predict_url():
    """Predict if a URL is phishing"""
    try:
        data = request.json
        url = data.get('url', '')
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        # Extract features
        features = feature_extractor.extract_features(url)
        
        # Convert features to array for prediction
        feature_names = ['url_length', 'has_https', 'special_chars', 'has_ip', 'dot_count', 
                         'has_suspicious_keywords', 'has_phish_keywords', 'subdomain_count', 
                         'has_at_symbol', 'has_hyphen', 'has_underscore', 'digit_count', 
                         'letter_count', 'path_length', 'special_char_ratio', 'digit_ratio',
                         'query_length', 'has_query', 'domain_length', 'has_port']
        
        # Create feature vector
        feature_vector = []
        for name in feature_names:
            if name in features:
                feature_vector.append(features[name])
            else:
                feature_vector.append(0)
        
        # Make prediction
        if url_model:
            prediction = url_model.predict([feature_vector])[0]
            probabilities = url_model.predict_proba([feature_vector])[0]
            probability = max(probabilities)
            risk_score = int(probability * 100)
            
            # Generate explanation based on features
            explanation = generate_url_explanation(features, prediction)
            
            result = {
                'prediction': 'phishing' if prediction == 1 else 'legitimate',
                'probability': float(probability),
                'risk_score': risk_score,
                'features_extracted': features,
                'explanation': explanation,
                'classification': 'Phishing Website Detected' if prediction == 1 else 'Legitimate Website'
            }
        else:
            result = {
                'prediction': 'unknown',
                'probability': 0.5,
                'risk_score': 50,
                'error': 'Model not loaded'
            }
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/predict/message', methods=['POST'])
def predict_message():
    """Predict if a message is scam"""
    try:
        data = request.json
        message = data.get('text', '')
        
        if not message:
            return jsonify({'error': 'Message text is required'}), 400
        
        # Extract URLs from message
        url_pattern = r'https?://[^\s]+'
        extracted_urls = re.findall(url_pattern, message)
        
        # Extract phone numbers
        phone_pattern = r'\b9[0-9]{9}\b'
        extracted_phones = re.findall(phone_pattern, message)
        
        # Make prediction using TF-IDF
        if message_model and tfidf_vectorizer:
            # Transform message using TF-IDF
            message_tfidf = tfidf_vectorizer.transform([message])
            
            # Predict
            prediction = message_model.predict(message_tfidf)[0]
            probabilities = message_model.predict_proba(message_tfidf)[0]
            probability = max(probabilities)
            risk_score = int(probability * 100)
            
            # Extract scam indicators
            scam_keywords = [
                'free', 'winner', 'prize', 'claim', 'urgent', 'congratulations', 
                'verified', 'account', 'password', 'click', 'link', 'money', 'cash',
                'won', 'lottery', 'reward', 'offer', 'discount', 'bonus', 'gift',
                # Nepal-specific keywords
                'khalti', 'esewa', 'imepay', 'ncell', 'ntc', 'bank', 'prize',
                'jackpot', 'winner', 'selected', 'lucky', 'winner', 'award'
            ]
            
            found_keywords = [kw for kw in scam_keywords if kw in message.lower()]
            
            # Calculate additional features
            uppercase_ratio = sum(1 for c in message if c.isupper()) / max(len(message), 1)
            special_chars = sum(1 for c in message if not c.isalnum() and not c.isspace())
            
            # Generate explanation
            explanation = generate_message_explanation(prediction, found_keywords, extracted_urls, extracted_phones)
            
            result = {
                'prediction': 'scam' if prediction == 1 else 'legitimate',
                'probability': float(probability),
                'risk_score': risk_score,
                'extracted_urls': extracted_urls,
                'extracted_phones': extracted_phones,
                'suspicious_keywords_found': found_keywords,
                'message_length': len(message),
                'uppercase_ratio': uppercase_ratio,
                'special_char_count': special_chars,
                'explanation': explanation,
                'classification': 'Scam Message Detected' if prediction == 1 else 'Legitimate Message'
            }
        else:
            result = {
                'prediction': 'unknown',
                'probability': 0.5,
                'risk_score': 50,
                'extracted_urls': extracted_urls,
                'error': 'Models not loaded'
            }
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def generate_url_explanation(features, prediction):
    """Generate human-readable explanation for URL classification"""
    explanations = []
    
    if prediction == 1:  # Phishing
        if features.get('has_https', 0) == 0:
            explanations.append("The URL does not use HTTPS, which is a security concern")
        
        if features.get('has_ip', 0) == 1:
            explanations.append("The URL contains an IP address instead of a domain name (common in phishing)")
        
        if features.get('has_suspicious_keywords', 0) == 1:
            explanations.append("Suspicious keywords detected in the URL")
        
        if features.get('has_phish_keywords', 0) == 1:
            explanations.append("URL contains phishing-related keywords")
        
        if features.get('url_length', 0) > 100:
            explanations.append(f"Unusually long URL ({features['url_length']} characters)")
        
        if features.get('special_chars', 0) > 5:
            explanations.append(f"Many special characters detected ({features['special_chars']})")
        
        if not explanations:
            explanations.append("Multiple suspicious patterns detected in the URL structure")
    else:
        explanations.append("The URL appears legitimate based on structural analysis")
    
    return " ".join(explanations)

def generate_message_explanation(prediction, keywords, urls, phones):
    """Generate human-readable explanation for message classification"""
    explanations = []
    
    if prediction == 1:  # Scam
        if keywords:
            explanations.append(f"Suspicious keywords detected: {', '.join(keywords[:5])}")
        
        if urls:
            explanations.append("Message contains suspicious URLs")
        
        if phones:
            explanations.append("Message contains phone numbers (common in scams)")
        
        if not explanations:
            explanations.append("Multiple scam indicators detected in the message")
    else:
        explanations.append("The message appears legitimate based on content analysis")
    
    return " ".join(explanations)

@app.route('/extract_features', methods=['POST'])
def extract_features():
    """Extract features from URL without prediction"""
    try:
        data = request.json
        url = data.get('url', '')
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        features = feature_extractor.extract_features(url)
        return jsonify(features)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("="*60)
    print("🚀 Starting ML Prediction Service")
    print("="*60)
    
    # Load models
    load_models()
    
    # Start server
    print("\n🌐 Starting Flask server on http://localhost:5000")
    print("📡 Endpoints:")
    print("   GET  /health - Health check")
    print("   POST /predict/url - Predict phishing URL")
    print("   POST /predict/message - Predict scam message")
    print("   POST /extract_features - Extract URL features")
    print("\nPress Ctrl+C to stop\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)