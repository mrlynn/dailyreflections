#!/usr/bin/env python3
"""
Layout-aware Big Book ingestion script.

Generates per-page PNGs and structured JSON payloads containing:
  - fullText (merged paragraphs)
  - spans with bounding boxes for each text fragment (for overlays/search)

Usage:
  python scripts/bigbook/ingest_layout.py \
      --pdf-dir public/pdf \
      --output-json scripts/bigbook/output/bigbook_pages.json \
      --images-dir public/bigbook/4th

Requires PyMuPDF (fitz). Install with:
  pip install pymupdf
"""

import argparse
import json
import math
import os
from pathlib import Path
from typing import Dict, List, Tuple

import fitz  # PyMuPDF

SEGMENTS = [
    "en_bigbook_chapt1.pdf",
    "en_bigbook_chapt2.pdf",
    "en_bigbook_chapt3.pdf",
    "en_bigbook_chapt4.pdf",
    "en_bigbook_chapt5.pdf",
    "en_bigbook_chapt6.pdf",
    "en_bigbook_chapt7.pdf",
    "en_bigbook_chapt8.pdf",
    "en_bigbook_chapt9.pdf",
    "en_bigbook_chapt10.pdf",
    "en_bigbook_chapt11.pdf",
    "en_bigbook_personalstories_partI.pdf",
    "en_bigbook_personalstories_partII.pdf",
    "en_bigbook_personalstories_partIII.pdf",
    "en_bigbook_appendicei.pdf",
    "en_bigbook_appendiceii.pdf",
    "en_bigbook_appendiceiii.pdf",
    "en_bigbook_appendiceiv.pdf",
    "en_bigbook_appendicev.pdf",
    "en_bigbook_appendicevi.pdf",
    "en_bigbook_appendicevii_.pdf",
]

ROMAN_MAP = {
    "M": 1000,
    "CM": 900,
    "D": 500,
    "CD": 400,
    "C": 100,
    "XC": 90,
    "L": 50,
    "XL": 40,
    "X": 10,
    "IX": 9,
    "V": 5,
    "IV": 4,
    "I": 1,
}


def parse_args():
    parser = argparse.ArgumentParser(description="Layout-aware Big Book ingestion.")
    parser.add_argument(
        "--pdf-dir",
        type=Path,
        default=Path("public/pdf"),
        help="Directory containing Big Book PDF segments.",
    )
    parser.add_argument(
        "--images-dir",
        type=Path,
        default=Path("public/bigbook/4th"),
        help="Directory to output rendered PNG pages.",
    )
    parser.add_argument(
        "--output-json",
        type=Path,
        default=Path("scripts/bigbook/output/bigbook_pages.json"),
        help="File path for generated JSON payload.",
    )
    parser.add_argument(
        "--dpi",
        type=int,
        default=220,
        help="DPI for rasterized PNG output.",
    )
    return parser.parse_args()


def ensure_directory(path: Path):
    path.mkdir(parents=True, exist_ok=True)


def roman_to_int(value: str) -> int:
    result = 0
    i = 0
    upper = value.upper()
    while i < len(upper):
        if i + 1 < len(upper) and upper[i : i + 2] in ROMAN_MAP:
            result += ROMAN_MAP[upper[i : i + 2]]
            i += 2
        elif upper[i] in ROMAN_MAP:
            result += ROMAN_MAP[upper[i]]
            i += 1
        else:
            return -1
    return result


def normalize_space(text: str) -> str:
    return " ".join(text.split())


def append_line_to_paragraph(paragraph_lines: List[str], new_line: str):
    stripped = new_line.strip()
    if not stripped:
        return
    if not paragraph_lines:
        paragraph_lines.append(stripped)
        return

    last = paragraph_lines[-1]
    if last.endswith("-") and not last.endswith("--"):
        paragraph_lines[-1] = last[:-1] + stripped.lstrip()
    else:
        paragraph_lines.append(stripped)


def join_paragraph(paragraph_lines: List[str]) -> str:
    if not paragraph_lines:
        return ""
    text = paragraph_lines[0]
    for line in paragraph_lines[1:]:
        if not text:
            text = line
        elif text.endswith(("-", "—")):
            text = text.rstrip("-—") + line.lstrip()
        else:
            text += " " + line
    return normalize_space(text)


