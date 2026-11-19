from flask import Blueprint, request, jsonify, g, send_file
from sqlalchemy import func, or_
from app import db
from app.models.models import Expense, Category
from app.utils.auth import token_required
from app.services.export_service import export_expenses
from datetime import datetime

expenses_bp = Blueprint('expenses', __name__, url_prefix='/api/expenses')


@expenses_bp.route('/', methods=['GET'])
@token_required
def list_expenses():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        category = request.args.get('category', None)
        date_from = request.args.get('date_from', None)
        date_to = request.args.get('date_to', None)
        search = request.args.get('search', None)
        sort_by = request.args.get('sort_by', 'receipt_date')
        sort_order = request.args.get('sort_order', 'desc')

        per_page = min(per_page, 100)

        query = Expense.query.filter_by(user_id=g.current_user_id)

        # Apply filters
        if category:
            query = query.filter(Expense.category == category)

        if date_from:
            try:
                from_date = datetime.strptime(date_from, '%Y-%m-%d').date()
                query = query.filter(Expense.receipt_date >= from_date)
            except ValueError:
                pass

        if date_to:
            try:
                to_date = datetime.strptime(date_to, '%Y-%m-%d').date()
                query = query.filter(Expense.receipt_date <= to_date)
            except ValueError:
                pass

        if search:
            query = query.filter(Expense.merchant_name.ilike(f'%{search}%'))

        # Apply sorting
        valid_sort_columns = {
            'receipt_date': Expense.receipt_date,
            'total_amount': Expense.total_amount,
            'merchant_name': Expense.merchant_name,
            'category': Expense.category,
            'created_at': Expense.created_at,
        }
        sort_column = valid_sort_columns.get(sort_by, Expense.receipt_date)

        if sort_order == 'asc':
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())

        pagination = query.paginate(page=page, per_page=per_page, error_out=False)

        return jsonify({
            'expenses': [e.to_dict() for e in pagination.items],
            'total': pagination.total,
            'page': pagination.page,
            'per_page': pagination.per_page,
            'pages': pagination.pages
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to list expenses: {str(e)}'}), 500


@expenses_bp.route('/categories', methods=['GET'])
@token_required
def get_categories():
    try:
        # Get global categories (user_id IS NULL) and user-specific categories
        categories = Category.query.filter(
            or_(Category.user_id.is_(None), Category.user_id == g.current_user_id)
        ).all()

        # Also get distinct categories from the user's expenses
        expense_categories = db.session.query(Expense.category).filter(
            Expense.user_id == g.current_user_id,
            Expense.category.isnot(None)
        ).distinct().all()

        category_list = [c.to_dict() for c in categories]

        # Add expense categories that aren't in the categories table
        existing_names = {c['category_name'] for c in category_list}
        for (cat_name,) in expense_categories:
            if cat_name and cat_name not in existing_names:
                category_list.append({
                    'id': None,
                    'user_id': g.current_user_id,
                    'category_name': cat_name
                })
                existing_names.add(cat_name)

        return jsonify({'categories': category_list}), 200

    except Exception as e:
        return jsonify({'error': f'Failed to get categories: {str(e)}'}), 500


@expenses_bp.route('/export', methods=['GET'])
@token_required
def export_expenses_excel():
    try:
        # Optional query params for filtering
        date_from = request.args.get('date_from', None)
        date_to = request.args.get('date_to', None)
        category = request.args.get('category', None)

        query = Expense.query.filter_by(user_id=g.current_user_id)

        if date_from:
            try:
                from_date = datetime.strptime(date_from, '%Y-%m-%d').date()
                query = query.filter(Expense.receipt_date >= from_date)
            except ValueError:
                pass

        if date_to:
            try:
                to_date = datetime.strptime(date_to, '%Y-%m-%d').date()
                query = query.filter(Expense.receipt_date <= to_date)
            except ValueError:
                pass

        if category:
            query = query.filter(Expense.category == category)

        expenses = query.order_by(Expense.receipt_date.desc()).all()
        expense_dicts = [e.to_dict() for e in expenses]

        # Build summary data
        total_expenses = sum(e.get('total_amount', 0) for e in expense_dicts)
        total_vat = sum(e.get('vat_amount', 0) for e in expense_dicts)

        # Category breakdown
        category_totals = {}
        for e in expense_dicts:
            cat = e.get('category', 'Other') or 'Other'
            if cat not in category_totals:
                category_totals[cat] = {'category': cat, 'total': 0, 'count': 0}
            category_totals[cat]['total'] += e.get('total_amount', 0)
            category_totals[cat]['count'] += 1

        summary_data = {
            'total_expenses': total_expenses,
            'total_vat': total_vat,
            'total_transactions': len(expense_dicts),
            'category_breakdown': list(category_totals.values())
        }

        buffer = export_expenses(expense_dicts, summary_data)

        return send_file(
            buffer,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f'ReceiptAI_Expenses_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        )

    except Exception as e:
        return jsonify({'error': f'Failed to export expenses: {str(e)}'}), 500


@expenses_bp.route('/<int:id>', methods=['GET'])
@token_required
def get_expense(id):
    try:
        expense = Expense.query.filter_by(id=id, user_id=g.current_user_id).first()
        if not expense:
            return jsonify({'error': 'Expense not found'}), 404

        return jsonify({'expense': expense.to_dict()}), 200

    except Exception as e:
        return jsonify({'error': f'Failed to get expense: {str(e)}'}), 500


@expenses_bp.route('/<int:id>', methods=['PUT'])
@token_required
def update_expense(id):
    try:
        expense = Expense.query.filter_by(id=id, user_id=g.current_user_id).first()
        if not expense:
            return jsonify({'error': 'Expense not found'}), 404

        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body is required'}), 400

        # Update allowed fields
        if 'merchant_name' in data:
            expense.merchant_name = data['merchant_name']
        if 'receipt_number' in data:
            expense.receipt_number = data['receipt_number']
        if 'receipt_date' in data:
            if data['receipt_date']:
                try:
                    expense.receipt_date = datetime.strptime(data['receipt_date'], '%Y-%m-%d').date()
                except (ValueError, TypeError):
                    return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
            else:
                expense.receipt_date = None
        if 'category' in data:
            expense.category = data['category']
        if 'total_amount' in data:
            expense.total_amount = data['total_amount'] or 0
        if 'vat_amount' in data:
            expense.vat_amount = data['vat_amount'] or 0
        if 'vatable_sales' in data:
            expense.vatable_sales = data['vatable_sales'] or 0
        if 'vat_exempt_sales' in data:
            expense.vat_exempt_sales = data['vat_exempt_sales'] or 0
        if 'non_vat_sales' in data:
            expense.non_vat_sales = data['non_vat_sales'] or 0
        if 'verification_status' in data:
            expense.verification_status = data['verification_status']

        db.session.commit()

        return jsonify({
            'message': 'Expense updated successfully',
            'expense': expense.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update expense: {str(e)}'}), 500


@expenses_bp.route('/<int:id>', methods=['DELETE'])
@token_required
def delete_expense(id):
    try:
        expense = Expense.query.filter_by(id=id, user_id=g.current_user_id).first()
        if not expense:
            return jsonify({'error': 'Expense not found'}), 404

        db.session.delete(expense)
        db.session.commit()

        return jsonify({'message': 'Expense deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete expense: {str(e)}'}), 500
