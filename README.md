<img src="webp/Sonic the Hedgehog.webp" alt="Logo" width="80" align="right" style="margin-left: 16px;" />

# 📦 Kho Tài Nguyên – DM Intercontinental

> Kho lưu trữ tập trung các tài nguyên phục vụ bài thuyết trình & dự án.

---

## 📂 Cấu Trúc Thư Mục

```
DM_intercontinental/
│
├── logo HUCE/                  # Logo gốc của trường
│   ├── Logo ĐH Xây Dựng Hà Nội - NUCE.ai    # File vector (Adobe Illustrator)
│   └── Logo ĐH Xây Dựng Hà Nội - NUCE.png   # File ảnh PNG
│
├── slide/                      # Slide thuyết trình
│   ├── slide.pptx                             # Slide gốc (có nội dung)
│   ├── slide_background.pptx                  # Slide nền trống (chỉ có background)
│   ├── create_slide_background.py             # Script Python tạo nền slide
│   ├── Logo ĐH Xây Dựng Hà Nội - NUCE.png   # Logo dùng trong slide
│   └── README.md                              # Nguyên tắc trình bày nội dung slide
│
├── webp/                       # Ảnh định dạng WebP
│   └── Sonic the Hedgehog.webp
│
└── README.md                   # 📌 File này
```

---

## 🎨 Tài Nguyên Có Sẵn

### Logo Trường ĐH Xây Dựng Hà Nội

| File | Định dạng | Kích thước | Ghi chú |
|------|-----------|-----------|---------|
| `Logo ĐH Xây Dựng Hà Nội - NUCE.ai` | Vector (AI) | 96 KB | File gốc, chỉnh sửa được |
| `Logo ĐH Xây Dựng Hà Nội - NUCE.png` | Ảnh (PNG) | 92 KB | Dùng trực tiếp trong slide |

### Slide Thuyết Trình

| File | Mô tả |
|------|-------|
| `slide.pptx` | Slide đầy đủ nội dung (30 slide) |
| `slide_background.pptx` | Chỉ có nền, không nội dung – dùng làm template |

### Script Tự Động

| File | Mô tả | Cách chạy |
|------|-------|-----------|
| `create_slide_background.py` | Tạo file `.pptx` chỉ có nền slide | `py -3 create_slide_background.py` |

---

## 🚀 Bắt Đầu Nhanh

```bash
# 1. Cài thư viện
pip install python-pptx

# 2. Tạo slide nền trống
py -3 slide/create_slide_background.py

# 3. Mở file output
# → slide/slide_background.pptx
```

---

## 📖 Tài Liệu Tham Khảo

- [Nguyên tắc trình bày nội dung slide](slide/README.md)