def build_full_text(lines: List[Dict]) -> str:
    if not lines:
        return ""

    # sort by y, then x
    sorted_lines = sorted(lines, key=lambda item: (round(item["y"], 2), item["x"]))

    paragraphs: List[str] = []
    current_lines: List[str] = []
    last_y_bottom = None
    avg_height = (
        sum(line["height"] for line in sorted_lines) / max(len(sorted_lines), 1)
    )

    for line in sorted_lines:
        text = line["text"].strip()
        if not text:
            continue

        is_new_paragraph = False
        if last_y_bottom is None:
            is_new_paragraph = True
        else:
            gap = line["y"] - last_y_bottom
            if gap > avg_height * 1.2:
                is_new_paragraph = True

        if is_new_paragraph:
            if current_lines:
                paragraphs.append(join_paragraph(current_lines))
            current_lines = []

        append_line_to_paragraph(current_lines, text)
        last_y_bottom = line["y1"]

    if current_lines:
        paragraphs.append(join_paragraph(current_lines))

    return "\n\n".join(paragraph for paragraph in paragraphs if paragraph)


def extract_page_data(
    page: fitz.Page,
    printed_page: int,
    png_name: str,
    source_file: str,
) -> Dict:
    """Extract spans, lines, and build full text for a page."""
    page_width = page.rect.width
    page_height = page.rect.height

    text_dict = page.get_text("dict")
    spans: List[Dict] = []
    lines: List[Dict] = []

    for block in text_dict.get("blocks", []):
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            line_spans = []
            x0 = None
            y0 = None
            x1 = None
            y1 = None
            for span in line.get("spans", []):
                span_text = span.get("text", "")
                if not span_text.strip():
                    continue

                bbox = span.get("bbox", [0, 0, 0, 0])
                span_data = {
                    "text": span_text,
                    "x": float(bbox[0]),
                    "y": float(bbox[1]),
                    "w": float(bbox[2] - bbox[0]),
                    "h": float(bbox[3] - bbox[1]),
                }
                spans.append(span_data)
                line_spans.append(span_text)

                x0 = span_data["x"] if x0 is None else min(x0, span_data["x"])
                y0 = span_data["y"] if y0 is None else min(y0, span_data["y"])
                x1 = (
                    (span_data["x"] + span_data["w"])
                    if x1 is None
                    else max(x1, span_data["x"] + span_data["w"])
                )
                y1 = (
                    (span_data["y"] + span_data["h"])
                    if y1 is None
                    else max(y1, span_data["y"] + span_data["h"])
                )

            if line_spans:
                line_text = "".join(line_spans)
                lines.append(
                    {
                        "text": line_text,
                        "x": float(x0),
                        "y": float(y0),
                        "x1": float(x1),
                        "y1": float(y1),
                        "height": float(y1 - y0),
                    }
                )

    full_text = build_full_text(lines)

    return {
        "editionId": "aa-bigbook-4th",
        "pageNumber": printed_page,
        "sourceFile": source_file,
        "image": png_name,
        "width": page_width,
        "height": page_height,
        "fullText": full_text,
        "spans": spans,
        "lines": lines,
    }


def render_page_to_png(page: fitz.Page, output_path: Path, dpi: int):
    zoom = dpi / 72.0
    matrix = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=matrix, alpha=False)
    pix.save(output_path.as_posix())


def ingest_segments(
    pdf_dir: Path,
    images_dir: Path,
    output_json: Path,
    dpi: int,
):
    ensure_directory(images_dir)
    ensure_directory(output_json.parent)

    pages_output: List[Dict] = []
    printed_page = 1

    for segment in SEGMENTS:
        pdf_path = pdf_dir / segment
        if not pdf_path.exists():
            print(f"[WARN] PDF segment missing: {pdf_path}")
            continue

        print(f"[INFO] Processing {pdf_path} starting at printed page {printed_page}")
        doc = fitz.open(pdf_path)

        for index, page in enumerate(doc):
            png_name = f"{printed_page:03}.png"
            png_path = images_dir / png_name
            render_page_to_png(page, png_path, dpi=dpi)

            page_payload = extract_page_data(
                page=page,
                printed_page=printed_page,
                png_name=png_name,
                source_file=segment,
            )
            pages_output.append(page_payload)

            printed_page += 1

    payload = {
        "editionId": "aa-bigbook-4th",
        "pageCount": len(pages_output),
        "generatedAt": os.getenv("INGEST_GENERATED_AT"),
        "pages": pages_output,
    }

    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    print(f"[DONE] Wrote {len(pages_output)} pages to {output_json}")


def main():
    args = parse_args()
    ingest_segments(
        pdf_dir=args.pdf_dir,
        images_dir=args.images_dir,
        output_json=args.output_json,
        dpi=args.dpi,
    )


if __name__ == "__main__":
    main()


