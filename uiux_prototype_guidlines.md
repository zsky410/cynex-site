# Cynex UI/UX Guidelines — Modern SaaS Marketplace

## 1. Style Direction

### Style Name

**Modern SaaS Marketplace with Product Library Influence**

### Inspired by

* Linear
* Raycast
* Clerk
* Lemon Squeezy
* Resend
* Vercel dashboard
* Modern SaaS landing pages

### Mục tiêu cảm giác

Cynex không nên nhìn giống một web bán account thủ công, cũng không nên giống marketplace game key quá đông thông tin.

Cảm giác cần đạt:

* Sạch
* Hiện đại
* Tin cậy
* Premium
* Mua nhanh
* Trạng thái rõ
* Ít rối mắt
* Gần với một nền tảng dịch vụ số hơn là shop truyền thống

### Không đi theo style

Tránh các hướng sau:

* Gaming marketplace
* Dark cyberpunk
* Neon-heavy
* Shopee/Lazada clone
* Web bán key rẻ tiền
* Dashboard quá kỹ thuật
* Landing page quá nhiều text
* Glassmorphism nặng
* 3D quá phức tạp

---

# 2. Brand System

## 2.1. Main Brand Color

Logo Cynex có màu cyan-blue sáng. Dùng màu này làm accent chính.

Gợi ý token:

```txt
Primary / Cynex Blue: #0EA5E9 hoặc #1DA1F2
Primary Dark: #0284C7
Primary Light: #E0F2FE
Primary Soft Background: #F0F9FF
```

## 2.2. Neutral Colors

Light theme nên dùng nền trắng/off-white.

```txt
Background: #FFFFFF
Page Background: #F8FAFC
Surface: #FFFFFF
Surface Soft: #F1F5F9
Border: #E2E8F0
Text Primary: #0F172A
Text Secondary: #475569
Text Muted: #94A3B8
```

## 2.3. Status Colors

```txt
Success: #16A34A
Success Background: #DCFCE7

Warning: #F59E0B
Warning Background: #FEF3C7

Danger: #EF4444
Danger Background: #FEE2E2

Info: #0EA5E9
Info Background: #E0F2FE

Purple: #7C3AED
Purple Background: #F3E8FF
```

## 2.4. Color Usage Rule

Cynex Blue không nên phủ toàn bộ web. Chỉ dùng cho:

* CTA chính
* Active navigation
* Selected card
* Link quan trọng
* Focus ring
* Icon highlight
* Price hoặc key accent nếu cần

Tỷ lệ màu khuyến nghị:

```txt
90% white / neutral
7% blue accent
3% status colors
```

---

# 3. Typography

## 3.1. Font

Ưu tiên:

```txt
Inter
Geist Sans
Manrope
```

Nếu dùng Next.js, gợi ý:

```txt
Geist Sans cho UI
Geist Mono cho order code, key, transaction code
```

## 3.2. Font Hierarchy

### Hero title

```txt
Desktop: 56–72px
Mobile: 36–44px
Weight: 700–800
Line-height: 1.05–1.15
```

### Page title

```txt
Desktop: 36–44px
Mobile: 28–34px
Weight: 700
```

### Section title

```txt
Desktop: 24–32px
Mobile: 22–26px
Weight: 700
```

### Card title

```txt
18–20px
Weight: 600–700
```

### Body

```txt
15–16px
Weight: 400–500
Line-height: 1.5–1.7
```

### Caption / metadata

```txt
12–14px
Color: Text Secondary hoặc Muted
```

---

# 4. Layout System

## 4.1. Container

```txt
Max width: 1200–1280px
Desktop padding: 32px
Tablet padding: 24px
Mobile padding: 16px
```

## 4.2. Spacing

Dùng spacing thoáng, tránh nhồi.

```txt
Section gap desktop: 72–96px
Section gap mobile: 48–64px
Card gap: 16–24px
Form field gap: 16px
```

## 4.3. Radius

```txt
Small: 8px
Button/Input: 12px
Card: 20px
Hero visual: 28–32px
Modal: 24px
```

## 4.4. Shadow

Dùng shadow rất nhẹ, kiểu SaaS clean.

```txt
Card shadow: subtle
Hover shadow: slightly stronger
Avoid heavy ecommerce shadows
```

Giao diện nên dựa nhiều vào:

