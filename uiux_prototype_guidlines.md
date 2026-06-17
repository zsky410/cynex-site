# UI/UX Prototype Guideline — Cynex Digital Premium Store

## Bản gọn 12 screen, tối ưu conversion

## 1. Nguyên tắc thiết kế chính

Cynex không nên giống một shop bán tài khoản rối rắm. Giao diện cần giống một **premium digital service platform**:

```txt
Sạch
Hiện đại
Tối giản
Rõ trạng thái
Mua nhanh
Ít thông tin thừa
Mobile-first
```

Mỗi màn chỉ nên trả lời các câu hỏi user thật sự quan tâm:

```txt
Sản phẩm này là gì?
Giá bao nhiêu?
Nhận hàng kiểu gì?
Xử lý mất bao lâu?
Bảo hành thế nào?
Thanh toán bằng gì?
Đơn của tôi đang ở đâu?
Thông tin đã giao nằm ở đâu?
Nếu lỗi thì bảo hành ra sao?
```

Không nhồi quá nhiều:

```txt
Trust card lặp lại
Icon trang trí quá nhiều
Banner phụ
Mô tả dài
Thông tin marketing chung chung
Section không giúp user mua hàng
```

---

# 2. Visual direction

## 2.1. Style

```txt
Dark-first
Premium SaaS
Card-based
Subtle gradient
Clean tech
Ít neon
Ít hiệu ứng
```

## 2.2. Color

```txt
Background: #070A12
Surface: #0D111C
Surface elevated: #121827
Border: #222A3A
Text chính: #F8FAFC
Text phụ: #94A3B8
Primary: #38BDF8
Accent: #A855F7
Success: #22C55E
Warning: #F59E0B
Danger: #EF4444
```

## 2.3. Typography

```txt
Font: Inter / Geist / Manrope
Heading: 700–800
Body: 400–500
Price: 700
Code, order code, key: mono font
```

## 2.4. Component style

```txt
Card radius: 20px
Button radius: 12px
Input radius: 12px
Border mỏng
Hover nhẹ
Không dùng shadow quá nặng
Không dùng glow quá nhiều
```

---

# 3. UX rules quan trọng

## 3.1. Không hứa giao tự động nếu chưa có

Vì MVP là admin xử lý thủ công, mọi nơi cần dùng copy rõ:

```txt
Đã thanh toán - chờ xử lý
Admin đang xử lý đơn hàng
Thông tin sử dụng sẽ được gửi sau khi hoàn tất
```

Không dùng:

```txt
Giao ngay lập tức
Tự động nhận hàng
Hoàn tất đơn hàng
```

nếu admin chưa giao hàng.

## 3.2. Ưu tiên mua nhanh

Product detail phải có:

```txt
Tên sản phẩm
Variant/gói
Giá
Thời gian xử lý
Bảo hành
CTA mua ngay
```

Không đẩy CTA xuống quá sâu.

## 3.3. Mobile-first

Trên mobile:

```txt
CTA mua hàng sticky bottom
Filter dùng bottom sheet
Card 1 column
Thông tin đơn rõ
QR thanh toán đủ lớn
Copy account/key dễ bấm
```

## 3.4. Thông tin nhạy cảm

Account/key/password:

```txt
Mặc định che
Có nút hiện/ẩn
Có nút copy
Không hiển thị nếu đơn chưa delivered
Không show recovery info nếu không cần
```

---

# 4. Danh sách 12 screen prototype

## Screen 1 — Homepage

Route:

```txt
/
```

Mục tiêu:

```txt
Cho user hiểu Cynex bán gì và dẫn user đi xem sản phẩm nhanh.
```

Nên có:

```txt
Header
Hero ngắn
Search sản phẩm
Category chips
Sản phẩm nổi bật
Cách mua 4 bước
Footer gọn
```

Không nên có:

```txt
Quá nhiều thống kê
Quá nhiều trust card
Nhiều banner phụ
Carousel dài
Review giả/lặp lại
```

Hero content:

```txt
Headline:
Nâng cấp app premium nhanh, rõ trạng thái, có bảo hành.

Subtitle:
Chọn gói, thanh toán, theo dõi đơn và xem thông tin sử dụng trong tài khoản Cynex.

CTA:
Khám phá sản phẩm
Xem hướng dẫn mua
```

Cách mua 4 bước:

```txt
1. Chọn gói
2. Thanh toán
3. Admin xử lý
4. Nhận thông tin
```

---

## Screen 2 — Product Listing

Route:

```txt
/products
```

Mục tiêu:

```txt
Giúp user tìm sản phẩm nhanh và so sánh sản phẩm cơ bản.
```

Nên có:

```txt
Search
Category chips
Filter đơn giản
Sort
Product grid
Pagination
```

Filter chỉ cần:

```txt
Danh mục
Khoảng giá
Hình thức bán
Thời hạn
```

Không nên có:

```txt
Quá nhiều filter nhỏ
Sidebar quá dài
Thông số user không quan tâm
Card sản phẩm quá nhiều badge
```

Product card chỉ cần:

