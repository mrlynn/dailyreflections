#!/usr/bin/env python
"""
Extract text from the Twelve Steps and Twelve Traditions PDF
This script extracts text from the PDF and saves it to a text file
It also creates a JSON file with page-level information
"""

import os
import json
from pypdf import PdfReader
import re

# Input and output paths
PDF_PATH = "../../../public/pdf/AA-12-Steps-12-Traditions.pdf"
OUTPUT_TEXT_PATH = "12_12_text.txt"
OUTPUT_PAGES_JSON_PATH = "12_12_pages.json"

def extract_pdf_text():
    """
    Extract text from the PDF and save it to files
    """
    print("🔍 Extracting text from Twelve Steps and Twelve Traditions PDF...")

    # Ensure PDF file exists
    if not os.path.exists(PDF_PATH):
        print(f"❌ Error: PDF file not found at {PDF_PATH}")
        return False

    try:
        # Open the PDF file
        reader = PdfReader(PDF_PATH)
        num_pages = len(reader.pages)
        print(f"📚 PDF has {num_pages} pages")

        # Prepare containers for the results
        all_text = ""
        pages_data = []

        # Extract text from each page
        for i, page in enumerate(reader.pages):
            # Get text from the page
            page_text = page.extract_text()

            # Clean up the text
            page_text = page_text.strip()
            # Replace multiple spaces and newlines with single ones
            page_text = re.sub(r'\s+', ' ', page_text)
            # Fix common OCR issues
            page_text = re.sub(r'- ', '', page_text)

            # Add to full text
            all_text += page_text + "\n\n"

            # Add to pages data
            pages_data.append({
                "page_number": i + 1,
                "text": page_text,
                "source": "AA Twelve Steps and Twelve Traditions"
            })

            # Display progress
            if (i + 1) % 10 == 0 or i == 0 or i == num_pages - 1:
                print(f"✅ Processed page {i + 1}/{num_pages}")

        # Write the full text to a file
        with open(OUTPUT_TEXT_PATH, 'w', encoding='utf-8') as f:
            f.write(all_text)

        # Write the pages data to a JSON file
        with open(OUTPUT_PAGES_JSON_PATH, 'w', encoding='utf-8') as f:
            json.dump(pages_data, f, indent=2)

        print(f"✅ Extracted text saved to {OUTPUT_TEXT_PATH}")
        print(f"✅ Page data saved to {OUTPUT_PAGES_JSON_PATH}")

        # Print some statistics
        print(f"📊 Total text length: {len(all_text)} characters")

        return True

    except Exception as e:
        print(f"❌ Error extracting text from PDF: {str(e)}")
        return False

if __name__ == "__main__":
    extract_pdf_text()
