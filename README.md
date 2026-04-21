# SafeSwipe: Enterprise-Grade Fraud Detection Platform

SafeSwipe is a production-ready fraud detection application that leverages advanced machine learning algorithms to identify and prevent fraudulent financial transactions in real-time. Built with scalability and reliability in mind, this full-stack solution combines robust backend APIs with an intuitive React-based frontend to deliver actionable insights for financial institutions.

## Key Features

- **Advanced ML Models**: Ensemble of Logistic Regression, Decision Tree, and Random Forest classifiers with SMOTE oversampling for imbalanced datasets
- **Real-time Fraud Detection**: RESTful API endpoints for instant transaction analysis and risk scoring
- **Secure Card Validation**: Luhn algorithm implementation with additional security checks
- **Interactive Dashboard**: Real-time monitoring of model performance metrics and system health
- **Data Pipeline**: Secure CSV upload with automated preprocessing and feature engineering
- **Admin Portal**: Role-based authentication with session management and audit logging
- **Scalable Architecture**: Modular Flask backend with SQLite database and joblib model persistence

## Technology Stack

### Backend Architecture
- **Flask 2.x**: Lightweight WSGI web framework for REST API development
- **Scikit-learn 1.3+**: Comprehensive machine learning library for model training and evaluation
- **SQLite**: Embedded database for transaction storage and admin session management
- **SMOTE**: Synthetic Minority Oversampling Technique for handling class imbalance
- **Joblib**: Efficient model serialization for production deployment
- **Werkzeug**: Security utilities for password hashing and session management

### Frontend Architecture
- **React 18**: Component-based UI framework with hooks for state management
- **Tailwind CSS 3.x**: Utility-first CSS framework for responsive design
- **Axios**: Promise-based HTTP client for API communication
- **React Router 6**: Declarative routing for single-page application navigation

##  Prerequisites

- Python 3.8 or higher
- Node.js 16.x or higher
- npm 8.x or higher
- Git for version control

##  Installation & Setup

### Backend Configuration

1. **Clone and navigate to backend directory:**
   ```bash
   git clone <repository-url>
   cd SafeSwipe/backend
2. Create isolated Python environment:
    python -m venv venv
    python -m venv venv
    # Windows
    venv\Scripts\activate
    # macOS/Linux
    source venv/bin/activate

3. Install Python dependencies:
   pip install -r requirements.txt

4. Initialize database and start Flask server:
   python app.py
   
Server will be available at http://localhost:5000
   
### Frontend Configuration
Navigate to frontend directory:
cd ../frontend

Install Node.js dependencies:
npm install

Start development server:
npm start

Application will be accessible at http://localhost:3000

### Usage Guide

Access Application: Navigate to http://localhost:3000 in your web browser
Data Ingestion: Use the Upload page to import transaction datasets in CSV format
Model Training: Access the Models page to train and evaluate ML algorithms
Fraud Analysis: Submit transactions via the Fraud Detection page for real-time analysis
Performance Monitoring: Review model metrics and system status on the Dashboard
Administration: Authenticate via Admin portal for system management and configuration

### API Reference

Endpoint	Method	Description	Request Body
/health	GET	System status and model training state	-
/upload	POST	CSV file upload for transaction data	multipart/form-data
/train	POST	Initiate ML model training pipeline	{"model_type": "rf"}
/predict	POST	Fraud prediction for transaction	{"features": [...], "model": "rf"}
/validate-card	POST	Credit card validation	{"card_number": "4111111111111111"}
/admin-login	POST	Admin authentication	{"username": "...", "password": "..."}
/admin-check	GET	Session validation	Authorization header

## Project Structure

```text
SafeSwipe/
├── backend/
│   ├── app.py                 # Main Flask application with API routes
│   ├── requirements.txt       # Python dependency manifest
│   ├── instance/              # Runtime data (database, models)
│   └── models/                # Sample datasets and evaluation metrics
├── frontend/
│   ├── public/
│   │   └── index.html         # HTML template
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Route-based page components
│   │   ├── App.js             # Root React component
│   │   ├── theme.js           # Configuration and constants
│   │   └── index.js           # Application entry point
│   ├── package.json           # Node.js dependency manifest
│   └── tailwind.config.js     # CSS framework configuration
├── .gitignore                 # Version control exclusions
└── README.md                  # Project documentation

### Model Performance

The system supports multiple classification algorithms with comprehensive evaluation metrics:

Accuracy: Overall prediction correctness
Precision: True positive rate among predicted positives
Recall: True positive rate among actual positives
F1-Score: Harmonic mean of precision and recall
Confusion Matrix: Detailed classification breakdown

### Contributing

We welcome contributions that enhance the platform's fraud detection capabilities and user experience.

### Fork the repository
Create a feature branch: git checkout -b feature/enhanced-model-accuracy
Implement changes with comprehensive test coverage
Commit with descriptive messages: git commit -m 'Add gradient boosting model support'
Push to branch: git push origin feature/enhanced-model-accuracy
Submit a pull request with detailed description

### License
This project is licensed under the MIT License


  