```txt
Icon/ảnh
Tên sản phẩm
Mô tả 1 dòng
Giá từ
Số gói
Badge bảo hành
CTA Xem gói
```

---

## Screen 3 — Product Detail

Route:

```txt
/products/[slug]
```

Mục tiêu:

```txt
Giúp user chọn đúng gói và mua ngay.
```

Nên có:

```txt
Ảnh/icon sản phẩm
Tên sản phẩm
Mô tả ngắn
Lợi ích chính 3–5 dòng
Variant selector
Giá
Thời gian xử lý
Bảo hành
Form thông tin cần cung cấp nếu có
CTA mua ngay
```

Không nên có:

```txt
Quá nhiều tab
Quá nhiều ảnh thumbnail
Mô tả dài lê thê
Trust card lặp lại
Review dài
Section phụ quá nhiều
```

Layout khuyến nghị:

```txt
Left: Product visual
Center: Product info + variant cards
Right: Buy box
```

Variant card chỉ cần:

```txt
Thời hạn
Loại gói
Giá
Xử lý dự kiến
Bảo hành
```

Buy box chỉ cần:

```txt
Sản phẩm/gói đã chọn
Tổng tiền
Thông tin cần cung cấp
Button Mua ngay
```

Mobile:

```txt
Sticky bottom bar: Giá + Mua ngay
```

---

## Screen 4 — Checkout

Route:

```txt
/checkout
```

Mục tiêu:

```txt
Xác nhận đơn và chọn thanh toán.
```

Nên có:

```txt
Tóm tắt đơn hàng
Thông tin khách đã nhập
Phương thức thanh toán
Tổng tiền
CTA thanh toán
```

Payment methods:

```txt
payOS / VietQR
Ví Cynex
```

Không nên có:

```txt
Form dài
Upsell
Coupon nếu chưa cần
Nhiều bước checkout
Nhiều text chính sách
```

Copy quan trọng:

```txt
Sau khi thanh toán thành công, đơn sẽ chuyển sang trạng thái chờ admin xử lý.
```

---

## Screen 5 — Payment Pending / Success

Route:

```txt
/payment/status
```

Có thể gom pending và success trong một màn theo state.

Mục tiêu:

```txt
Cho user biết thanh toán đang ở trạng thái nào.
```

Pending state nên có:

```txt
QR code
Số tiền
Mã đơn
Countdown
Button Tôi đã thanh toán
Button Xem đơn hàng
```

Success state nên có:

```txt
Icon success
Thanh toán thành công
Mã đơn
Trạng thái: Chờ admin xử lý
Button Xem đơn hàng
```

Không nên có:

```txt
Nhiều thông tin marketing
Đẩy thêm sản phẩm quá sớm
Copy gây hiểu nhầm là đã giao hàng
```

---

## Screen 6 — Order History

Route:

```txt
/orders
```

Mục tiêu:

```txt
Cho user xem toàn bộ đơn và trạng thái nhanh.
```

Nên có:

```txt
Tabs trạng thái
Danh sách đơn
Search mã đơn
Filter thời gian đơn giản
```

Tabs:

```txt
Tất cả
Chờ thanh toán
Chờ xử lý
Đang xử lý
Đã giao
Hoàn tiền
```

Order card/list item:

```txt
Mã đơn
Sản phẩm/gói
Số tiền
Ngày mua
Trạng thái
CTA Xem chi tiết
```

Không nên có:

```txt
Hiển thị quá nhiều metadata
Thông tin nguồn hàng
Thông tin nội bộ
Layout card quá to
```

---

## Screen 7 — Order Detail

Route:

```txt
/orders/[orderCode]
```

Mục tiêu:

```txt
User biết đơn đang ở đâu và xem thông tin giao hàng nếu có.
```

Nên có:

```txt
Mã đơn
Status nổi bật
Timeline trạng thái
Tóm tắt sản phẩm
Thanh toán
Thông tin đã giao nếu delivered
CTA bảo hành nếu delivered
```

Timeline:

```txt
Đã tạo đơn
Đã thanh toán
Admin đang xử lý
Đã giao hàng
```

Pending state copy:

```txt
Đơn đã thanh toán và đang chờ admin xử lý. Bạn sẽ nhận email khi thông tin sử dụng sẵn sàng.
```

Delivered state:

```txt
Account/key
Hướng dẫn sử dụng
Ngày hết hạn nếu có
Nút copy
Nút hiện/ẩn
Nút yêu cầu bảo hành
```

Không nên có:

```txt
Log kỹ thuật
Payment raw info
Thông tin source
Quá nhiều card phụ
```

---

## Screen 8 — Wallet

Route:

```txt
/wallet
```

Mục tiêu:

```txt
User xem số dư, nạp tiền và xem lịch sử ví.
```

Nên có:

```txt
Balance card
Button nạp tiền
Quick amount chips
Transaction list
```

Quick amounts:

```txt
50k
100k
200k
500k
1M
```

Transaction item:

```txt
Loại giao dịch
Mô tả
Số tiền +/-
Thời gian
Số dư sau giao dịch
```

