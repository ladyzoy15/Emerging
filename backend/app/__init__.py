import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

load_dotenv()

db = SQLAlchemy()


def create_app():
    app = Flask(__name__)

    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'default-secret-key-change-in-production')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
        'DATABASE_URL',
        'sqlite:///receiptai.db'
    )
    app.config['UPLOAD_FOLDER'] = os.environ.get('UPLOAD_FOLDER', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'uploads'))
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10 MB

    # Ensure upload folder exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Initialize extensions
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    db.init_app(app)

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.receipts import receipts_bp
    from app.routes.expenses import expenses_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.reports import reports_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(receipts_bp)
    app.register_blueprint(expenses_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(reports_bp)

    # Health check route
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({'status': 'healthy', 'message': 'ReceiptAI API is running'}), 200

    # Create database tables and ensure demo user exists
    with app.app_context():
        from app.models.models import User, Category, Receipt, Expense  # noqa: F401
        try:
            db.create_all()

            # Ensure default categories
            default_categories = [
                'Food and Meals', 'Transportation', 'Office Supplies',
                'Utilities', 'Equipment', 'Professional Services', 'Other'
            ]
            for cat_name in default_categories:
                existing_cat = Category.query.filter_by(user_id=None, category_name=cat_name).first()
                if not existing_cat:
                    db.session.add(Category(user_id=None, category_name=cat_name))

            # Ensure demo user with valid bcrypt hash
            demo_user = User.query.filter_by(email='demo@receiptai.com').first()
            if not demo_user:
                demo_user = User(name='Demo User', email='demo@receiptai.com')
                demo_user.set_password('demo123')
                db.session.add(demo_user)
            else:
                demo_user.set_password('demo123')

            db.session.commit()
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Database init error: {e}")

    return app
