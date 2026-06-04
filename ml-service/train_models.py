import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.naive_bayes import GaussianNB, MultinomialNB
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
import joblib
import nltk
from nltk.corpus import stopwords
import warnings
import re
import urllib.parse
from urllib.parse import urlparse
import tldextract

warnings.filterwarnings('ignore')

# Download NLTK data
nltk.download('stopwords')
nltk.download('punkt')

class URLFeatureExtractor:
    """Extract features from URLs for phishing detection"""
    
    def __init__(self):
        self.suspicious_keywords = [
            'login', 'signin', 'verify', 'account', 'secure', 'update',
            'confirm', 'banking', 'paypal', 'ebay', 'amazon', 'apple',
            'microsoft', 'google', 'facebook', 'instagram', 'whatsapp',
            'security', 'authenticate', 'validate', 'unlock', 'alert',
            'password', 'credential', 'verify', 'restore', 'claim',
            # Nepal-specific keywords
            'khalti', 'esewa', 'imepay', 'ncell', 'ntc', 'nabil', 'prabhu',
            'globalime', 'fonepay', 'himlayan', 'siddhartha', 'kumari',
            'everest', 'sanima', 'nicasia', 'nrb', 'nepaltelecom'
        ]
        
        self.phish_keywords = [
            'free', 'winner', 'prize', 'reward', 'claim', 'offer',
            'discount', 'bonus', 'cash', 'money', 'gift', 'promo',
            'lucky', 'congratulations', 'urgent', 'immediate', 'action',
            'limited', 'exclusive', 'guaranteed', 'verify', 'update',
            'secure', 'confirm', 'validate', 'unlock', 'alert'
        ]
    
    def extract_features(self, url):
        """Extract all features from a URL"""
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
        
        # Character ratios
        features['special_char_ratio'] = features['special_chars'] / max(features['url_length'], 1)
        features['digit_ratio'] = features['digit_count'] / max(features['url_length'], 1)
        
        # URL parts
        features['query_length'] = self.get_query_length(url)
        features['has_query'] = 1 if features['query_length'] > 0 else 0
        
        # Domain features
        try:
            parsed = urlparse(url)
            domain = parsed.netloc
            features['domain_length'] = len(domain)
            features['has_port'] = 1 if ':' in domain and domain.count(':') == 1 else 0
        except:
            features['domain_length'] = 0
            features['has_port'] = 0
        
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