* White space
* Border nhẹ
* Typography
* Blue accent

thay vì đổ bóng quá nặng.

---

# 5. Global Navigation

## 5.1. Header Desktop

Header nên sticky hoặc semi-sticky.

Gồm:

```txt
Logo Cynex
Sản phẩm
Hướng dẫn
Đơn hàng
Ví của tôi
Hỗ trợ
Search box
Login/User menu
```

Nếu user chưa login:

```txt
Đăng nhập
Đăng ký hoặc CTA chính
```

Nếu user đã login:

```txt
Ví của tôi
Avatar/User menu
```

## 5.2. Header Mobile

Mobile nên đơn giản:

```txt
Logo
Search icon
Cart/Order icon nếu có
Menu button
```

Menu mobile mở dạng drawer hoặc sheet.

## 5.3. Header Style

```txt
Height desktop: 72–80px
Height mobile: 60–64px
Background: white hoặc white/80 backdrop-blur
Border bottom: 1px solid #E2E8F0
```

Không nên làm header quá cao hoặc quá nhiều icon.

---

# 6. Global Components

## 6.1. Product Card

Product card là component quan trọng nhất.

Nên có:

```txt
App icon/image
Badge nhỏ nếu cần
Product name
Short description 1 dòng
Processing time
Warranty
Price from
CTA "Xem gói"
```

Không nên có:

```txt
Quá nhiều badge
Rating giả
Mô tả dài
Thông tin kỹ thuật không cần
Nhiều CTA
```

Layout card:

```txt
Top: icon + badge optional
Middle: name + description
Info: processing time + warranty
Bottom: price + CTA
```

Hover:

```txt
Lift nhẹ
Border blue nhẹ
Shadow nhẹ
CTA rõ hơn
```

## 6.2. Variant Card

Dùng trong product detail.

Nên có:

```txt
Thời hạn
Loại gói
Giá
Xử lý dự kiến
Bảo hành
```

Selected state:

```txt
Border primary
Background primary soft
Check icon nhỏ
```

Không nên để variant trong dropdown nếu có nhiều gói. Card selector sẽ dễ hiểu hơn.

## 6.3. Status Badge

Badge phải rõ, ngắn.

User-facing status:

```txt
Chờ thanh toán
Đã thanh toán - chờ xử lý
Đang xử lý
Đã sẵn sàng
Đã giao hàng
Đã hoàn tiền
Xử lý thất bại
```

Không hiển thị enum kỹ thuật như:

```txt
paid_waiting_admin
assigned
```

## 6.4. Order Timeline

Timeline nên có 4–5 bước:

```txt
Đã tạo đơn
Đã thanh toán
Admin đang xử lý
Đã giao hàng
```

Nếu đơn lỗi hoặc hoàn tiền thì hiển thị state riêng.

Timeline cần dễ hiểu trên mobile.

## 6.5. Secret Field

Dùng để hiển thị password/key/account.

Yêu cầu:

```txt
Mặc định che
Có nút hiện/ẩn
Có nút copy
Có toast "Đã copy"
Không hiển thị nếu đơn chưa delivered
```

## 6.6. Empty State

Empty state nên thân thiện và có CTA.

Ví dụ:

```txt
Bạn chưa có đơn hàng nào.
Khám phá các gói premium đang có trên Cynex.
[Khám phá sản phẩm]
```

---

# 7. Animation & Interaction

## 7.1. Animation Style

Animation nên nhẹ, tinh tế, không gây rối.

Dùng:

```txt
Fade in
Slide up nhẹ
Hover lift
Button press
Skeleton loading
Micro transition
```

Không dùng:

```txt
Particles
Parallax nặng
3D animation phức tạp
Video background
Animation liên tục gây mỏi mắt
```

## 7.2. Timing

```txt
Hover transition: 150–200ms
Page transition: 200–300ms
Modal/sheet: 200–250ms
Skeleton shimmer: subtle
```

## 7.3. Hero Visual Animation

Hero visual có thể có:

```txt
Floating app icons rất nhẹ
Flow line animation nhẹ
Logo card hover/float nhẹ
```

Không nên animation quá rõ làm mất tập trung khỏi CTA.

---

# 8. Screen Guidelines

## Screen 1 — Homepage

### Route

```txt
/
```

### Mục tiêu

User vào trang chủ phải hiểu ngay:

