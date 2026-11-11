# My Boss · 4 Năm Bên Nhau (12.11)

Cuốn album ảnh & video lật trang 3D kỷ niệm 4 năm tình yêu (12.11.2022 — 12.11.2026) dành tặng cho **Boss**.

## 🌿 Điểm nổi bật của dự án
- **Hiệu ứng lật sách 3D chân thực (Realistic 3D Book Page-Flip)**: Từng trang sách mở ra độc lập với độ cong giấy, bóng đổ gáy sách chuyển động theo góc nghiêng, âm thanh sột soạt lật giấy chân thật và bìa cứng gập mở 3D ấn tượng.
- **Tích hợp Video kỷ niệm**: Hỗ trợ khung xem video HD trong album, tự động hạ nhỏ nhạc nền du dương khi phát video có tiếng và tự phát lại nhạc nền khi chuyển trang.
- **Quản lý nội dung dễ dàng qua file text**: Toàn bộ tiêu đề, nhãn địa điểm, lời tâm sự của cả 24 trang đều nằm trong file `Noi-dung-album.txt`. Chỉ cần sửa chữ trong file text và chạy `python prepare_photos.py` là web cập nhật ngay lập tức.
- **Tông màu Botanical / Sage Green**: Cảm giác mát mẻ, thanh lịch, kết hợp họa tiết hoa lá và cánh hoa bay bổng.
- **Âm nhạc tình yêu Web Audio**: Tự tổng hợp giai điệu lãng mạn bằng Web Audio API, không cần file MP3, phát mượt mà cả khi offline.
- **Đầy đủ phiên bản quà tặng**:
  - `site/`: Mã nguồn website tối ưu triển khai lên **GitHub Pages**.
  - `My-Boss.html`: Phiên bản **1 file duy nhất** nhúng toàn bộ ảnh Base64 để lưu vào USB hoặc gửi tặng Boss xem offline.
  - `My-Boss-Ky-Niem-4-Nam.zip`: Gói quà tặng trọn bộ gồm ảnh, video và hướng dẫn mở album.

## 📖 Cấu trúc album (24 Trang Sách · 6 Chương)
1. **Trang 01 — Bìa Mở Đầu**: Dành tặng Boss của anh · Chạm mắt là thấy bình yên.
2. **Chương 1: Đi biển Cát Bà (Trang 02 → 10 · 9 ảnh)**: Cát Cò 1, Cát Cò 2, Đường ven biển, chèo thuyền Kayak trên Vịnh Lan Hạ.
3. **Chương 2: Đêm Sun World Cát Bà (Trang 11 → 14 · 4 ảnh)**: Em bé ba tuổi nhí nhố, nụ cười trên bãi cỏ và "tay đua nhí" trên xe điện.
4. **Chương 3: Làm gốm Bát Tràng (Trang 15 → 17 · 3 ảnh)**: Bàn xoay gốm, tạp dề nâu và những món đồ nhỏ xinh cùng tạo nên.
5. **Chương 4: Gom nhặt hẹn hò (Trang 18 → 21 · 1 ảnh + 3 video)**: Video tô tượng, xem phim rạp và 2 video hát Music Box cùng Boss.
6. **Chương 5: 4 Năm một chặng đường (Trang 22 · 1 ảnh)**: Ánh nến kỷ niệm và cột mốc 12.11 đặc biệt.
7. **Chương 6: Lá thư tình 12.11 (Trang 23 & 24 · 2 trang thư)**: Bức thư tình đầy xúc động gửi Boss và nút tải lá thư về máy.

## 🚀 Cách xem thử trên máy tính
Chạy lệnh sau trong thư mục dự án:
```powershell
python -m http.server 4174 --directory site
```
Sau đó mở trình duyệt truy cập: `http://localhost:4174`

Hoặc mở trực tiếp file `My-Boss.html` bằng Chrome/Edge/Safari.

## 📦 Các script hỗ trợ
- `prepare_photos.py`: Đọc nội dung từ `Noi-dung-album.txt`, tối ưu ảnh từ `raw_photos/`, nén video từ `raw_videos/` và xuất manifest ra `site/photos.js`.
- `export_gift.py`: Đóng gói toàn bộ web thành 1 file `My-Boss.html` và file zip `My-Boss-Ky-Niem-4-Nam.zip`.