class PhishingDetector:
    def __init__(self):
        self.url_extractor = URLFeatureExtractor()
        self.url_models = {}
        self.message_model = None
        self.tfidf_vectorizer = None
        self.best_url_model = None
        self.best_message_model = None
        self.model_performance = {}
    
    def load_url_dataset_from_excel(self, excel_path):
        """Load URL dataset from Excel file"""
        print("📂 Loading URL dataset from Excel file...")
        print(f"   File: {excel_path}")
        
        try:
            # Read Excel file
            df = pd.read_excel(excel_path, engine='openpyxl')
            
            print(f"   Total rows: {len(df)}")
            print(f"   Columns: {df.columns.tolist()}")
            
            # Identify type and url columns
            type_col = None
            url_col = None
            
            for col in df.columns:
                if 'type' in col.lower() or 'label' in col.lower():
                    type_col = col
                if 'url' in col.lower() or 'link' in col.lower():
                    url_col = col
            
            if type_col is None:
                type_col = df.columns[0]
            if url_col is None:
                url_col = df.columns[1]
            
            print(f"   Using type column: '{type_col}'")
            print(f"   Using URL column: '{url_col}'")
            
            # Extract phishing and legitimate URLs
            phishing_urls = df[df[type_col].astype(str).str.lower() == 'phishing'][url_col].tolist()
            legitimate_urls = df[df[type_col].astype(str).str.lower() == 'legitimate'][url_col].tolist()
            
            print(f"   Phishing URLs: {len(phishing_urls)}")
            print(f"   Legitimate URLs: {len(legitimate_urls)}")
            
            # Extract features from URLs
            features_list = []
            labels = []
            
            print("   Extracting features from phishing URLs...")
            for url in phishing_urls:
                try:
                    features = self.url_extractor.extract_features(str(url))
                    features_list.append(features)
                    labels.append(1)  # 1 for phishing
                except Exception as e:
                    continue
            
            print("   Extracting features from legitimate URLs...")
            for url in legitimate_urls:
                try:
                    features = self.url_extractor.extract_features(str(url))
                    features_list.append(features)
                    labels.append(0)  # 0 for legitimate
                except Exception as e:
                    continue
            
            self.url_features_df = pd.DataFrame(features_list)
            self.url_labels = np.array(labels)
            
            print(f"\n✅ URL Dataset ready: {len(self.url_features_df)} samples")
            print(f"   Phishing: {sum(labels)} | Legitimate: {len(labels) - sum(labels)}")
            
            # Print feature names
            print(f"   Features: {list(self.url_features_df.columns)}")
            
            return self.url_features_df, self.url_labels
            
        except Exception as e:
            print(f"❌ Error loading Excel file: {e}")
            return None, None
    
    def load_message_dataset_from_excel(self, excel_path):
        """Load SMS dataset from Excel file"""
        print("\n📂 Loading SMS dataset from Excel file...")
        print(f"   File: {excel_path}")
        
        try:
            # Read Excel file
            df = pd.read_excel(excel_path, engine='openpyxl')
            
            print(f"   Total rows: {len(df)}")
            print(f"   Columns: {df.columns.tolist()}")
            
            # Identify label and message columns
            label_col = None
            message_col = None
            
            for col in df.columns:
                if 'label' in col.lower() or 'type' in col.lower() or 'v1' in col.lower():
                    label_col = col
                if 'message' in col.lower() or 'text' in col.lower() or 'v2' in col.lower():
                    message_col = col
            
            if label_col is None:
                label_col = df.columns[0]
            if message_col is None:
                message_col = df.columns[1]
            
            print(f"   Using label column: '{label_col}'")
            print(f"   Using message column: '{message_col}'")
            
            # Extract messages and labels
            self.message_texts = []
            self.message_labels = []
            
            spam_count = 0
            ham_count = 0
            
            for idx, row in df.iterrows():
                text = str(row[message_col]) if pd.notna(row[message_col]) else ""
                label = str(row[label_col]).lower() if pd.notna(row[label_col]) else ""
                
                # Skip empty messages
                if not text or text == 'nan':
                    continue
                
                # Convert label to binary (1 for spam/scam, 0 for ham/legitimate)
                if label in ['spam', 'scam', 'phishing', 'fraud']:
                    self.message_labels.append(1)
                    self.message_texts.append(text)
                    spam_count += 1
                elif label in ['ham', 'legitimate', 'safe']:
                    self.message_labels.append(0)
                    self.message_texts.append(text)
                    ham_count += 1
            
            print(f"   Spam/Scam messages: {spam_count}")
            print(f"   Ham/Legitimate messages: {ham_count}")
            print(f"   Total valid messages: {len(self.message_texts)}")
            
            # Show sample
            if len(self.message_texts) > 0:
                print(f"\n   Sample message:")
                print(f"   - {self.message_texts[0][:100]}...")
            
            return self.message_texts, self.message_labels
            
        except Exception as e:
            print(f"❌ Error loading Excel file: {e}")
            return None, None
    
    def train_url_models(self):
        """Train multiple classifiers for URL detection"""
        print("\n" + "="*60)
        print("🎯 Training URL Detection Models")
        print("="*60)
        
        X = self.url_features_df.values
        y = self.url_labels
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        
        print(f"   Training samples: {len(X_train)}")
        print(f"   Testing samples: {len(X_test)}")
        
        # Define classifiers
        classifiers = {
            'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
            'Naive Bayes': GaussianNB(),
            'Decision Tree': DecisionTreeClassifier(random_state=42),
            'Logistic Regression': LogisticRegression(random_state=42, max_iter=1000)
        }
        
        # Train and evaluate each classifier
        results = {}
        for name, clf in classifiers.items():
            print(f"\n📊 Training {name}...")
            clf.fit(X_train, y_train)
            y_pred = clf.predict(X_test)
            
            # Calculate metrics
            accuracy = accuracy_score(y_test, y_pred)
            precision = precision_score(y_test, y_pred, zero_division=0)
            recall = recall_score(y_test, y_pred, zero_division=0)
            f1 = f1_score(y_test, y_pred, zero_division=0)
            
            # Cross-validation
            cv_scores = cross_val_score(clf, X, y, cv=5)
            
            results[name] = {
                'model': clf,
                'accuracy': accuracy,
                'precision': precision,
                'recall': recall,
                'f1_score': f1,
                'cv_mean': cv_scores.mean(),
                'cv_std': cv_scores.std()
            }
            
            print(f"   ✅ Accuracy: {accuracy:.4f}")
            print(f"   ✅ Precision: {precision:.4f}")
            print(f"   ✅ Recall: {recall:.4f}")
            print(f"   ✅ F1-Score: {f1:.4f}")
            print(f"   ✅ CV Score: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")
        
        # Select best model based on F1-score
        best_model_name = max(results, key=lambda x: results[x]['f1_score'])
        self.best_url_model = results[best_model_name]['model']
        self.url_models = results
        
        print(f"\n🏆 Best URL Model: {best_model_name}")
        print(f"   F1-Score: {results[best_model_name]['f1_score']:.4f}")
        
        return results
    
    def train_message_models(self):
        """Train classifiers for message detection using TF-IDF"""
        print("\n" + "="*60)
        print("💬 Training Message Detection Models")
        print("="*60)
        
        if len(self.message_texts) == 0:
            print("❌ No message data available for training!")
            return {}
        
        # Create TF-IDF features with Nepal-specific terms
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=5000,
            stop_words=stopwords.words('english'),
            ngram_range=(1, 2),
            lowercase=True
        )
        
        X = self.tfidf_vectorizer.fit_transform(self.message_texts)
        y = np.array(self.message_labels)
        
        print(f"   Feature matrix shape: {X.shape}")
        print(f"   Training samples: {X.shape[0]}")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        
        print(f"   Training samples: {len(X_train)}")
        print(f"   Testing samples: {len(X_test)}")
        
        # Define classifiers
        classifiers = {
            'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
            'Naive Bayes': MultinomialNB(),
            'Decision Tree': DecisionTreeClassifier(random_state=42),
            'Logistic Regression': LogisticRegression(random_state=42, max_iter=1000)
        }
        
        # Train and evaluate
        results = {}
        for name, clf in classifiers.items():
            print(f"\n📊 Training {name}...")
            clf.fit(X_train, y_train)
            y_pred = clf.predict(X_test)
            
            # Calculate metrics
            accuracy = accuracy_score(y_test, y_pred)
            precision = precision_score(y_test, y_pred, zero_division=0)
            recall = recall_score(y_test, y_pred, zero_division=0)
            f1 = f1_score(y_test, y_pred, zero_division=0)
            
            # Cross-validation
            cv_scores = cross_val_score(clf, X, y, cv=5)
            
            results[name] = {
                'model': clf,
                'accuracy': accuracy,
                'precision': precision,
                'recall': recall,
                'f1_score': f1,
                'cv_mean': cv_scores.mean(),
                'cv_std': cv_scores.std()
            }
            
            print(f"   ✅ Accuracy: {accuracy:.4f}")
            print(f"   ✅ Precision: {precision:.4f}")
            print(f"   ✅ Recall: {recall:.4f}")
            print(f"   ✅ F1-Score: {f1:.4f}")
            print(f"   ✅ CV Score: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")
        
        # Select best model
        best_model_name = max(results, key=lambda x: results[x]['f1_score'])
        self.best_message_model = results[best_model_name]['model']
        
        print(f"\n🏆 Best Message Model: {best_model_name}")
        print(f"   F1-Score: {results[best_model_name]['f1_score']:.4f}")
        
        return results
    
    def save_models(self):
        """Save trained models to disk"""
        print("\n" + "="*60)
        print("💾 Saving Models")
        print("="*60)
        
        import os
        os.makedirs('models', exist_ok=True)
        
        if self.best_url_model:
            joblib.dump(self.best_url_model, 'models/url_classifier.pkl')
            print("✅ URL classifier saved")
        
        if self.best_message_model:
            joblib.dump(self.best_message_model, 'models/message_classifier.pkl')
            print("✅ Message classifier saved")
        
        if self.tfidf_vectorizer:
            joblib.dump(self.tfidf_vectorizer, 'models/tfidf_vectorizer.pkl')
            print("✅ TF-IDF vectorizer saved")
        
        joblib.dump(self.url_extractor, 'models/feature_extractor.pkl')
        print("✅ Feature extractor saved")
        
        if self.model_performance:
            joblib.dump(self.model_performance, 'models/model_performance.pkl')
            print("✅ Model performance saved")
        
        print("\n🎉 All models saved successfully in 'models/' folder!")
    
    def generate_report(self):
        """Generate model comparison report"""
        print("\n" + "="*60)
        print("📊 MODEL PERFORMANCE COMPARISON REPORT")
        print("="*60)
        
        if self.url_models:
            print("\n📊 URL Detection Models:")
            print("-" * 80)
            print(f"{'Model':<20} {'Accuracy':<12} {'Precision':<12} {'Recall':<12} {'F1-Score':<12}")
            print("-" * 80)
            for name, metrics in self.url_models.items():
                print(f"{name:<20} {metrics['accuracy']:<12.4f} {metrics['precision']:<12.4f} {metrics['recall']:<12.4f} {metrics['f1_score']:<12.4f}")
        
        if hasattr(self, 'message_results') and self.message_results:
            print("\n📊 Message Detection Models:")
            print("-" * 80)
            print(f"{'Model':<20} {'Accuracy':<12} {'Precision':<12} {'Recall':<12} {'F1-Score':<12}")
            print("-" * 80)
            for name, metrics in self.message_results.items():
                print(f"{name:<20} {metrics['accuracy']:<12.4f} {metrics['precision']:<12.4f} {metrics['recall']:<12.4f} {metrics['f1_score']:<12.4f}")
        
        print("\n" + "="*60)


