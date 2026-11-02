import os 
from typing import TypedDict
from PyPDF2 import PdfReader

class ExtractedDocument(TypedDict):
    text: str
    page_count: int
    word_count: int

def extract_text_from_pdf(file_path: str)->ExtractedDocument:
    reader=PdfReader(file_path)
    text=""
    for page in reader.pages:
        text+=(page.extract_text() or "") + "\n"
    text = text.strip()
    return {
        "text": text,
        "page_count": len(reader.pages),
        "word_count": len(text.split()),
    }
    
def extract_text_from_txt(file_path: str)->ExtractedDocument:
    with open(file_path,"r",encoding="utf-8") as f:
        text = f.read().strip()
    return {
        "text": text,
        "page_count": 1,
        "word_count": len(text.split()),
    }
    
def extract_text(file_path: str)->ExtractedDocument:
    ext=os.path.splitext(file_path)[1].lower()
    
    if ext==".pdf":
        return extract_text_from_pdf(file_path)
    elif ext==".txt":
        return extract_text_from_txt(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")
    
