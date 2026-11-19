from flask import Blueprint, jsonify, g
from sqlalchemy import func, extract
from app import db
from app.models.models import Expense, Receipt
from app.utils.auth import token_required
from datetime import datetime, date
import calendar

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')


@dashboard_bp.route('/summary', methods=['GET'])
@token_required
def get_dashboard_summary():
    try:
        user_id = g.current_user_id
        today = date.today()
        current_year = today.year
        current_month = today.month

        # Total monthly expenses (current month)
        monthly_total = db.session.query(
            func.coalesce(func.sum(Expense.total_amount), 0)
        ).filter(
            Expense.user_id == user_id,
            extract('year', Expense.receipt_date) == current_year,
            extract('month', Expense.receipt_date) == current_month
        ).scalar()

        # Total receipts count
        total_receipts = Receipt.query.filter_by(user_id=user_id).count()

        # Total transactions (expenses) count
        total_transactions = Expense.query.filter_by(user_id=user_id).count()

        # Pending review count
        pending_review = Expense.query.filter_by(
            user_id=user_id,
            verification_status='needs_review'
        ).count()

        # Monthly expenses for last 6 months
        monthly_expenses = []
        for i in range(5, -1, -1):
            # Calculate month offset
            m = current_month - i
            y = current_year
            while m <= 0:
                m += 12
                y -= 1

            month_total = db.session.query(
                func.coalesce(func.sum(Expense.total_amount), 0)
            ).filter(
                Expense.user_id == user_id,
                extract('year', Expense.receipt_date) == y,
                extract('month', Expense.receipt_date) == m
            ).scalar()

            month_name = calendar.month_abbr[m]
            monthly_expenses.append({
                'month': f'{month_name} {y}',
                'total': float(month_total) if month_total else 0.0
            })

        # Recent transactions (last 5)
        recent_transactions = Expense.query.filter_by(
            user_id=user_id
        ).order_by(
            Expense.created_at.desc()
        ).limit(5).all()

        # Category breakdown
        category_data = db.session.query(
            Expense.category,
            func.sum(Expense.total_amount).label('total'),
            func.count(Expense.id).label('count')
        ).filter(
            Expense.user_id == user_id
        ).group_by(
            Expense.category
        ).all()

        category_breakdown = []
        for cat_name, total, count in category_data:
            category_breakdown.append({
                'category': cat_name or 'Other',
                'total': float(total) if total else 0.0,
                'count': count
            })

        return jsonify({
            'total_monthly_expenses': float(monthly_total) if monthly_total else 0.0,
            'total_receipts': total_receipts,
            'total_transactions': total_transactions,
            'pending_review': pending_review,
            'monthly_expenses': monthly_expenses,
            'recent_transactions': [t.to_dict() for t in recent_transactions],
            'category_breakdown': category_breakdown
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to load dashboard: {str(e)}'}), 500