def main():
    print("🚀 Phishing Detection Model Training")
    print("="*60)
    print("\n📁 Make sure your Excel files are in the 'data/' folder")
    print("   - nepal_phishing_url_dataset.xlsx")
    print("   - nepal_spam_dataset.xlsx")
    print()
    
    # Initialize detector
    detector = PhishingDetector()
    
    # Load URL dataset
    url_excel_path = 'ml-service\nepal_phishing_url_dataset.xlsx'
    if os.path.exists(url_excel_path):
        detector.load_url_dataset_from_excel(url_excel_path)
    else:
        print(f"⚠️ URL dataset not found: {url_excel_path}")
        print("   Please place the file in the 'data/' folder")
    
    # Load message dataset
    message_excel_path = 'ml-service\nepal_spam_dataset.xlsx'
    if os.path.exists(message_excel_path):
        detector.load_message_dataset_from_excel(message_excel_path)
    else:
        print(f"⚠️ Message dataset not found: {message_excel_path}")
        print("   Please place the file in the 'data/' folder")
    
    # Train URL models
    if hasattr(detector, 'url_features_df'):
        detector.train_url_models()
    
    # Train message models
    if hasattr(detector, 'message_texts') and len(detector.message_texts) > 0:
        detector.message_results = detector.train_message_models()
    
    # Generate report
    detector.generate_report()
    
    # Save models
    detector.save_models()
    
    print("\n" + "="*60)
    print("🎉 Training Complete! You can now run the Flask server:")
    print("   python app.py")
    print("="*60)


if __name__ == "__main__":
    main()