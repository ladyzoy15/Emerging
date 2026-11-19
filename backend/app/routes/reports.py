from flask import Blueprint, request, jsonify, g, send_file
from sqlalchemy import func
from app import db
from app.models.models import Expense, Receipt
from app.utils.auth import token_required
from app.services.export_service import export_tax_summary
from datetime import datetime

reports_bp = Blueprint('reports', __name__, url_prefix='/api/reports')


@reports_bp.route('/tax-summary', methods=['GET'])
@token_required
def get_tax_summary():
    try:
        user_id = g.current_user_id

        # Optional date filters
        date_from = request.args.get('date_from', None)
        date_to = request.args.get('date_to', None)

        expense_query = Expense.query.filter_by(user_id=user_id)
        receipt_query = Receipt.query.filter_by(user_id=user_id)

        if date_from:
            try:
                from_date = datetime.strptime(date_from, '%Y-%m-%d').date()
                expense_query = expense_query.filter(Expense.receipt_date >= from_date)
            except ValueError:
                pass

        if date_to:
            try:
                to_date = datetime.strptime(date_to, '%Y-%m-%d').date()
                expense_query = expense_query.filter(Expense.receipt_date <= to_date)
            except ValueError:
                pass

        # Aggregate tax data
        tax_data = db.session.query(
            func.coalesce(func.sum(Expense.total_amount), 0).label('total_expenses'),
            func.coalesce(func.sum(Expense.vat_amount), 0).label('total_vat'),
            func.coalesce(func.sum(Expense.vatable_sales), 0).label('vatable_sales'),
            func.coalesce(func.sum(Expense.vat_exempt_sales), 0).label('vat_exempt_sales'),
            func.coalesce(func.sum(Expense.non_vat_sales), 0).label('non_vat_sales'),
        ).filter(
            Expense.user_id == user_id
        )

        # Apply date filters to aggregation query too
        if date_from:
            try:
                from_date = datetime.strptime(date_from, '%Y-%m-%d').date()
                tax_data = tax_data.filter(Expense.receipt_date >= from_date)
            except ValueError:
                pass

        if date_to:
            try:
                to_date = datetime.strptime(date_to, '%Y-%m-%d').date()
                tax_data = tax_data.filter(Expense.receipt_date <= to_date)
            except ValueError:
                pass

        result = tax_data.first()

        receipt_count = receipt_query.count()

        return jsonify({
            'total_expenses': float(result.total_expenses) if result.total_expenses else 0.0,
            'total_vat': float(result.total_vat) if result.total_vat else 0.0,
            'vatable_sales': float(result.vatable_sales) if result.vatable_sales else 0.0,
            'vat_exempt_sales': float(result.vat_exempt_sales) if result.vat_exempt_sales else 0.0,
            'non_vat_sales': float(result.non_vat_sales) if result.non_vat_sales else 0.0,
            'receipt_count': receipt_count
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to generate tax summary: {str(e)}'}), 500


@reports_bp.route('/tax-summary/export', methods=['GET'])
@token_required
def export_tax_summary_excel():
    try:
        user_id = g.current_user_id

        # Optional date filters
        date_from = request.args.get('date_from', None)
        date_to = request.args.get('date_to', None)

        tax_query = db.session.query(
            func.coalesce(func.sum(Expense.total_amount), 0).label('total_expenses'),
            func.coalesce(func.sum(Expense.vat_amount), 0).label('total_vat'),
            func.coalesce(func.sum(Expense.vatable_sales), 0).label('vatable_sales'),
            func.coalesce(func.sum(Expense.vat_exempt_sales), 0).label('vat_exempt_sales'),
            func.coalesce(func.sum(Expense.non_vat_sales), 0).label('non_vat_sales'),
        ).filter(
            Expense.user_id == user_id
        )

        if date_from:
            try:
                from_date = datetime.strptime(date_from, '%Y-%m-%d').date()
                tax_query = tax_query.filter(Expense.receipt_date >= from_date)
            except ValueError:
                pass

        if date_to:
            try:
                to_date = datetime.strptime(date_to, '%Y-%m-%d').date()
                tax_query = tax_query.filter(Expense.receipt_date <= to_date)
            except ValueError:
                pass

        result = tax_query.first()

        receipt_count = Receipt.query.filter_by(user_id=user_id).count()

        tax_data = {
            'total_expenses': float(result.total_expenses) if result.total_expenses else 0.0,
            'total_vat': float(result.total_vat) if result.total_vat else 0.0,
            'vatable_sales': float(result.vatable_sales) if result.vatable_sales else 0.0,
            'vat_exempt_sales': float(result.vat_exempt_sales) if result.vat_exempt_sales else 0.0,
            'non_vat_sales': float(result.non_vat_sales) if result.non_vat_sales else 0.0,
            'receipt_count': receipt_count
        }

        buffer = export_tax_summary(tax_data)

        return send_file(
            buffer,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f'ReceiptAI_TaxSummary_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        )

    except Exception as e:
        return jsonify({'error': f'Failed to export tax summary: {str(e)}'}), 500
