import re
import urllib.parse
import tldextract
from urllib.parse import urlparse
import math

class URLFeatureExtractor:
    """Extract features from URLs for phishing detection"""
    
    def __init__(self):
        self.suspicious_keywords = [
            'login', 'signin', 'verify', 'account', 'secure', 'update',
            'confirm', 'banking', 'paypal', 'ebay', 'amazon', 'apple',
            'microsoft', 'google', 'facebook', 'instagram', 'whatsapp',
            'security', 'authenticate', 'validate', 'unlock', 'alert',
            'password', 'credential', 'verify', 'restore', 'claim'
        ]
        
        self.phish_keywords = [
            'free', 'winner', 'prize', 'reward', 'claim', 'offer',
            'discount', 'bonus', 'cash', 'money', 'gift', 'promo',
            'lucky', 'congratulations', 'urgent', 'immediate', 'action',
            'limited', 'exclusive', 'guaranteed'
        ]
    
    def extract_features(self, url):
        """Extract all features from a URL"""
        # Ensure URL has protocol
        if not url.startswith(('http://', 'https://')):
            url = 'http://' + url
            
        features = {}
        
        # Basic URL features
        features['url_length'] = self.get_url_length(url)
        features['has_https'] = self.check_https(url)
        features['special_chars'] = self.count_special_chars(url)
        features['has_ip'] = self.check_ip_address(url)
        features['dot_count'] = url.count('.')
        features['has_suspicious_keywords'] = self.check_suspicious_keywords(url)
        features['has_phish_keywords'] = self.check_phish_keywords(url)
        
        # Advanced features
        features['subdomain_count'] = self.count_subdomains(url)
        features['has_at_symbol'] = 1 if '@' in url else 0
        features['has_hyphen'] = 1 if '-' in url else 0
        features['has_underscore'] = 1 if '_' in url else 0
        features['digit_count'] = sum(c.isdigit() for c in url)
        features['letter_count'] = sum(c.isalpha() for c in url)
        features['path_length'] = self.get_path_length(url)
        features['query_length'] = self.get_query_length(url)
        
        # Character ratios
        features['special_char_ratio'] = features['special_chars'] / max(features['url_length'], 1)
        features['digit_ratio'] = features['digit_count'] / max(features['url_length'], 1)
        
        return features
    
    def get_url_length(self, url):
        return len(url)
    
    def check_https(self, url):
        return 1 if url.lower().startswith('https') else 0
    
    def count_special_chars(self, url):
        special_chars = r'[!@#$%^&*()_+={}\[\]|\\:;"\'<>,.?/~`]'
        return len(re.findall(special_chars, url))
    
    def check_ip_address(self, url):
        ip_pattern = r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b'
        return 1 if re.search(ip_pattern, url) else 0
    
    def check_suspicious_keywords(self, url):
        url_lower = url.lower()
        return 1 if any(keyword in url_lower for keyword in self.suspicious_keywords) else 0
    
    def check_phish_keywords(self, url):
        url_lower = url.lower()
        return 1 if any(keyword in url_lower for keyword in self.phish_keywords) else 0
    
    def count_subdomains(self, url):
        try:
            extracted = tldextract.extract(url)
            subdomain_parts = extracted.subdomain.split('.')
            return len([s for s in subdomain_parts if s])
        except:
            return 0
    
    def get_path_length(self, url):
        try:
            parsed = urlparse(url)
            return len(parsed.path)
        except:
            return 0
    
    def get_query_length(self, url):
        try:
            parsed = urlparse(url)
            return len(parsed.query)
        except:
            return 0