```txt
Cynex cung cấp dịch vụ premium/app account/key
Có thể chọn gói, thanh toán, theo dõi đơn
Admin xử lý và giao thông tin qua tài khoản
```

### Layout

```txt
Header
Hero
Popular Categories
Featured Products
Why Cynex
Footer
```

### Hero

Bên trái:

```txt
Headline
Subtitle
Primary CTA
Secondary CTA
3 trust mini items
```

Bên phải:

```txt
Cynex logo ở trung tâm
Các app icon xung quanh
Flow lines từ app về logo
```

Hero không nên có:

```txt
Dashboard đơn hàng
Wallet card
Nhiều số liệu
Nhiều banner khuyến mãi
```

### Category Section

Chỉ hiển thị 6–8 category.

Ví dụ:

```txt
AI Tools
Streaming
Thiết kế
Văn phòng
Bảo mật
Học tập
Khác
```

### Featured Products

Hiển thị 6 sản phẩm là đủ.

Card sản phẩm nên sạch:

```txt
Icon
Tên
Mô tả ngắn
Xử lý dự kiến
Bảo hành
Giá
CTA
```

### Why Cynex

Chỉ 4 lý do:

```txt
Xử lý nhanh chóng
Bảo hành uy tín
Thanh toán an toàn
Hỗ trợ khi cần
```

Không cần stats như 10.000+ khách nếu chưa có số liệu thật.

### Footer

Footer gọn:

```txt
Logo
Mô tả ngắn
Sản phẩm
Hỗ trợ
Tài khoản
Chính sách
```

---

## Screen 2 — Product Listing

### Route

```txt
/products
```

### Mục tiêu

Giúp user tìm sản phẩm nhanh.

### Layout Desktop

```txt
Page header
Search bar lớn
Category chips
Filter/sort row
Product grid
Pagination
```

Có thể dùng sidebar filter nếu số lượng sản phẩm nhiều, nhưng MVP nên giữ đơn giản.

### Layout Mobile

```txt
Search
Category horizontal scroll
Filter button mở bottom sheet
Product list/grid
```

### Filters

Chỉ cần:

```txt
Danh mục
Khoảng giá
Hình thức bán
Thời hạn
```

Không cần quá nhiều filter ngay MVP.

### Product Grid

Desktop:

```txt
4 columns hoặc 5 columns tùy card size
```

Tablet:

```txt
2–3 columns
```

Mobile:

```txt
1–2 columns
```

### Product Card

Nội dung:

```txt
Icon
Tên sản phẩm
Mô tả ngắn
Giá từ
Bảo hành
Xử lý dự kiến
CTA
```

---

## Screen 3 — Product Detail

### Route

```txt
/products/[slug]
```

### Mục tiêu

User chọn đúng gói và bấm mua.

### Layout Desktop

```txt
Left: Product visual
Center: Product info + variant selector
Right: Purchase box
```

### Layout Mobile

```txt
Product visual
Product info
Variant selector
Form nếu có
Sticky buy bar
```

### Product Info

Nên có:

```txt
Tên sản phẩm
Mô tả ngắn
3–5 lợi ích chính
Thông tin xử lý
Thông tin bảo hành
```

Không nên có nhiều tab nếu nội dung ít.

### Variant Selector

Hiển thị dạng card.

Mỗi variant:

```txt
Thời hạn
Loại gói
Giá
Xử lý dự kiến
Bảo hành
```

### Fulfillment Explanation

Giải thích ngắn theo loại gói:

```txt
Nâng chính chủ
Cấp tài khoản riêng
Cấp tài khoản dùng chung
Cấp key/license
```

Chỉ 1–2 câu, không viết dài.

### Purchase Box

Nên có:

```txt
Gói đã chọn
Tổng tiền
Thông tin cần cung cấp nếu có
CTA Mua ngay
```

Nếu cần user nhập thông tin, form nằm ngay trong purchase box hoặc ngay trước CTA.

---

## Screen 4 — Checkout

### Route

```txt
/checkout
```

### Mục tiêu

Xác nhận đơn và thanh toán.

### Layout

Desktop:

```txt
Left: Customer info + payment method
Right: Order summary
```

Mobile:

```txt
Order summary
Customer info
Payment method
CTA
```

### Sections

```txt
Order Summary
Customer Information
Payment Method
Checkout CTA
```