Không nên có:

```txt
Biểu đồ phức tạp
Analytics tài chính
Quá nhiều thông tin ngân hàng
```

---

## Screen 9 — Login / Register

Route:

```txt
/login
/register
```

Mục tiêu:

```txt
Đăng nhập/đăng ký nhanh, không cản trở mua hàng.
```

Nên có:

```txt
Email
Password
Forgot password
Login/Register CTA
Switch login/register
```

Không nên có:

```txt
Form quá nhiều field
Thông tin marketing quá dài
Nhiều background gây rối
```

Copy login:

```txt
Đăng nhập để theo dõi đơn hàng, quản lý ví và xem thông tin đã mua.
```

Nếu user bị redirect từ checkout:

```txt
Sau khi đăng nhập, bạn sẽ quay lại bước thanh toán.
```

---

## Screen 10 — Warranty Create

Route:

```txt
/support/new
```

Mục tiêu:

```txt
User báo lỗi sản phẩm đã mua.
```

Nên có:

```txt
Chọn đơn
Chọn lý do
Mô tả lỗi
Upload ảnh nếu cần
Submit
```

Reason options:

```txt
Không đăng nhập được
Sai mật khẩu
Key không active được
Mất premium
Cần hướng dẫn
Lỗi khác
```

Không nên có:

```txt
Form quá dài
Hỏi thông tin đã có trong đơn
Bắt user nhập lại account/key
```

---

## Screen 11 — Guide / How to Buy

Route:

```txt
/guide
```

Mục tiêu:

```txt
Giải thích cách mua và cách nhận hàng.
```

Nên có:

```txt
4 bước mua hàng
Cách thanh toán
Cách nhận thông tin
Cách yêu cầu bảo hành
FAQ ngắn
```

FAQ chỉ cần 5–7 câu:

```txt
Sau khi thanh toán bao lâu nhận hàng?
Thông tin được gửi ở đâu?
Nếu tài khoản lỗi thì sao?
Có thể thanh toán bằng ví không?
Tôi có thể xem lại đơn ở đâu?
```

Không nên có:

```txt
Bài viết quá dài
Nhiều chính sách pháp lý trong cùng màn
Text dày đặc
```

---

## Screen 12 — Account Settings

Route:

```txt
/account
```

Mục tiêu:

```txt
User quản lý thông tin cá nhân cơ bản.
```

Nên có:

```txt
Thông tin tài khoản
Email
Đổi mật khẩu
Liên kết nhanh đến đơn hàng
Liên kết nhanh đến ví
Logout
```

Không nên có:

```txt
Dashboard phức tạp
Thống kê mua hàng quá chi tiết
Thông tin không dùng tới
```

---

# 5. Component cần có

## 5.1. Global

```txt
AppHeader
AppFooter
Container
SectionHeader
StatusBadge
PriceText
EmptyState
LoadingSkeleton
Toast
ConfirmDialog
```

## 5.2. Commerce

```txt
ProductCard
VariantCard
BuyBox
CheckoutSummary
PaymentMethodCard
OrderTimeline
DeliveredInfoCard
WalletBalanceCard
TransactionItem
WarrantyForm
```

## 5.3. Utility

```txt
CopyButton
SecretField
FileUpload
SearchBar
CategoryChips
FilterSheet
```

---

# 6. Status badge guideline

## 6.1. User-facing order status

```txt
waiting_payment → Chờ thanh toán
paid_waiting_admin → Đã thanh toán - chờ xử lý
processing → Đang xử lý
assigned → Đã sẵn sàng
delivered → Đã giao hàng
refunded → Đã hoàn tiền
failed → Xử lý thất bại
```

## 6.2. Màu badge

```txt
Chờ thanh toán: gray
Chờ xử lý: blue
Đang xử lý: amber
Đã sẵn sàng: purple
Đã giao: green
Hoàn tiền: slate
Thất bại: red
```

---

# 7. Copy guideline

## 7.1. Nên dùng

```txt
Đã thanh toán - chờ xử lý
Admin đang xử lý đơn hàng
Thông tin sử dụng đã sẵn sàng
Xem thông tin trong tài khoản
Bảo hành theo chính sách của gói
Yêu cầu hỗ trợ
```

## 7.2. Không nên dùng

```txt
Giao tự động ngay
Nhận hàng tức thì
Cam kết không bao giờ lỗi
Tài khoản vĩnh viễn
Siêu rẻ không nguồn gốc
```

---

# 8. Final checklist cho từng screen

Trước khi chốt UI, kiểm tra:

```txt
Screen này có giúp user làm việc chính nhanh hơn không?
Có thông tin nào đang lặp hoặc thừa không?
CTA chính có thấy ngay không?
Mobile có dễ bấm không?
Trạng thái đơn có rõ không?
Có gây hiểu nhầm là giao tự động không?
Thông tin nhạy cảm có được che/copy đúng cách không?
```

Nếu một block không giúp user mua hàng, thanh toán, theo dõi đơn hoặc bảo hành, hãy bỏ.
