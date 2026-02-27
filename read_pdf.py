import sys
try:
    from pypdf import PdfReader
    reader = PdfReader("/Users/chunghan/AI/for_life_use/janet_sales_calendar_Gen2/requirement_interview/02-24 需求訪談：醫藥業務拜訪醫師門診資訊整合與週計畫（Weekly Report）系統-Summary.pdf")
    text = []
    for page in reader.pages:
        text.append(page.extract_text())
    print("\n".join(text))
except Exception as e:
    print(f"Error: {e}")
