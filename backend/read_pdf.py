import argparse
from pypdf import PdfReader

def extract_text(pdf_path):
    try:
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        return f"Error reading PDF: {str(e)}"

if __name__ == "__main__":
    import sys
    # Hardcoded path for this specific task
    path = r"c:\Users\Aravindh\OneDrive\Documents\Voice-Guided-Tour-InteractGen\InteractGen-Nextsteps.pdf"
    text = extract_text(path)
    with open("pdf_content.txt", "w", encoding="utf-8") as f:
        f.write(text)
    print("Done writing to pdf_content.txt")