### Payment Method

```txt
payOS / VietQR
Ví Cynex
```

Nếu ví không đủ tiền:

```txt
Hiển thị số dư hiện tại
CTA Nạp thêm
```

### Copy quan trọng

Phải nói rõ:

```txt
Sau khi thanh toán thành công, đơn sẽ chuyển sang trạng thái chờ admin xử lý.
```

Không dùng copy khiến user nghĩ đã nhận hàng ngay.

---

## Screen 5 — Payment Status

### Route

```txt
/payment/status
```

### Mục tiêu

Cho user biết thanh toán đang ở trạng thái nào.

### Layout

Center focused, không cần sidebar.

### Pending State

```txt
QR code
Số tiền
Mã đơn
Thời gian còn lại
CTA Tôi đã thanh toán
CTA Xem đơn hàng
```

### Success State

```txt
Icon success
Thanh toán thành công
Mã đơn
Trạng thái tiếp theo: Chờ admin xử lý
CTA Xem đơn hàng
```

### Failed/Expired State

```txt
Thông báo lỗi/hết hạn
CTA Tạo thanh toán lại
CTA Quay về đơn hàng
```

---

## Screen 6 — Order History

### Route

```txt
/orders
```

### Mục tiêu

User xem danh sách đơn và trạng thái.

### Layout

```txt
Page header
Status tabs
Search order code
Order list
```

### Status Tabs

```txt
Tất cả
Chờ thanh toán
Chờ xử lý
Đang xử lý
Đã giao
Hoàn tiền
```

### Order Item

```txt
Mã đơn
Sản phẩm/gói
Tổng tiền
Ngày mua
Trạng thái
CTA Xem chi tiết
```

Không hiển thị source, cost, admin note hoặc thông tin nội bộ.

---

## Screen 7 — Order Detail

### Route

```txt
/orders/[orderCode]
```

### Mục tiêu

User biết đơn đang ở đâu và xem thông tin giao hàng nếu đã có.

### Layout

```txt
Order Summary
Timeline
Payment Summary
Delivery Information
Support CTA
```

### Pending/Processing State

Hiển thị:

```txt
Trạng thái hiện tại
Timeline
Thông báo chờ xử lý
```

Copy gợi ý:

```txt
Đơn của bạn đã được thanh toán và đang chờ admin xử lý. Cynex sẽ gửi email khi thông tin sử dụng sẵn sàng.
```

### Delivered State

Hiển thị:

```txt
Thông tin tài khoản/key
Hướng dẫn sử dụng
Ngày hết hạn nếu có
Bảo hành đến ngày nếu có
Copy button
Show/hide secret
CTA Yêu cầu hỗ trợ
```

### Security

Thông tin nhạy cảm phải:

```txt
Che mặc định
Có nút hiện/ẩn
Có nút copy
Không hiển thị cho đơn chưa delivered
```

---

## Screen 8 — Wallet

### Route

```txt
/wallet
```

### Mục tiêu

User xem số dư, nạp tiền, xem lịch sử ví.

### Layout

```txt
Balance Card
Deposit Section
Transaction History
```

### Balance Card

Nổi bật nhưng không quá màu mè.

```txt
Số dư ví
CTA Nạp tiền
```

### Deposit Section

```txt
Input số tiền
Quick amount chips
CTA Tạo thanh toán
```

Quick amount:

```txt
50k
100k
200k
500k
1M
```

### Transaction History

Mỗi item:

```txt
Loại giao dịch
Mô tả
Số tiền +/-
Thời gian
Số dư sau giao dịch
```

Không cần biểu đồ tài chính ở MVP.

---

## Screen 9 — Login

### Route

```txt
/login
```

### Mục tiêu

Đăng nhập nhanh, không gây cản trở mua hàng.

### Layout

```txt
Centered card
```

Gồm:

```txt
Logo
Title
Email
Password
Forgot password
Login CTA
Register link
```

Nếu user đến từ checkout, sau login phải quay lại checkout.

### Style

Nền light, card trắng, shadow nhẹ.

Không cần visual phức tạp.

---

## Screen 10 — Register

### Route

```txt
/register
```

### Mục tiêu

Tạo tài khoản nhanh.

### Layout

```txt
Centered card
```

Gồm:

