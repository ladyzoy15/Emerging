import os
import uuid
from flask import Blueprint, request, jsonify, g, current_app, send_from_directory
from app import db
from app.models.models import Receipt, Expense
from app.utils.auth import token_required
from app.services import ocr_service
from datetime import datetime

receipts_bp = Blueprint('receipts', __name__, url_prefix='/api/receipts')

ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'pdf'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@receipts_bp.route('/upload', methods=['POST'])
@token_required
def upload_receipts():
    try:
        if 'files' not in request.files:
            return jsonify({'error': 'No files provided'}), 400

        files = request.files.getlist('files')
        if not files or all(f.filename == '' for f in files):
            return jsonify({'error': 'No files selected'}), 400

        upload_folder = current_app.config['UPLOAD_FOLDER']
        created_receipts = []

        for file in files:
            if file and file.filename and allowed_file(file.filename):
                original_filename = file.filename
                ext = original_filename.rsplit('.', 1)[1].lower()
                stored_filename = f"{uuid.uuid4().hex}.{ext}"
                file_path = os.path.join(upload_folder, stored_filename)

                file.save(file_path)

                receipt = Receipt(
                    user_id=g.current_user_id,
                    original_filename=original_filename,
                    stored_filename=stored_filename,
                    file_path=file_path,
                    processing_status='uploaded'
                )
                db.session.add(receipt)
                db.session.flush()  # Get the ID before commit
                created_receipts.append(receipt.to_dict())
            elif file and file.filename:
                return jsonify({'error': f'File type not allowed: {file.filename}. Allowed types: jpg, jpeg, png, pdf'}), 400

        db.session.commit()

        return jsonify({
            'message': f'{len(created_receipts)} receipt(s) uploaded successfully',
            'receipts': created_receipts
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500


@receipts_bp.route('/', methods=['GET'])
@token_required
def list_receipts():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)

        # Clamp per_page
        per_page = min(per_page, 100)

        query = Receipt.query.filter_by(user_id=g.current_user_id).order_by(Receipt.upload_date.desc())
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)

        return jsonify({
            'receipts': [r.to_dict() for r in pagination.items],
            'total': pagination.total,
            'page': pagination.page,
            'per_page': pagination.per_page,
            'pages': pagination.pages
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to list receipts: {str(e)}'}), 500


@receipts_bp.route('/<int:id>', methods=['GET'])
@token_required
def get_receipt(id):
    try:
        receipt = Receipt.query.filter_by(id=id, user_id=g.current_user_id).first()
        if not receipt:
            return jsonify({'error': 'Receipt not found'}), 404

        return jsonify({'receipt': receipt.to_dict()}), 200

    except Exception as e:
        return jsonify({'error': f'Failed to get receipt: {str(e)}'}), 500


@receipts_bp.route('/<int:id>', methods=['DELETE'])
@token_required
def delete_receipt(id):
    try:
        receipt = Receipt.query.filter_by(id=id, user_id=g.current_user_id).first()
        if not receipt:
            return jsonify({'error': 'Receipt not found'}), 404

        # Delete associated expenses
        Expense.query.filter_by(receipt_id=receipt.id, user_id=g.current_user_id).delete()

        # Delete the file from disk
        if receipt.file_path and os.path.exists(receipt.file_path):
            try:
                os.remove(receipt.file_path)
            except OSError:
                pass  # File may already be deleted

        db.session.delete(receipt)
        db.session.commit()

        return jsonify({'message': 'Receipt deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete receipt: {str(e)}'}), 500


@receipts_bp.route('/<int:id>/process', methods=['POST'])
@token_required
def process_receipt(id):
    try:
        receipt = Receipt.query.filter_by(id=id, user_id=g.current_user_id).first()
        if not receipt:
            return jsonify({'error': 'Receipt not found'}), 404

        # Update status to processing
        receipt.processing_status = 'processing'
        db.session.commit()

        try:
            # Run OCR processing
            extracted_data = ocr_service.process_receipt(receipt.file_path)

            # Parse date if available
            receipt_date = None
            if extracted_data.get('receipt_date'):
                try:
                    receipt_date = datetime.strptime(extracted_data['receipt_date'], '%Y-%m-%d').date()
                except (ValueError, TypeError):
                    receipt_date = None

            # Check if an expense already exists for this receipt
            expense = Expense.query.filter_by(receipt_id=receipt.id, user_id=g.current_user_id).first()

            if expense:
                # Update existing expense
                expense.merchant_name = extracted_data.get('merchant_name')
                expense.receipt_number = extracted_data.get('receipt_number')
                expense.receipt_date = receipt_date
                expense.category = extracted_data.get('category', 'Other')
                expense.total_amount = extracted_data.get('total_amount') or 0
                expense.vat_amount = extracted_data.get('vat_amount') or 0
                expense.vatable_sales = extracted_data.get('vatable_sales') or 0
                expense.vat_exempt_sales = extracted_data.get('vat_exempt_sales') or 0
                expense.non_vat_sales = extracted_data.get('non_vat_sales') or 0
                expense.verification_status = extracted_data.get('verification_status', 'unverified')
            else:
                # Create new expense
                expense = Expense(
                    user_id=g.current_user_id,
                    receipt_id=receipt.id,
                    merchant_name=extracted_data.get('merchant_name'),
                    receipt_number=extracted_data.get('receipt_number'),
                    receipt_date=receipt_date,
                    category=extracted_data.get('category', 'Other'),
                    total_amount=extracted_data.get('total_amount') or 0,
                    vat_amount=extracted_data.get('vat_amount') or 0,
                    vatable_sales=extracted_data.get('vatable_sales') or 0,
                    vat_exempt_sales=extracted_data.get('vat_exempt_sales') or 0,
                    non_vat_sales=extracted_data.get('non_vat_sales') or 0,
                    verification_status=extracted_data.get('verification_status', 'unverified')
                )
                db.session.add(expense)

            receipt.processing_status = 'completed'
            db.session.commit()

            return jsonify({
                'message': 'Receipt processed successfully',
                'receipt': receipt.to_dict(),
                'expense': expense.to_dict(),
                'expense_id': expense.id,
                'extracted_data': {
                    'merchant_name': extracted_data.get('merchant_name'),
                    'receipt_date': extracted_data.get('receipt_date'),
                    'receipt_number': extracted_data.get('receipt_number'),
                    'total_amount': extracted_data.get('total_amount'),
                    'vat_amount': extracted_data.get('vat_amount'),
                    'vatable_sales': extracted_data.get('vatable_sales'),
                    'vat_exempt_sales': extracted_data.get('vat_exempt_sales'),
                    'non_vat_sales': extracted_data.get('non_vat_sales'),
                    'category': extracted_data.get('category'),
                    'verification_status': extracted_data.get('verification_status')
                }
            }), 200

        except Exception as processing_error:
            receipt.processing_status = 'failed'
            db.session.commit()
            return jsonify({
                'error': f'OCR processing failed: {str(processing_error)}',
                'receipt': receipt.to_dict()
            }), 500

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to process receipt: {str(e)}'}), 500


@receipts_bp.route('/<int:id>/file', methods=['GET'])
@token_required
def get_receipt_file(id):
    try:
        receipt = Receipt.query.filter_by(id=id, user_id=g.current_user_id).first()
        if not receipt:
            return jsonify({'error': 'Receipt not found'}), 404

        upload_folder = current_app.config['UPLOAD_FOLDER']
        return send_from_directory(upload_folder, receipt.stored_filename)

    except Exception as e:
        return jsonify({'error': f'Failed to retrieve file: {str(e)}'}), 500
