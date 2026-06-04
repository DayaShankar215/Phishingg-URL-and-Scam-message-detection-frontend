import re
import requests

def extract_urls_from_text(text):
    """Extract all URLs from text"""
    url_pattern = r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+[^\s]*'
    return re.findall(url_pattern, text)

def calculate_risk_level(risk_score):
    """Convert risk score to risk level"""
    if risk_score > 70:
        return 'high'
    elif risk_score > 30:
        return 'medium'
    else:
        return 'low'

def get_risk_color(risk_score):
    """Get color for risk score"""
    if risk_score > 70:
        return '#ef4444'  # Red
    elif risk_score > 30:
        return '#f59e0b'  # Yellow
    else:
        return '#10b981'  # Green