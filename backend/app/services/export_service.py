import io
from datetime import datetime
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

NAVY_FILL = PatternFill(start_color='1B2A4A', end_color='1B2A4A', fill_type='solid')
WHITE_FONT = Font(name='Calibri', bold=True, color='FFFFFF', size=11)
HEADER_BORDER = Border(
    bottom=Side(style='thin', color='1B2A4A'),
    top=Side(style='thin', color='1B2A4A'),
    left=Side(style='thin', color='CCCCCC'),
    right=Side(style='thin', color='CCCCCC')
)
CELL_BORDER = Border(
    bottom=Side(style='thin', color='EEEEEE'),
    left=Side(style='thin', color='EEEEEE'),
    right=Side(style='thin', color='EEEEEE')
)


def style_header_row(ws, headers, row=1):
    for col_idx, header in enumerate(headers, 1):
        cell = ws.cell(row=row, column=col_idx, value=header)
        cell.font = WHITE_FONT
        cell.fill = NAVY_FILL
        cell.alignment = Alignment(horizontal='center', vertical='center')
        cell.border = HEADER_BORDER


def auto_adjust_width(ws):
    for col in ws.columns:
        max_length = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            if cell.value:
                max_length = max(max_length, len(str(cell.value)))
        ws.column_dimensions[col_letter].width = min(max_length + 4, 40)


def export_expenses(expenses, summary_data=None):
    wb = Workbook()

    # Sheet 1: Expense Records
    ws1 = wb.active
    ws1.title = 'Expense Records'
    headers = ['Merchant', 'Receipt Date', 'Receipt Number', 'Category', 'Total Amount',
               'VAT Amount', 'VATable Sales', 'VAT-Exempt Sales', 'Non-VAT Sales']
    style_header_row(ws1, headers)

    for row_idx, exp in enumerate(expenses, 2):
        data = [
            exp.get('merchant_name', ''),
            exp.get('receipt_date', ''),
            exp.get('receipt_number', ''),
            exp.get('category', ''),
            exp.get('total_amount', 0),
            exp.get('vat_amount', 0),
            exp.get('vatable_sales', 0),
            exp.get('vat_exempt_sales', 0),
            exp.get('non_vat_sales', 0),
        ]
        for col_idx, value in enumerate(data, 1):
            cell = ws1.cell(row=row_idx, column=col_idx, value=value)
            cell.border = CELL_BORDER
            if col_idx >= 5:  # Amount columns
                cell.number_format = '#,##0.00'
                cell.alignment = Alignment(horizontal='right')

    auto_adjust_width(ws1)

    # Sheet 2: Monthly Summary
    ws2 = wb.create_sheet('Monthly Summary')

    if summary_data:
        ws2.cell(row=1, column=1, value='Monthly Expense Summary').font = Font(bold=True, size=14, color='1B2A4A')
        ws2.cell(row=2, column=1, value=f'Generated: {datetime.now().strftime("%Y-%m-%d %H:%M")}')

        summary_headers = ['Metric', 'Value']
        style_header_row(ws2, summary_headers, row=4)

        metrics = [
            ('Total Expenses', summary_data.get('total_expenses', 0)),
            ('Total VAT', summary_data.get('total_vat', 0)),
            ('Total Transactions', summary_data.get('total_transactions', 0)),
        ]
        for row_idx, (metric, value) in enumerate(metrics, 5):
            ws2.cell(row=row_idx, column=1, value=metric).border = CELL_BORDER
            cell = ws2.cell(row=row_idx, column=2, value=value)
            cell.border = CELL_BORDER
            if isinstance(value, (int, float)):
                cell.number_format = '#,##0.00'

        # Category breakdown
        cat_row = len(metrics) + 7
        ws2.cell(row=cat_row - 1, column=1, value='Expense Breakdown by Category').font = Font(bold=True, size=12, color='1B2A4A')
        cat_headers = ['Category', 'Total Amount', 'Transaction Count']
        style_header_row(ws2, cat_headers, row=cat_row)

        categories = summary_data.get('category_breakdown', [])
        for idx, cat in enumerate(categories, cat_row + 1):
            ws2.cell(row=idx, column=1, value=cat.get('category', '')).border = CELL_BORDER
            cell = ws2.cell(row=idx, column=2, value=cat.get('total', 0))
            cell.border = CELL_BORDER
            cell.number_format = '#,##0.00'
            ws2.cell(row=idx, column=3, value=cat.get('count', 0)).border = CELL_BORDER

        auto_adjust_width(ws2)

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer


def export_tax_summary(tax_data):
    wb = Workbook()
    ws = wb.active
    ws.title = 'Tax Summary'

    ws.cell(row=1, column=1, value='ReceiptAI - Tax Summary Report').font = Font(bold=True, size=14, color='1B2A4A')
    ws.cell(row=2, column=1, value=f'Generated: {datetime.now().strftime("%Y-%m-%d %H:%M")}')

    headers = ['Description', 'Amount']
    style_header_row(ws, headers, row=4)

    rows = [
        ('Total Recorded Expenses', tax_data.get('total_expenses', 0)),
        ('Total VAT Recorded', tax_data.get('total_vat', 0)),
        ('VATable Sales', tax_data.get('vatable_sales', 0)),
        ('VAT-Exempt Sales', tax_data.get('vat_exempt_sales', 0)),
        ('Non-VAT Sales', tax_data.get('non_vat_sales', 0)),
        ('Number of Receipts', tax_data.get('receipt_count', 0)),
    ]

    for row_idx, (desc, val) in enumerate(rows, 5):
        ws.cell(row=row_idx, column=1, value=desc).border = CELL_BORDER
        cell = ws.cell(row=row_idx, column=2, value=val)
        cell.border = CELL_BORDER
        if isinstance(val, (int, float)) and desc != 'Number of Receipts':
            cell.number_format = '#,##0.00'

    auto_adjust_width(ws)

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer
