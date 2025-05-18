import pdfplumber

def convert_dars_pdf_to_text(pdf_path, output_txt_path):
    """
    Converts a DARS PDF file to a plain text file.
    """
    text_output = []

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_output.append(page_text)

    # Save extracted text to file
    with open(output_txt_path, "w", encoding="utf-8") as file:
        file.write("\n".join(text_output))

    print(f"✅ Successfully converted {pdf_path} to {output_txt_path}")

# Example usage
pdf_path = "C://Users//anura//OneDrive//Desktop//Projects//ajanaswamy-DARSAUDIT-327189157-8903aa32-4747-439f-ab86-2d45b1095683.pdf"  # Update with actual DARS PDF file path
output_txt_path = "dars_report_final_check.txt"
convert_dars_pdf_to_text(pdf_path, output_txt_path)