```txt
Logo
Title
Email
Password
Confirm Password
Register CTA
Login link
```

Không hỏi quá nhiều thông tin ngay từ đầu.

---

## Screen 11 — Warranty / Support

### Route

```txt
/support/new
```

### Mục tiêu

User báo lỗi hoặc yêu cầu hỗ trợ từ đơn đã mua.

### Layout

```txt
Order selector
Reason selector
Description
Attachments
Submit
```

### Reason Options

```txt
Không đăng nhập được
Sai mật khẩu
Key không active được
Mất premium
Cần hướng dẫn
Lỗi khác
```

Không hỏi lại thông tin hệ thống đã có như mã đơn nếu user đã vào từ order detail.

---

## Screen 12 — Account

### Route

```txt
/account
```

### Mục tiêu

Quản lý tài khoản cơ bản.

### Layout

```txt
Profile Information
Security Settings
Quick Actions
```

### Profile

```txt
Email
Tên hiển thị nếu có
Ngày tạo tài khoản
```

### Security

```txt
Đổi mật khẩu
Đăng xuất
```

### Quick Actions

```txt
Đơn hàng của tôi
Ví của tôi
Yêu cầu hỗ trợ
```

Không biến account page thành dashboard phức tạp.

---

# 9. Responsive Rules

## Desktop

Dùng layout rộng, nhiều whitespace.

```txt
Hero 2 columns
Product detail 3 columns
Checkout 2 columns
```

## Tablet

```txt
Hero vẫn có thể 2 columns
Product grid 2–3 columns
Product detail chuyển 2 columns
```

## Mobile

```txt
Single column
CTA sticky ở product detail
Filter dùng bottom sheet
Header gọn
Touch target tối thiểu 44px
```

---

# 10. Accessibility Rules

Tối thiểu cần:

```txt
Contrast rõ
Button có focus state
Form có label
Error nằm gần input
Không chỉ dùng màu để truyền trạng thái
Icon button có aria-label
Modal trap focus
Secret field có label rõ
```

---

# 11. Copywriting Rules

## Nên dùng

```txt
Đã thanh toán - chờ xử lý
Admin đang xử lý đơn hàng
Thông tin sử dụng đã sẵn sàng
Xem thông tin trong tài khoản
Bảo hành theo chính sách của gói
Yêu cầu hỗ trợ
```

## Không nên dùng

```txt
Giao tự động ngay
Nhận hàng tức thì
Cam kết không bao giờ lỗi
Tài khoản vĩnh viễn
Rẻ nhất thị trường
```

Cynex nên nói rõ, chuyên nghiệp, không hứa quá mức.

---

# 12. Hero Visual Guideline

Hero visual nên là một hình riêng, dùng bên phải của homepage.

Concept:

```txt
Cynex logo ở trung tâm
Các app icon xung quanh
Flow lines từ app về logo
Light background
Soft 3D
SaaS clean
```

Ý nghĩa:

```txt
Cynex là trung tâm kết nối các dịch vụ premium.
```

Không dùng:

```txt
Dashboard nhiều số liệu
Wallet card
Order card
Banner sale
Quá nhiều app icon
```

Animation nếu build bằng code:

```txt
App icons float nhẹ
Flow line chạy chậm
Logo card hover nhẹ
```

---

# 13. Final AI Design Prompt

```txt
Design a premium modern SaaS marketplace for Cynex, a digital premium service platform. Use a light theme with Cynex Blue as the primary accent. The visual style should feel like Linear, Raycast, Clerk, Resend and Lemon Squeezy: clean, spacious, minimal but not plain. Focus on clear product discovery, simple product cards, strong CTA hierarchy, clear order tracking and secure delivery information. Avoid gaming marketplace, cyberpunk, heavy gradients, glassmorphism, Shopee-style ecommerce and cluttered layouts. Use subtle animations such as hover lift, fade, skeleton loading and gentle floating hero elements.
```

---

# 14. Final Checklist

Mỗi screen trước khi chốt cần kiểm tra:

```txt
User có hiểu màn này để làm gì trong 3 giây không?
CTA chính có rõ không?
Có thông tin nào thừa không?
Màn có quá nhiều card không?
Mobile có dễ thao tác không?
Trạng thái đơn có rõ không?
Có gây hiểu nhầm là giao tự động không?
Thông tin account/key có được bảo mật không?
```
