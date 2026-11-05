# My Boss · 4 Năm Bên Nhau (12.11)

Cuốn album ảnh lật trang 3D kỷ niệm 4 năm tình yêu (12.11.2021 — 12.11.2025) dành tặng cho **Boss**.

## 🌿 Điểm nổi bật của dự án
- **Hiệu ứng lật sách 3D**: Lật trang chân thật với bóng đổ và góc nghiêng trang giấy, có bìa cứng gập mở khi vừa truy cập.
- **Tông màu tươi mát, đầy sức sống**: Thiết kế theo phong cách Botanical / Sage Green, mang lại cảm giác mát mẻ, thanh lịch và lãng mạn.
- **Âm nhạc tình yêu Web Audio**: Tự tổng hợp giai điệu lãng mạn bằng Web Audio API, không cần file MP3, phát mượt mà cả khi offline.
- **Hiệu ứng bay hoa lá**: Cánh hoa và giọt sương nhẹ nhàng trôi ở nền tạo không khí sinh động.
- **Hai phiên bản tiện lợi**:
  - `site/`: Mã nguồn website tối ưu sẵn để triển khai lên **GitHub Pages** (`https://ntl2k1.github.io/my_boss`).
  - `My-Boss.html`: Phiên bản **1 file duy nhất** (~4.4 MB) nhúng toàn bộ ảnh Base64 để lưu vào USB hoặc gửi tặng Boss mở offline không cần mạng.

## 📖 Cấu trúc album
Cuốn album gồm **15 khoảnh khắc** chia làm **5 chương** cùng **Lá thư tình 2 trang**:
1. **Chương 1: Chạm mắt là thấy bình yên** — Những bức chân dung xinh đẹp và ngọt ngào nhất.
2. **Chương 2: Vitamin Sea cùng Boss** — Chuyến đi biển Hạ Long / Cát Bà, hoàng hôn và nụ cười rạng rỡ.
3. **Chương 3: Em bé ba tuổi của anh** — Những khoảnh khắc nhí nhố đáng yêu (bãi cỏ xanh, lái xe điện đồ chơi).
4. **Chương 4: Gom nhặt những buổi hẹn hò** — Rạp phim quen, buổi làm gốm và những bữa tối bên nhau.
5. **Chương 5: 4 Năm một chặng đường** — Bữa tiệc kỷ niệm ấm cúng cùng cột mốc 12.11.
6. **Lá thư tình 12.11** — Bức thư tình chân thành và sâu lắng gửi đến Boss.

## 🚀 Cách xem thử trên máy tính
Chạy lệnh sau trong thư mục dự án:
```powershell
python -m http.server 4174 --directory site
```
Sau đó mở trình duyệt truy cập: `http://localhost:4174`

Hoặc mở trực tiếp file `My-Boss.html` bằng Chrome/Edge/Safari.

## 📦 Các script hỗ trợ
- `prepare_photos.py`: Tự động nén ảnh từ thư mục `raw_photos/` sang `site/photos/` và `site/thumbs/`.
- `export_gift.py`: Đóng gói toàn bộ web thành 1 file `My-Boss.html` và file zip `My-Boss-Ky-Niem-4-Nam.zip`.

