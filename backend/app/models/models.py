from app import db
from datetime import datetime, date
import bcrypt


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    receipts = db.relationship('Receipt', backref='user', lazy=True, cascade='all, delete-orphan')
    expenses = db.relationship('Expense', backref='user', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Category(db.Model):
    __tablename__ = 'categories'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=True)
    category_name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'category_name': self.category_name
        }


class Receipt(db.Model):
    __tablename__ = 'receipts'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    stored_filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)
    processing_status = db.Column(db.String(20), default='uploaded')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    expenses = db.relationship('Expense', backref='receipt', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'original_filename': self.original_filename,
            'stored_filename': self.stored_filename,
            'file_path': self.file_path,
            'upload_date': self.upload_date.isoformat() if self.upload_date else None,
            'processing_status': self.processing_status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Expense(db.Model):
    __tablename__ = 'expenses'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    receipt_id = db.Column(db.Integer, db.ForeignKey('receipts.id', ondelete='SET NULL'), nullable=True)
    merchant_name = db.Column(db.String(255))
    receipt_number = db.Column(db.String(100))
    receipt_date = db.Column(db.Date)
    category = db.Column(db.String(100))
    total_amount = db.Column(db.Numeric(12, 2), default=0.00)
    vat_amount = db.Column(db.Numeric(12, 2), default=0.00)
    vatable_sales = db.Column(db.Numeric(12, 2), default=0.00)
    vat_exempt_sales = db.Column(db.Numeric(12, 2), default=0.00)
    non_vat_sales = db.Column(db.Numeric(12, 2), default=0.00)
    verification_status = db.Column(db.String(20), default='unverified')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'receipt_id': self.receipt_id,
            'merchant_name': self.merchant_name,
            'receipt_number': self.receipt_number,
            'receipt_date': self.receipt_date.isoformat() if self.receipt_date else None,
            'category': self.category,
            'total_amount': float(self.total_amount) if self.total_amount else 0.0,
            'vat_amount': float(self.vat_amount) if self.vat_amount else 0.0,
            'vatable_sales': float(self.vatable_sales) if self.vatable_sales else 0.0,
            'vat_exempt_sales': float(self.vat_exempt_sales) if self.vat_exempt_sales else 0.0,
            'non_vat_sales': float(self.non_vat_sales) if self.non_vat_sales else 0.0,
            'verification_status': self.verification_status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
