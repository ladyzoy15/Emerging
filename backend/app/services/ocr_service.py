import re
import os
from datetime import datetime
from PIL import Image
import pytesseract


def process_receipt(file_path):
    """Process a receipt image/PDF and extract information."""
    try:
        text = extract_text(file_path)
        if not text or len(text.strip()) < 5:
            return {
                'merchant_name': None,
                'receipt_date': None,
                'receipt_number': None,
                'total_amount': None,
                'vat_amount': None,
                'vatable_sales': None,
                'vat_exempt_sales': None,
                'non_vat_sales': None,
                'category': 'Other',
                'verification_status': 'needs_review',
                'raw_text': text or ''
            }

        result = {
            'merchant_name': extract_merchant(text),
            'receipt_date': extract_date(text),
            'receipt_number': extract_receipt_number(text),
            'total_amount': extract_total(text),
            'vat_amount': extract_vat(text),
            'vatable_sales': extract_vatable_sales(text),
            'vat_exempt_sales': extract_vat_exempt(text),
            'non_vat_sales': extract_non_vat(text),
            'raw_text': text
        }

        result['category'] = categorize_expense(result['merchant_name'], text)

        # Determine verification status
        key_fields = [result['merchant_name'], result['total_amount']]
        if any(f is None for f in key_fields):
            result['verification_status'] = 'needs_review'
        else:
            result['verification_status'] = 'unverified'

        return result
    except Exception as e:
        return {
            'merchant_name': None, 'receipt_date': None, 'receipt_number': None,
            'total_amount': None, 'vat_amount': None, 'vatable_sales': None,
            'vat_exempt_sales': None, 'non_vat_sales': None,
            'category': 'Other', 'verification_status': 'needs_review',
            'raw_text': '', 'error': str(e)
        }


def extract_text(file_path):
    """Extract text from image or PDF."""
    ext = os.path.splitext(file_path)[1].lower()
    if ext == '.pdf':
        try:
            from pdf2image import convert_from_path
            images = convert_from_path(file_path, first_page=1, last_page=3)
            text = ''
            for img in images:
                text += pytesseract.image_to_string(img) + '\n'
            return text
        except Exception:
            try:
                img = Image.open(file_path)
                return pytesseract.image_to_string(img)
            except Exception:
                return ''
    else:
        img = Image.open(file_path)
        return pytesseract.image_to_string(img)


def extract_merchant(text):
    """Extract merchant name - typically the first meaningful line."""
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    skip_words = ['receipt', 'invoice', 'official', 'sales', 'tax', 'date', 'time',
                  'cashier', 'tel', 'phone', 'fax', 'address', 'tin']
    for line in lines[:5]:
        if len(line) > 2 and not any(w in line.lower() for w in skip_words):
            if not re.match(r'^[\d\s\-\/\.\,\:\$\₱]+$', line):
                return line[:100]
    return None


def extract_date(text):
    """Extract date from receipt text."""
    patterns = [
        r'(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})',
        r'(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})',
        r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})',
        r'(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4})',
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            date_str = match.group(1)
            for fmt in ['%m/%d/%Y', '%d/%m/%Y', '%Y-%m-%d', '%m-%d-%Y', '%d-%m-%Y',
                         '%m/%d/%y', '%d/%m/%y', '%B %d, %Y', '%b %d, %Y', '%d %B %Y', '%d %b %Y',
                         '%B %d %Y', '%b %d %Y']:
                try:
                    return datetime.strptime(date_str.replace(',', '').strip(), fmt).strftime('%Y-%m-%d')
                except ValueError:
                    continue
            return date_str
    return None


def extract_receipt_number(text):
    """Extract receipt/invoice number."""
    patterns = [
        r'(?:receipt|invoice|or|transaction|ref|reference|no|number|#)\s*[:#]?\s*([A-Z0-9\-]{3,20})',
        r'(?:OR|SI|DR|CR)\s*(?:No\.?|#)\s*[:.]?\s*([A-Z0-9\-]{3,20})',
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return None


def extract_amount(text, keywords):
    """Extract a monetary amount near given keywords."""
    for keyword in keywords:
        patterns = [
            rf'{keyword}\s*[:\s]*[\₱\$]?\s*([\d,]+\.?\d*)',
            rf'[\₱\$]\s*([\d,]+\.?\d*)\s*{keyword}',
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    return float(match.group(1).replace(',', ''))
                except ValueError:
                    continue
    return None


def extract_total(text):
    """Extract total amount."""
    keywords = ['total amount', 'total due', 'grand total', 'amount due', 'total', 'balance due', 'amount tendered']
    amount = extract_amount(text, keywords)
    if amount is not None:
        return amount
    # Fallback: find the largest amount
    amounts = re.findall(r'[\₱\$]?\s*([\d,]+\.\d{2})', text)
    if amounts:
        try:
            values = [float(a.replace(',', '')) for a in amounts]
            return max(values)
        except Exception:
            pass
    return None


def extract_vat(text):
    keywords = ['vat amount', 'vat 12%', 'value added tax', 'vat', 'tax amount']
    return extract_amount(text, keywords)


def extract_vatable_sales(text):
    keywords = ['vatable sales', 'vatable sale', 'vat-able sales', 'vatable']
    return extract_amount(text, keywords)


def extract_vat_exempt(text):
    keywords = ['vat exempt sales', 'vat-exempt sales', 'vat exempt', 'exempt sales']
    return extract_amount(text, keywords)


def extract_non_vat(text):
    keywords = ['non-vat', 'non vat', 'zero rated', 'zero-rated']
    return extract_amount(text, keywords)


def categorize_expense(merchant, text):
    """Categorize expense based on merchant name and receipt text."""
    combined = ((merchant or '') + ' ' + (text or '')).lower()

    food_keywords = ['restaurant', 'food', 'cafe', 'coffee', 'pizza', 'burger', 'meal', 'dining',
                     'jollibee', 'mcdo', 'mcdonald', 'starbucks', 'kfc', 'chowking', 'grocery',
                     'supermarket', 'bakery', 'catering', 'kitchen', 'grill', 'bar', 'eatery']
    transport_keywords = ['gas', 'fuel', 'petrol', 'grab', 'uber', 'taxi', 'parking', 'toll',
                          'airline', 'travel', 'bus', 'train', 'fare', 'shell', 'petron', 'caltex']
    office_keywords = ['office', 'paper', 'ink', 'printer', 'stapler', 'pen', 'notebook',
                       'national bookstore', 'supplies', 'stationery']
    utility_keywords = ['electric', 'water', 'internet', 'phone', 'meralco', 'pldt', 'globe',
                        'smart', 'wifi', 'cable', 'utility', 'bill']
    equipment_keywords = ['computer', 'laptop', 'monitor', 'keyboard', 'mouse', 'hardware',
                          'machine', 'equipment', 'tool', 'device']
    professional_keywords = ['legal', 'accounting', 'consulting', 'lawyer', 'attorney',
                             'professional', 'service', 'audit', 'advisory']

    if any(k in combined for k in food_keywords):
        return 'Food and Meals'
    elif any(k in combined for k in transport_keywords):
        return 'Transportation'
    elif any(k in combined for k in office_keywords):
        return 'Office Supplies'
    elif any(k in combined for k in utility_keywords):
        return 'Utilities'
    elif any(k in combined for k in equipment_keywords):
        return 'Equipment'
    elif any(k in combined for k in professional_keywords):
        return 'Professional Services'
    return 'Other'
