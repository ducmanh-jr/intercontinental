"""
Tạo nền (background template) cho slide PowerPoint
dựa trên mẫu slide của Trường Đại Học Xây Dựng Hà Nội.

Chỉ tạo nền (header bar, tam giác, footer logo + text + đường kẻ),
KHÔNG bao gồm nội dung chính của slide.

Yêu cầu:
    pip install python-pptx

Cách dùng:
    py -3 create_slide_background.py
"""

import os
from pptx import Presentation
from pptx.util import Emu, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.oxml.ns import qn
from lxml import etree


# ── Cấu hình chung ──────────────────────────────────────────────────────────
SLIDE_WIDTH  = 12191365          # EMU  (≈ 33.87 cm, tỉ lệ 16:9)
SLIDE_HEIGHT = 6858000           # EMU  (≈ 19.05 cm)

LOGO_PATH = os.path.join("slide", "Logo ĐH Xây Dựng Hà Nội - NUCE.png")
OUTPUT_PATH = os.path.join("slide", "slide_background.pptx")

NUM_SLIDES = 1                  # Số slide cần tạo

# Màu chủ đạo
COLOR_HEADER     = RGBColor(0x88, 0x0C, 0x10)   # Đỏ đậm  #880C10
COLOR_TRIANGLE   = RGBColor(0x69, 0x05, 0x08)   # Đỏ tối  #690508
COLOR_BLACK      = RGBColor(0x00, 0x00, 0x00)
COLOR_WHITE      = RGBColor(0xFF, 0xFF, 0xFF)

# Font
FONT_NAME = "Segoe UI"


# ── Hàm tiện ích ────────────────────────────────────────────────────────────

def _remove_line(shape):
    """Bỏ viền (outline) của shape bằng cách thêm <a:noFill/> vào <a:ln>."""
    spPr = shape._element.spPr
    ln = spPr.find(qn("a:ln"))
    if ln is None:
        ln = etree.SubElement(spPr, qn("a:ln"))
    # Xóa nội dung cũ trong <a:ln> nếu có
    for child in list(ln):
        ln.remove(child)
    etree.SubElement(ln, qn("a:noFill"))


def _set_textbox_margins(shape, left=0, top=0, right=0, bottom=0):
    """Đặt inset (lề trong) của textbox về 0."""
    txBody = shape._element.txBody
    bodyPr = txBody.find(qn("a:bodyPr"))
    if bodyPr is None:
        bodyPr = etree.SubElement(txBody, qn("a:bodyPr"))
    bodyPr.set("lIns", str(left))
    bodyPr.set("tIns", str(top))
    bodyPr.set("rIns", str(right))
    bodyPr.set("bIns", str(bottom))
    bodyPr.set("wrap", "square")
    # auto fit
    spAutoFit = bodyPr.find(qn("a:spAutoFit"))
    if spAutoFit is None:
        etree.SubElement(bodyPr, qn("a:spAutoFit"))


def _add_run_with_font(paragraph, text, font_name=FONT_NAME, size_pt=None,
                       bold=None, color=None):
    """Thêm một run text với định dạng font cụ thể vào paragraph."""
    run = paragraph.add_run()
    run.text = text
    if font_name:
        run.font.name = font_name
    if size_pt is not None:
        run.font.size = Pt(size_pt)
    if bold is not None:
        run.font.bold = bold
    if color is not None:
        run.font.color.rgb = color
    return run


def _set_paragraph_default_rpr(paragraph, size_hundredths, bold=False,
                                color_rgb="000000", font_name=FONT_NAME):
    """Thiết lập defRPr (default run properties) cho paragraph thông qua XML
    để đảm bảo đúng cách slide gốc định dạng."""
    pPr = paragraph._p.find(qn("a:pPr"))
    if pPr is None:
        pPr = etree.SubElement(paragraph._p, qn("a:pPr"))
        # Đặt ở đầu
        paragraph._p.insert(0, pPr)

    defRPr = pPr.find(qn("a:defRPr"))
    if defRPr is None:
        defRPr = etree.SubElement(pPr, qn("a:defRPr"))

    defRPr.set("sz", str(size_hundredths))
    if bold:
        defRPr.set("b", "1")

    # solidFill
    fill = defRPr.find(qn("a:solidFill"))
    if fill is None:
        fill = etree.SubElement(defRPr, qn("a:solidFill"))
    for ch in list(fill):
        fill.remove(ch)
    srgb = etree.SubElement(fill, qn("a:srgbClr"))
    srgb.set("val", color_rgb)

    # latin typeface
    latin = defRPr.find(qn("a:latin"))
    if latin is None:
        latin = etree.SubElement(defRPr, qn("a:latin"))
    latin.set("typeface", font_name)
    latin.set("panose", "020B0502040204020203")


# ── Hàm tạo nền cho 1 slide ─────────────────────────────────────────────────

def add_background_to_slide(slide, slide_number, total_slides):
    """
    Thêm các thành phần nền vào slide:
      1. Header bar (rectangle đỏ)
      2. Tam giác góc phải (right triangle)
      3. Logo trường (picture)
      4. Tên trường (textbox)
      5. Đường kẻ ngang (rectangle đen mỏng)
      6. URL (textbox)
      7. Số slide (textbox)
    """

    # ── 1. Header bar ─────────────────────────────────────────────────────
    header_rect = slide.shapes.add_shape(
        1,  # MSO_SHAPE.RECTANGLE
        left=Emu(0),
        top=Emu(0),
        width=Emu(12191695),
        height=Emu(1051560),
    )
    header_rect.fill.solid()
    header_rect.fill.fore_color.rgb = COLOR_HEADER
    _remove_line(header_rect)
    header_rect.name = "Rectangle 1"

    # ── 2. Tam giác góc phải (xoay 180°) ─────────────────────────────────
    triangle = slide.shapes.add_shape(
        8,  # MSO_SHAPE.RIGHT_TRIANGLE
        left=Emu(10972800),
        top=Emu(0),
        width=Emu(1218895),
        height=Emu(822960),
    )
    triangle.fill.solid()
    triangle.fill.fore_color.rgb = COLOR_TRIANGLE
    _remove_line(triangle)
    triangle.name = "Right Triangle 2"
    # Xoay 180 độ (rot trong EMU: 180 * 60000 = 10800000)
    xfrm = triangle._element.spPr.find(qn("a:xfrm"))
    xfrm.set("rot", "10800000")

    # ── 3. Logo trường (footer – góc dưới trái) ──────────────────────────
    if os.path.exists(LOGO_PATH):
        logo = slide.shapes.add_picture(
            LOGO_PATH,
            left=Emu(457200),
            top=Emu(6144768),
            width=Emu(457200),
            height=Emu(457200),
        )
        logo.name = "Picture 4"

    # ── 4. Tên trường (bên cạnh logo) ────────────────────────────────────
    univ_box = slide.shapes.add_textbox(
        left=Emu(987552),
        top=Emu(6144768),
        width=Emu(2971800),
        height=Emu(457200),
    )
    univ_box.name = "TextBox 5"
    _set_textbox_margins(univ_box)

    tf_univ = univ_box.text_frame
    tf_univ.word_wrap = True

    # Dòng 1: Tên trường (bold, 10.5pt)
    p1 = tf_univ.paragraphs[0]
    _set_paragraph_default_rpr(p1, 1050, bold=True, color_rgb="000000")
    run1 = p1.add_run()
    run1.text = "TRƯỜNG ĐẠI HỌC XÂY DỰNG HÀ NỘI"

    # Khoảng cách sau dòng 1
    pPr1 = p1._p.find(qn("a:pPr"))
    spcAft = etree.SubElement(pPr1, qn("a:spcAft"))
    spcPts = etree.SubElement(spcAft, qn("a:spcPts"))
    spcPts.set("val", "100")

    # Dòng 2: Tên tiếng Anh (8.5pt, không bold)
    p2 = tf_univ.add_paragraph()
    _set_paragraph_default_rpr(p2, 850, bold=False, color_rgb="000000")
    run2 = p2.add_run()
    run2.text = "Hanoi University of Civil Engineering"

    # ── 5. Đường kẻ ngang (footer separator) ─────────────────────────────
    line_rect = slide.shapes.add_shape(
        1,  # RECTANGLE
        left=Emu(3977639),
        top=Emu(6272784),
        width=Emu(7754112),
        height=Emu(36576),
    )
    line_rect.fill.solid()
    line_rect.fill.fore_color.rgb = COLOR_BLACK
    _remove_line(line_rect)
    line_rect.name = "Rectangle 6"

    # ── 6. URL (center aligned) ──────────────────────────────────────────
    url_box = slide.shapes.add_textbox(
        left=Emu(4114800),
        top=Emu(6419088),
        width=Emu(3962095),
        height=Emu(320040),
    )
    url_box.name = "TextBox 7"
    _set_textbox_margins(url_box)

    tf_url = url_box.text_frame
    p_url = tf_url.paragraphs[0]
    p_url.alignment = PP_ALIGN.CENTER
    _set_paragraph_default_rpr(p_url, 950, bold=False, color_rgb="000000")
    run_url = p_url.add_run()
    run_url.text = "https://www.huce.edu.vn/"

    # ── 7. Số slide (right aligned) ──────────────────────────────────────
    sn_box = slide.shapes.add_textbox(
        left=Emu(9601200),
        top=Emu(6419088),
        width=Emu(2103120),
        height=Emu(320040),
    )
    sn_box.name = "TextBox 8"
    _set_textbox_margins(sn_box)
    # wrap = none cho slide number
    bodyPr = sn_box._element.txBody.find(qn("a:bodyPr"))
    bodyPr.set("wrap", "none")

    tf_sn = sn_box.text_frame
    p_sn = tf_sn.paragraphs[0]
    p_sn.alignment = PP_ALIGN.RIGHT
    _set_paragraph_default_rpr(p_sn, 1050, bold=True, color_rgb="000000")
    run_sn = p_sn.add_run()
    run_sn.text = f"Slide {slide_number:02d} / {total_slides:02d}"


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    prs = Presentation()
    prs.slide_width = Emu(SLIDE_WIDTH)
    prs.slide_height = Emu(SLIDE_HEIGHT)

    # Sử dụng layout Blank
    blank_layout = None
    for layout in prs.slide_layouts:
        if layout.name == "Blank":
            blank_layout = layout
            break
    if blank_layout is None:
        # Fallback: dùng layout cuối cùng (thường là Blank)
        blank_layout = prs.slide_layouts[-1]

    for i in range(1, NUM_SLIDES + 1):
        slide = prs.slides.add_slide(blank_layout)
        add_background_to_slide(slide, slide_number=i, total_slides=NUM_SLIDES)
        print(f"  [OK] Slide {i:02d}/{NUM_SLIDES}")

    prs.save(OUTPUT_PATH)
    print(f"\n[DONE] Da tao xong: {OUTPUT_PATH}")
    print(f"   Tong so slide: {NUM_SLIDES}")


if __name__ == "__main__":
    main()
