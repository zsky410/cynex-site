# PRD FINAL — Website bán app/tài khoản premium MVP v1

## 1. Tổng quan sản phẩm

### 1.1. Mục tiêu

Xây dựng website bán sản phẩm digital gồm:

* Dịch vụ nâng cấp chính chủ tài khoản khách.
* Cấp tài khoản sử dụng, gồm account riêng và account dùng chung nhiều khách.
* Cấp key/license/active code để khách tự kích hoạt.

MVP vận hành theo hướng:

```txt
Khách đặt hàng
→ Khách thanh toán
→ Hệ thống gửi email xác nhận thanh toán
→ Admin kiểm tra đơn
→ Admin gắn account/key/kết quả xử lý vào đơn
→ Admin gửi email giao hàng
→ Khách xem thông tin đã mua trong lịch sử đơn
```

MVP **chưa có giao hàng tự động**. Admin xử lý thủ công nhưng toàn bộ thao tác phải được ghi nhận trong hệ thống để tránh thất thoát tiền, cấp trùng account/key và khó xử lý bảo hành.

---

## 2. Tech stack chốt

### 2.1. Monorepo

```txt
pnpm + Turborepo
```

Cấu trúc đề xuất:

```txt
/apps
  /web        Website khách hàng - Next.js
  /admin      Admin dashboard - React Admin
  /api        Backend API - NestJS
  /worker     Background jobs - BullMQ worker

/packages
  /db         Prisma schema/client
  /shared     Shared types, enums, validation
  /ui         Shared UI components nếu cần
  /config     Shared eslint/tsconfig
```

### 2.2. Frontend user

```txt
Next.js + TypeScript + Tailwind + shadcn/ui
```

### 2.3. Admin

```txt
React Admin + Ant Design hoặc MUI
```

### 2.4. Backend API

```txt
NestJS + TypeScript
```

### 2.5. Database

```txt
PostgreSQL
```

PostgreSQL là nơi lưu toàn bộ data nghiệp vụ chính:

* User.
* Admin.
* Product.
* Variant.
* Order.
* Payment.
* Wallet.
* Inventory.
* Supply source.
* Source order.
* Warranty.
* Email log.
* Audit log.
* Metadata file.

### 2.6. ORM

```txt
Prisma
```

Prisma không lưu dữ liệu. Prisma là ORM giúp NestJS đọc/ghi dữ liệu vào PostgreSQL.

### 2.7. Queue/background jobs

```txt
Redis + BullMQ
```

Dùng cho:

* Gửi email.
* Xử lý webhook payment.
* Retry email lỗi.
* Alert đơn chờ xử lý.
* Stock alert.
* Các job nền sau này.

### 2.8. Payment

```txt
payOS
```

Dùng cho:

* Thanh toán đơn hàng.
* Nạp tiền ví.

### 2.9. Email

```txt
Resend
```

Dùng cho:

* Email xác nhận thanh toán.
* Email nạp tiền thành công.
* Email giao hàng.
* Email hoàn tiền.
* Email bảo hành.
* Email reset password.

### 2.10. Storage

```txt
Cloudflare R2
```

Dùng để lưu file/object:

* Ảnh sản phẩm.
* Banner.
* Ảnh proof nguồn hàng.
* Ảnh lỗi khách gửi khi bảo hành.
* File hướng dẫn PDF.
* Attachment ticket.

PostgreSQL chỉ lưu metadata file và `storage_key`.

### 2.11. Deploy

```txt
Docker + Coolify trên VPS
```

Services tối thiểu:

```txt
web
admin
api
worker
postgres
redis
```

---

## 3. Phạm vi MVP

## 3.1. Có trong MVP v1

### User

* Đăng ký.
* Đăng nhập.
* Đăng xuất.
* Quên mật khẩu.
* Xem sản phẩm.
* Xem chi tiết sản phẩm.
* Chọn gói/variant.
* Mua ngay.
* Thanh toán qua payOS.
* Nạp tiền ví qua payOS.
* Thanh toán đơn bằng ví.
* Xem số dư ví.
* Xem lịch sử ví.
* Xem lịch sử đơn hàng.
* Xem chi tiết đơn.
* Xem thông tin đã được giao.
* Tạo yêu cầu hỗ trợ/bảo hành cơ bản.

### Admin

* Đăng nhập admin site riêng.
* Dashboard tổng quan.
* Quản lý sản phẩm.
* Quản lý gói bán/variant.
* Quản lý nguồn hàng.
* Quản lý đơn nguồn hàng.
* Quản lý kho account.
* Quản lý kho key/license.
* Quản lý account dùng chung theo slot.
* Quản lý đơn hàng.
* Gắn account/key vào đơn.
* Nhập nội dung giao thủ công.
* Preview email giao hàng.
* Gửi email giao hàng.
* Quản lý user.
* Quản lý ví user.
* Cộng/trừ tiền ví bằng transaction.
* Quản lý yêu cầu bảo hành.
* Email log.
* Audit log cơ bản.

### System

* Xử lý webhook payOS.
* Gửi email xác nhận thanh toán.
* Gửi email giao hàng.
* Gửi email nạp tiền thành công.
* Ghi email log.
* Ghi audit log.
* Mã hóa credential/key.
* Lưu file lên Cloudflare R2.
* Backup PostgreSQL.

---

## 3.2. Chưa làm trong MVP v1

* Giao hàng tự động.
* Auto order nguồn hàng.
* Auto import kho từ nguồn.
* Auto check account sống/chết.
* App mobile.
* Affiliate/referral.
* Coupon phức tạp.
* Chat realtime.
* Telegram/Discord bot.
* Phân quyền admin cực chi tiết.
* Báo cáo tài chính nâng cao.
* Fraud detection nâng cao.

---

# 4. Đối tượng sử dụng

## 4.1. Guest

Người chưa đăng nhập.

Có thể:

* Xem sản phẩm.
* Xem chi tiết sản phẩm.
* Xem giá.
* Đăng ký.
* Đăng nhập.

Không thể:

* Mua hàng.
* Nạp tiền.
* Xem lịch sử đơn.
* Gửi bảo hành.

## 4.2. User

Khách hàng đã đăng nhập.

Có thể:

* Mua hàng.
* Thanh toán.
* Nạp ví.
* Xem đơn hàng.
* Xem thông tin đã giao.
* Gửi yêu cầu hỗ trợ/bảo hành.

## 4.3. Admin

Nhân sự vận hành shop.

Có thể:

* Quản lý sản phẩm.
* Quản lý nguồn hàng.
* Quản lý kho.
* Xử lý đơn.
* Gắn account/key.
* Gửi email giao hàng.
* Xử lý bảo hành.
* Quản lý user.
* Xem log.

## 4.4. Super Admin

Chủ shop.

Có toàn quyền, thêm:

* Quản lý admin.
* Cấu hình hệ thống.
* Cấu hình payment.
* Cấu hình email.
* Cấu hình storage.
* Xem toàn bộ audit log.
* Xem báo cáo doanh thu/lợi nhuận.

---

# 5. Hình thức sản phẩm

Website hỗ trợ 3 hình thức bán chính.

## 5.1. Nâng cấp chính chủ tài khoản khách

Khách cung cấp thông tin cần thiết để shop nâng cấp trên tài khoản của khách.

Ví dụ:

* Email tài khoản khách.
* Username.
* Mã invite.
* Thông tin active.
* OTP nếu cần.
* Ghi chú bổ sung.

Fulfillment type:

```txt
CUSTOMER_ACCOUNT_UPGRADE
```

## 5.2. Cấp tài khoản sử dụng

Shop cấp account cho khách dùng.

Có 2 loại:

### Account riêng

Một account cấp cho một khách.

Fulfillment type:

```txt
DEDICATED_ACCOUNT
```

### Account dùng chung

Một account có thể cấp cho nhiều khách theo slot.

Fulfillment type:

```txt
SHARED_ACCOUNT
```

Ví dụ:

```txt
Netflix Account A
max_slots = 5
used_slots = 3
còn 2 slot
```

## 5.3. Cấp key/license

Shop cấp key/code/license để khách tự kích hoạt.

Fulfillment type:

```txt
LICENSE_KEY
```

## 5.4. Giao thủ công

Dùng cho các trường hợp không thuộc account/key/nâng chính chủ hoặc admin cần nhập nội dung giao hàng riêng.

Fulfillment type:

```txt
MANUAL_DELIVERY
```

---

# 6. Quản lý nguồn hàng

## 6.1. Nguyên tắc thiết kế

Nguồn hàng được quản lý thống nhất qua bảng:

```txt
supply_sources
```

Hệ thống **không tách cứng** nguồn tự cấp, nguồn ngoài hay kho nhập sẵn.

Mọi nguồn đều là một record trong `supply_sources`.

Ví dụ:

```txt
Cynex
Gamikey
Seller A Telegram
Seller B Discord
Website X
Nguồn nội bộ khác
```

Trong đó:

* `Cynex` có thể là nguồn tự cấp của shop.
* `Gamikey` có thể là nguồn nhập ngoài.
* Seller Telegram/Discord/web cũng là nguồn nhập ngoài.
* Khi nhập account/key vào kho, admin chọn nguồn tương ứng.
* Khi đơn cần đi lấy hàng mới, admin tạo `source_order` gắn với nguồn tương ứng.
* Khi có bảo hành/lỗi, hệ thống có thể truy ngược về nguồn.

## 6.2. Vì sao không dùng `sourcing_type`

Không dùng các enum cứng như:

```txt
SELF_SUPPLIED
SUPPLIER_ORDER
INVENTORY_STOCK
```

Lý do:

* Đa số hàng đều lấy từ nguồn về bán lại.
* Nguồn nhập sẵn cũng là nguồn bên ngoài.
* Nguồn tự cấp như Cynex chỉ cần là một nguồn trong danh sách.
* Vận hành thực tế chỉ cần biết hàng đến từ nguồn nào, giá vốn bao nhiêu, bảo hành thế nào, liên quan tới đơn/kho nào.
* Cách gom chung giúp thống kê lỗi, lợi nhuận, bảo hành theo nguồn dễ hơn.

## 6.3. Supply source fields

Bảng:

```txt
supply_sources
```

Fields:

```txt
id
name
slug
contact_name
contact_channel
contact_url
website_url
telegram_username
discord_username
email
phone
default_warranty_days
warranty_policy
notes
rating
status
created_at
updated_at
```

Contact channel:

```txt
internal
telegram
discord
website
facebook
email
phone
other
```

Status:

```txt
active
inactive
blocked
archived
```

Ví dụ record:

```txt
name: Cynex
contact_channel: internal
default_warranty_days: 30
notes: Nguồn tự cung cấp / vận hành nội bộ
status: active
```

```txt
name: Gamikey
contact_channel: website
website_url: https://...
default_warranty_days: 30
status: active
```

```txt
name: Seller A
contact_channel: telegram
telegram_username: @seller_a
default_warranty_days: 7
status: active
```

## 6.4. Link nguồn với các bảng khác

Các bảng cần có `source_id`:

```txt
product_variants.default_source_id
inventory_accounts.source_id
inventory_keys.source_id
source_orders.source_id
warranty_cases.source_id
```

Ý nghĩa:

* `product_variants.default_source_id`: nguồn mặc định/gợi ý cho gói bán.
* `inventory_accounts.source_id`: account này nhập từ nguồn nào.
* `inventory_keys.source_id`: key này nhập từ nguồn nào.
* `source_orders.source_id`: đơn lấy hàng này order từ nguồn nào.
* `warranty_cases.source_id`: case bảo hành liên quan nguồn nào.

---

# 7. Product và variant

## 7.1. Product

Product là sản phẩm/app chính.

Ví dụ:

```txt
Spotify
Netflix
Canva
YouTube Premium
CapCut Pro
ChatGPT Plus
```

Fields:

```txt
id
category_id
name
slug
short_description
description
image_file_id
status
sort_order
created_at
updated_at
```

Status:

```txt
draft
active
inactive
archived
```

## 7.2. Product variant

Variant là gói bán cụ thể của một sản phẩm.

Ví dụ:

```txt
Spotify Premium - Acc dùng chung - 1 tháng
Spotify Premium - Acc riêng - 1 tháng
Canva Pro - Nâng chính chủ - 1 năm
Netflix - Key active - 3 tháng
```

Fields:

```txt
id
product_id
name
slug
price
cost_estimate
duration_days
fulfillment_type
default_source_id
warranty_days
estimated_delivery_minutes
requires_customer_input
customer_input_schema
status
created_at
updated_at
```

Fulfillment type:

```txt
CUSTOMER_ACCOUNT_UPGRADE
DEDICATED_ACCOUNT
SHARED_ACCOUNT
LICENSE_KEY
MANUAL_DELIVERY
```

Status:

```txt
active
inactive
out_of_stock
archived
```

Business rules:

* Variant phải thuộc một product.
* Variant có thể có `default_source_id`, nhưng không bắt buộc.
* `default_source_id` chỉ là gợi ý, admin vẫn có thể chọn nguồn khác khi nhập kho hoặc xử lý đơn.
* Variant `inactive` không hiển thị cho khách.
* Variant `out_of_stock` có thể hiển thị nhưng không cho mua, tùy cấu hình.

---

# 8. Trạng thái hệ thống

## 8.1. Payment status

```txt
pending
paid
failed
cancelled
refunded
```

Ý nghĩa:

* `pending`: Chưa thanh toán.
* `paid`: Đã thanh toán.
* `failed`: Thanh toán thất bại.
* `cancelled`: Đã hủy.
* `refunded`: Đã hoàn tiền.

## 8.2. Fulfillment status

```txt
waiting_payment
paid_waiting_admin
processing
assigned
delivered
failed
cancelled
refunded
```

Ý nghĩa:

* `waiting_payment`: Chờ thanh toán.
* `paid_waiting_admin`: Đã thanh toán, chờ admin xử lý.
* `processing`: Admin đang xử lý.
* `assigned`: Admin đã gắn account/key/nội dung giao hàng.
* `delivered`: Đã gửi thông tin giao hàng cho khách.
* `failed`: Không thể xử lý.
* `cancelled`: Đã hủy.
* `refunded`: Đã hoàn tiền.

## 8.3. Inventory account status

```txt
available
assigned
delivered
full
replaced
disabled
expired
```

## 8.4. Inventory key status

```txt
available
assigned
delivered
invalid
replaced
refunded
```

## 8.5. Source order status

```txt
not_ordered
ordered
waiting_source
source_delivered
source_failed
claimed_warranty
cancelled
```

## 8.6. Warranty case status

```txt
open
waiting_admin
waiting_customer
processing
resolved
rejected
closed
```

---

# 9. User feature requirements

## 9.1. Auth

User có thể:

* Đăng ký bằng email/password.
* Đăng nhập.
* Đăng xuất.
* Quên mật khẩu.
* Reset mật khẩu.
* Đổi mật khẩu.

Acceptance criteria:

* Email không được trùng.
* Password phải hash.
* Login có rate limit.
* Lỗi login không tiết lộ email có tồn tại hay không.
* User thường không thể truy cập admin.

## 9.2. Xem sản phẩm

User/guest có thể:

* Xem danh sách sản phẩm.
* Xem chi tiết sản phẩm.
* Xem variant/gói bán.
* Xem giá.
* Xem thời hạn.
* Xem bảo hành.
* Xem thời gian xử lý dự kiến.
* Xem hình thức bán.

Mỗi variant cần hiển thị:

```txt
Tên gói
Giá
Thời hạn
Hình thức nhận hàng
Thời gian xử lý dự kiến
Bảo hành
Mô tả ngắn
Trạng thái còn bán
```

## 9.3. Mua ngay

MVP ưu tiên **Mua ngay**, chưa cần giỏ hàng phức tạp.

Flow:

```txt
User chọn variant
→ Bấm Mua ngay
→ Hệ thống kiểm tra đăng nhập
→ User nhập thông tin cần thiết nếu variant yêu cầu
→ Tạo order
→ User chọn phương thức thanh toán
```

Phương thức thanh toán:

```txt
payOS
wallet
```

## 9.4. Thanh toán qua payOS

Flow:

```txt
User tạo đơn
→ Chọn thanh toán payOS
→ Hệ thống tạo payment request
→ User thanh toán
→ payOS gửi webhook
→ Hệ thống verify webhook
→ Order payment_status = paid
→ Order fulfillment_status = paid_waiting_admin
→ Gửi email xác nhận thanh toán
```

Business rules:

* Webhook phải idempotent.
* Không xử lý trùng webhook.
* Không chuyển đơn sang paid nếu webhook không hợp lệ.
* Không gửi email xác nhận thanh toán nhiều lần cho cùng một payment.

## 9.5. Ví tiền

User có thể:

* Xem số dư ví.
* Nạp tiền qua payOS.
* Xem lịch sử giao dịch ví.
* Thanh toán đơn bằng ví.

Wallet transaction types:

```txt
deposit
purchase
refund
admin_adjustment
```

Business rules:

* Không cho số dư âm.
* Không sửa balance trực tiếp.
* Mọi thay đổi ví phải tạo `wallet_transactions`.
* Thanh toán bằng ví phải nằm trong database transaction.

## 9.6. Lịch sử đơn hàng

User có thể:

* Xem danh sách đơn.
* Xem chi tiết đơn.
* Xem trạng thái thanh toán.
* Xem trạng thái xử lý.
* Xem thông tin đã giao khi đơn `delivered`.
* Gửi yêu cầu hỗ trợ/bảo hành từ đơn.

User-facing status:

```txt
Chờ thanh toán
Đã thanh toán - chờ xử lý
Đang xử lý
Đã sẵn sàng
Đã giao hàng
Đã hủy
Đã hoàn tiền
```

## 9.7. Xem thông tin đã giao

Sau khi admin gửi hàng, user có thể vào chi tiết đơn để xem:

* Account.
* Password.
* Key/license.
* Hướng dẫn sử dụng.
* Ghi chú.
* Ngày hết hạn.
* Chính sách bảo hành.

Business rules:

* User chỉ xem được thông tin của đơn thuộc về mình.
* Chỉ xem được khi fulfillment status là `delivered`.
* Credential trả về API phải được kiểm soát quyền chặt chẽ.
* Khi user xem secret, có thể ghi audit log hoặc access log.

## 9.8. Yêu cầu hỗ trợ/bảo hành

User có thể tạo case bảo hành từ đơn hàng.

Fields:

```txt
order_id
order_item_id
reason
message
attachments
```

Reason:

```txt
cannot_login
wrong_password
key_invalid
premium_missing
account_limited
need_instruction
other
```

---

# 10. Admin feature requirements

## 10.1. Admin auth

Admin có site riêng.

Admin có thể:

* Login.
* Logout.
* Đổi mật khẩu.

Business rules:

* User thường không dùng được admin API.
* Admin login có rate limit.
* Nên hỗ trợ 2FA ở phase sau.
* Admin action quan trọng phải ghi audit log.

## 10.2. Dashboard

Dashboard hiển thị:

* Đơn chờ xử lý.
* Đơn đang xử lý.
* Đơn đã giao hôm nay.
* Doanh thu hôm nay.
* Doanh thu 7 ngày.
* User mới hôm nay.
* Account available.
* Key available.
* Account shared còn slot.
* Warranty case đang mở.
* Nguồn hàng có nhiều lỗi.
* Đơn chờ xử lý quá lâu.

## 10.3. Quản lý sản phẩm

Admin có thể:

* Tạo sản phẩm.
* Sửa sản phẩm.
* Ẩn/hiện sản phẩm.
* Upload ảnh sản phẩm.
* Sắp xếp sản phẩm.
* Gắn danh mục.

## 10.4. Quản lý variant/gói bán

Admin có thể:

* Tạo variant.
* Sửa giá.
* Sửa thời hạn.
* Sửa fulfillment type.
* Chọn nguồn mặc định.
* Sửa bảo hành.
* Sửa thời gian xử lý dự kiến.
* Bật/tắt bán.
* Cấu hình form thông tin khách cần nhập.

## 10.5. Quản lý nguồn hàng

Admin có thể:

* Tạo nguồn hàng.
* Sửa nguồn hàng.
* Ghi chú kênh liên hệ.
* Lưu link Telegram/Discord/web.
* Cấu hình số ngày bảo hành mặc định.
* Bật/tắt nguồn.
* Xem account/key/source order/warranty liên quan tới nguồn.

Nguồn hàng ví dụ:

```txt
Cynex
Gamikey
Seller A Telegram
Seller B Discord
Website X
```

Admin menu:

```txt
Nguồn hàng
Đơn nguồn hàng
```

Code/table:

```txt
supply_sources
source_orders
```

## 10.6. Quản lý đơn nguồn hàng

Dùng khi khách đã thanh toán nhưng shop cần đi lấy hàng từ nguồn.

Bảng:

```txt
source_orders
```

Fields:

```txt
id
source_id
order_id
order_item_id
external_ref
cost
status
source_payload_encrypted
proof_file_id
note
ordered_at
delivered_at
created_at
updated_at
```

Admin có thể:

* Tạo source order từ đơn khách.
* Chọn nguồn hàng.
* Nhập giá vốn.
* Nhập mã giao dịch/link tham chiếu.
* Upload proof.
* Cập nhật trạng thái.
* Nhập dữ liệu nguồn giao.
* Gắn dữ liệu đó vào order fulfillment.

Flow:

```txt
Admin mở đơn paid_waiting_admin
→ Chọn tạo source order
→ Chọn nguồn Cynex/Gamikey/Seller...
→ Nhập cost/external_ref/note
→ Status = ordered hoặc waiting_source
→ Khi nguồn giao hàng, admin cập nhật source_delivered
→ Admin gắn account/key/nội dung vào đơn khách
→ Gửi email giao hàng
```

## 10.7. Quản lý kho account

Bảng:

```txt
inventory_accounts
```

Fields:

```txt
id
product_variant_id
source_id
username
password_encrypted
recovery_info_encrypted
note_encrypted
public_note
account_type
max_slots
used_slots
expires_at
cost
source_ref
status
created_at
updated_at
```

Account type:

```txt
dedicated
shared
```

Admin có thể:

* Thêm account.
* Import account.
* Chọn variant.
* Chọn nguồn hàng.
* Nhập giá vốn.
* Nhập hạn account.
* Cập nhật trạng thái.
* Xem account đang gắn với đơn nào.
* Xem các khách đang dùng account shared.

Business rules:

* Password/recovery/note nhạy cảm phải mã hóa.
* Account `delivered`, `disabled`, `expired` không gắn cho đơn mới.
* Account shared chỉ gắn được khi `used_slots < max_slots`.
* Khi admin xem password, ghi audit log.

## 10.8. Quản lý kho key/license

Bảng:

```txt
inventory_keys
```

Fields:

```txt
id
product_variant_id
source_id
key_encrypted
public_note
cost
source_ref
status
sold_order_item_id
delivered_at
warranty_until
created_at
updated_at
```

Admin có thể:

* Thêm key.
* Import nhiều key.
* Chọn variant.
* Chọn nguồn hàng.
* Nhập giá vốn.
* Cập nhật trạng thái.
* Xem key đã bán cho đơn nào.
* Đổi key khi bảo hành.

Business rules:

* Key phải mã hóa.
* Key chỉ gắn được khi status = `available`.
* Sau khi gắn: `assigned`.
* Sau khi gửi email thành công: `delivered`.
* Khi admin xem key, ghi audit log.

## 10.9. Quản lý account dùng chung

Bảng:

```txt
account_allocations
```

Fields:

```txt
id
inventory_account_id
user_id
order_item_id
starts_at
ends_at
status
created_at
updated_at
```

Status:

```txt
active
expired
replaced
cancelled
```

Business rules:

* Một order item chỉ có một active allocation.
* Không vượt `max_slots`.
* Allocation phải có ngày bắt đầu/kết thúc.
* Khi đổi account bảo hành, allocation cũ chuyển `replaced`.

## 10.10. Quản lý đơn hàng

Admin có thể:

* Xem danh sách đơn.
* Filter theo trạng thái thanh toán.
* Filter theo trạng thái xử lý.
* Filter theo sản phẩm.
* Filter theo user.
* Filter theo nguồn hàng liên quan.
* Xem chi tiết đơn.
* Đánh dấu đang xử lý.
* Gắn account.
* Gắn key.
* Nhập nội dung giao thủ công.
* Preview email.
* Gửi email giao hàng.
* Hoàn tiền.
* Tạo warranty case.

Bảng:

```txt
orders
order_items
order_fulfillments
```

Order fields:

```txt
id
order_code
user_id
total_amount
payment_status
fulfillment_status
payment_method
paid_at
delivered_at
created_at
updated_at
```

Order item fields:

```txt
id
order_id
product_id
product_variant_id
quantity
unit_price
total_price
fulfillment_type
customer_input
status
```

Order fulfillment fields:

```txt
id
order_item_id
fulfillment_type
status
inventory_account_id
inventory_key_id
account_allocation_id
source_order_id
manual_note
delivered_message_encrypted
delivered_at
delivered_by_admin_id
email_sent_at
email_sent_by_admin_id
created_at
updated_at
```

## 10.11. Admin xử lý đơn account riêng

Flow:

```txt
Admin mở đơn
→ Mark processing
→ Chọn account available đúng variant
→ Hệ thống gắn account vào order_fulfillment
→ Account status = assigned
→ Fulfillment status = assigned
→ Admin preview email
→ Admin gửi email giao hàng
→ Email gửi thành công
→ Account status = delivered
→ Fulfillment status = delivered
→ Order delivered_at được set
```

Acceptance criteria:

* Không gắn được account sai variant.
* Không gắn được account đã assigned/delivered.
* Không gắn được account disabled/expired.
* Gắn account phải nằm trong database transaction.
* Mọi thao tác gắn account ghi audit log.

## 10.12. Admin xử lý đơn account dùng chung

Flow:

```txt
Admin mở đơn
→ Chọn account shared còn slot
→ Hệ thống tạo account_allocation
→ used_slots tăng 1
→ Nếu used_slots = max_slots, account status = full
→ Preview email
→ Gửi email giao hàng
→ Đơn delivered
```

## 10.13. Admin xử lý đơn key/license

Flow:

```txt
Admin mở đơn
→ Chọn key available đúng variant
→ Gắn key vào order_fulfillment
→ Key status = assigned
→ Preview email
→ Gửi email giao hàng
→ Key status = delivered
→ Đơn delivered
```

## 10.14. Admin xử lý đơn nâng cấp chính chủ

Flow:

```txt
Admin mở đơn
→ Xem thông tin khách nhập
→ Tự xử lý hoặc tạo source_order
→ Khi xử lý xong, nhập kết quả
→ Preview email hoàn tất
→ Gửi email
→ Đơn delivered
```

Trường hợp cần thêm thông tin:

```txt
Admin chuyển trạng thái waiting_customer
→ Gửi yêu cầu bổ sung thông tin
→ User bổ sung
→ Admin tiếp tục xử lý
```

## 10.15. Quản lý user

Admin có thể:

* Xem danh sách user.
* Xem chi tiết user.
* Xem đơn hàng của user.
* Xem lịch sử ví.
* Khóa/mở khóa user.
* Cộng/trừ tiền ví bằng transaction.

Business rules:

* Không sửa thẳng `wallet_balance`.
* Mọi thay đổi ví phải tạo `wallet_transactions`.
* Admin adjustment phải ghi audit log.

## 10.16. Quản lý bảo hành

Admin có thể:

* Xem warranty case.
* Phản hồi user.
* Đổi account.
* Đổi key.
* Hoàn tiền.
* Gắn lỗi với nguồn hàng.
* Gắn lỗi với source order.
* Đóng case.

Bảng:

```txt
warranty_cases
warranty_messages
```

Warranty case fields:

```txt
id
user_id
order_id
order_item_id
source_id
source_order_id
inventory_account_id
inventory_key_id
reason
status
admin_note
created_at
updated_at
closed_at
```

---

# 11. Email requirements

## 11.1. Email xác nhận thanh toán

Trigger:

* payOS payment thành công.
* Thanh toán bằng ví thành công.

Subject:

```txt
Thanh toán đơn hàng #{order_code} đã được xác nhận
```

Nội dung:

* Tên khách.
* Mã đơn.
* Sản phẩm/gói.
* Tổng tiền.
* Trạng thái: Đã thanh toán, đang chờ xử lý.
* Thời gian xử lý dự kiến.
* Link xem đơn.

## 11.2. Email nạp tiền thành công

Trigger:

* payOS webhook xác nhận nạp tiền thành công.

Nội dung:

* Số tiền nạp.
* Số dư sau nạp.
* Mã giao dịch.
* Thời gian nạp.

## 11.3. Email giao hàng

Trigger:

* Admin đã gắn account/key/nội dung giao hàng.
* Admin bấm gửi email giao hàng.

Mode khuyến nghị:

```txt
Email chỉ thông báo đơn đã sẵn sàng và có link vào website để xem thông tin.
```

Ví dụ:

```txt
Đơn hàng #{order_code} của bạn đã sẵn sàng.
Vui lòng đăng nhập website để xem thông tin sử dụng.
```

Mode tùy chọn:

```txt
Gửi trực tiếp account/key trong email.
```

Business rules khi gửi trực tiếp credential:

* Phải có preview.
* Phải log email.
* Phải audit admin gửi.
* Chỉ admin có quyền mới được gửi.
* Gửi lại email phải confirm.
* Không gửi recovery info nếu không cần.

## 11.4. Email hoàn tiền

Trigger:

* Admin hoàn tiền đơn hàng vào ví.

Nội dung:

* Mã đơn.
* Số tiền hoàn.
* Lý do.
* Số dư mới.

## 11.5. Email log

Bảng:

```txt
email_logs
```

Fields:

```txt
id
user_id
order_id
type
to_email
subject
body_snapshot
status
provider_message_id
error_message
sent_by_admin_id
sent_at
created_at
```

Email type:

```txt
verify_email
reset_password
payment_confirmed
wallet_deposit_confirmed
delivery
refund
warranty_update
```

Status:

```txt
queued
sent
failed
cancelled
```

---

# 12. Payment requirements

## 12.1. payOS

Dùng cho:

* Thanh toán đơn hàng.
* Nạp ví.

## 12.2. Payment fields

Bảng:

```txt
payments
```

Fields:

```txt
id
payment_code
order_id
user_id
amount
provider
provider_payment_id
provider_transaction_id
status
checkout_url
qr_code
raw_webhook_payload
paid_at
expired_at
created_at
updated_at
```

Provider:

```txt
payos
wallet
manual
```

## 12.3. Webhook rules

* Verify chữ ký webhook.
* Chỉ xử lý webhook hợp lệ.
* Idempotency theo `provider_transaction_id` hoặc `payment_code`.
* Log toàn bộ raw payload.
* Không xử lý lại payment đã paid.
* Không tạo duplicate wallet transaction.
* Không gửi duplicate email.

---

# 13. Wallet requirements

## 13.1. Wallet balance

Có thể lưu `wallet_balance` trên user để truy vấn nhanh, nhưng mọi thay đổi phải qua `wallet_transactions`.

## 13.2. Wallet transaction

Bảng:

```txt
wallet_transactions
```

Fields:

```txt
id
user_id
type
amount
balance_before
balance_after
reference_type
reference_id
description
created_by_admin_id
created_at
```

Type:

```txt
deposit
purchase
refund
admin_adjustment
```

Business rules:

* Không cho balance âm.
* Không sửa balance trực tiếp.
* Transaction ví và order/payment phải atomic.
* Refund đơn phải tạo wallet transaction.
* Admin adjustment phải có lý do.

---

# 14. Storage requirements

## 14.1. PostgreSQL

Lưu:

* Dữ liệu nghiệp vụ.
* Metadata file.
* Credential đã mã hóa.
* Key/license đã mã hóa.
* Log.
* Trạng thái hệ thống.

## 14.2. Cloudflare R2

Lưu:

* Ảnh sản phẩm.
* Banner.
* Proof nguồn hàng.
* Ảnh lỗi bảo hành.
* File hướng dẫn.
* Attachment.

## 14.3. File metadata

Bảng:

```txt
files
```

Fields:

```txt
id
owner_type
owner_id
file_name
mime_type
size
storage_driver
storage_bucket
storage_key
public_url
uploaded_by_user_id
uploaded_by_admin_id
created_at
```

Business rules:

* File thật nằm ở R2.
* PostgreSQL chỉ lưu metadata.
* Không lưu credential trong R2.
* Không lưu file lớn trực tiếp trong PostgreSQL.

---

# 15. Security requirements

## 15.1. Authentication

User:

* Email/password.
* Password hash.
* Forgot/reset password.
* Rate limit login/register.

Admin:

* Site login riêng.
* Rate limit.
* Session/JWT an toàn.
* 2FA ở phase sau.

## 15.2. Authorization

* User chỉ xem dữ liệu của chính mình.
* User không truy cập admin API.
* Admin mới truy cập admin resources.
* API backend phải check quyền, không chỉ ẩn UI.

## 15.3. Sensitive data encryption

Các field cần mã hóa:

```txt
inventory_accounts.password_encrypted
inventory_accounts.recovery_info_encrypted
inventory_accounts.note_encrypted
inventory_keys.key_encrypted
source_orders.source_payload_encrypted
order_fulfillments.delivered_message_encrypted
```

Business rules:

* Không log secret.
* Không expose secret không cần thiết.
* Admin xem secret phải audit.
* User chỉ xem secret khi đơn thuộc về mình và đã delivered.

## 15.4. Audit log

Bảng:

```txt
audit_logs
```

Fields:

```txt
id
actor_type
actor_id
action
target_type
target_id
metadata
ip_address
user_agent
created_at
```

Action cần log:

```txt
ADMIN_LOGIN
ADMIN_VIEW_SECRET
ADMIN_CREATE_PRODUCT
ADMIN_UPDATE_PRODUCT
ADMIN_CREATE_VARIANT
ADMIN_UPDATE_VARIANT
ADMIN_CREATE_SOURCE
ADMIN_UPDATE_SOURCE
ADMIN_CREATE_SOURCE_ORDER
ADMIN_UPDATE_SOURCE_ORDER
ADMIN_CREATE_INVENTORY_ACCOUNT
ADMIN_UPDATE_INVENTORY_ACCOUNT
ADMIN_ASSIGN_ACCOUNT
ADMIN_ASSIGN_KEY
ADMIN_SEND_DELIVERY_EMAIL
ADMIN_REFUND_ORDER
ADMIN_ADJUST_WALLET
ADMIN_UPDATE_WARRANTY_CASE
```

---

# 16. API requirements cấp cao

## 16.1. Public API

```txt
GET /products
GET /products/:slug
GET /categories
```

## 16.2. User API

```txt
POST /auth/register
POST /auth/login
POST /auth/logout
POST /auth/forgot-password
POST /auth/reset-password

GET /me

GET /wallet
GET /wallet/transactions
POST /wallet/deposit

POST /orders
GET /orders
GET /orders/:orderCode
POST /orders/:orderCode/pay
POST /orders/:orderCode/pay-wallet

POST /warranty-cases
GET /warranty-cases
GET /warranty-cases/:id
```

## 16.3. Admin API

```txt
POST /admin/auth/login
POST /admin/auth/logout

GET /admin/dashboard

GET /admin/products
POST /admin/products
PATCH /admin/products/:id
DELETE /admin/products/:id

GET /admin/product-variants
POST /admin/product-variants
PATCH /admin/product-variants/:id

GET /admin/supply-sources
POST /admin/supply-sources
PATCH /admin/supply-sources/:id

GET /admin/source-orders
POST /admin/source-orders
PATCH /admin/source-orders/:id

GET /admin/orders
GET /admin/orders/:id
POST /admin/orders/:id/mark-processing
POST /admin/orders/:id/assign-account
POST /admin/orders/:id/assign-key
POST /admin/orders/:id/manual-fulfillment
POST /admin/orders/:id/preview-delivery-email
POST /admin/orders/:id/send-delivery-email
POST /admin/orders/:id/refund

GET /admin/inventory/accounts
POST /admin/inventory/accounts
PATCH /admin/inventory/accounts/:id

GET /admin/inventory/keys
POST /admin/inventory/keys
PATCH /admin/inventory/keys/:id

GET /admin/users
GET /admin/users/:id
POST /admin/users/:id/wallet-adjustment

GET /admin/warranty-cases
PATCH /admin/warranty-cases/:id

GET /admin/email-logs
GET /admin/audit-logs
```

## 16.4. Webhook API

```txt
POST /webhooks/payos
```

---

# 17. Data model tổng quan

## 17.1. Core

```txt
users
admins
categories
products
product_variants
orders
order_items
payments
wallet_transactions
```

## 17.2. Source

```txt
supply_sources
source_orders
```

## 17.3. Inventory

```txt
inventory_accounts
account_allocations
inventory_keys
```

## 17.4. Fulfillment

```txt
order_fulfillments
```

## 17.5. Support/logs/settings

```txt
warranty_cases
warranty_messages
files
email_logs
audit_logs
settings
```

---

# 18. Business rules quan trọng

## 18.1. Đơn hàng

* Đơn chưa thanh toán không được giao hàng.
* Đơn đã paid mới vào danh sách chờ admin xử lý.
* Đơn delivered không được gắn lại account/key nếu không qua flow bảo hành.
* Mỗi order item phải có fulfillment record.
* Gửi email thành công mới chuyển delivered.

## 18.2. Nguồn hàng

* Mọi account/key/source order đều có thể gắn với `source_id`.
* `Cynex` cũng là một source.
* Không cần phân biệt cứng tự cấp hay nguồn ngoài.
* Nguồn mặc định nằm ở variant chỉ để gợi ý.
* Báo cáo lỗi/lợi nhuận/bảo hành dựa trên source.

## 18.3. Kho account/key

* Không được gắn item sai variant.
* Không được gắn item đã delivered.
* Không được gắn account expired/disabled.
* Account shared không vượt max slot.
* Gắn account/key phải trong database transaction.
* Sau khi gắn: status = assigned.
* Sau khi gửi email thành công: status = delivered.

## 18.4. Ví

* Không cho balance âm.
* Không sửa balance trực tiếp.
* Mọi thay đổi tiền phải có wallet transaction.
* Refund đơn phải tạo wallet transaction.

## 18.5. Email

* Email xác nhận thanh toán gửi tự động.
* Email giao hàng chỉ gửi sau khi admin gắn fulfillment.
* Email giao hàng phải có preview.
* Gửi email lỗi thì đơn vẫn ở trạng thái assigned.
* Email log phải lưu kết quả gửi.

## 18.6. Payment

* payOS webhook phải verify.
* Webhook phải idempotent.
* Không tạo duplicate payment.
* Không cộng ví/trừ ví lặp lại.
* Không gửi email lặp lại.

## 18.7. Security

* Credential/key phải encrypted.
* Admin xem credential/key phải audit.
* User chỉ xem credential của đơn đã delivered và thuộc về mình.
* Không expose secret trong logs.

---

# 19. Non-functional requirements

## 19.1. Performance

MVP target:

* Trang sản phẩm tải dưới 2 giây.
* API product list dưới 500ms trong điều kiện bình thường.
* Admin list dùng pagination.
* Không load toàn bộ order/inventory một lần.

## 19.2. Backup

* PostgreSQL backup hằng ngày.
* Giữ backup ít nhất 7 ngày.
* R2 lưu file.
* Có quy trình restore database.
* Không lưu file lớn trong PostgreSQL.

## 19.3. Logging/monitoring

Cần log:

* API error.
* Payment webhook.
* Email result.
* Queue job failed.
* Admin sensitive action.

Nên dùng:

```txt
Sentry
Docker logs
Health check endpoint
```

## 19.4. Queue

Các job chính:

```txt
send-payment-confirmed-email
send-wallet-deposit-email
send-delivery-email
send-refund-email
process-payment-webhook
notify-admin-pending-order
daily-stock-alert
```

---

# 20. Acceptance criteria MVP

## 20.1. User

MVP đạt khi user có thể:

* Đăng ký/đăng nhập.
* Xem sản phẩm.
* Xem variant.
* Tạo đơn.
* Thanh toán qua payOS.
* Nạp ví qua payOS.
* Thanh toán bằng ví.
* Nhận email xác nhận thanh toán.
* Xem trạng thái đơn.
* Xem thông tin đã giao sau khi admin gửi hàng.
* Tạo yêu cầu bảo hành.

## 20.2. Admin

MVP đạt khi admin có thể:

* Login admin.
* Tạo/sửa sản phẩm.
* Tạo/sửa variant.
* Tạo/sửa nguồn hàng.
* Tạo source order.
* Thêm account/key vào kho.
* Chọn nguồn khi nhập account/key.
* Xem đơn đã thanh toán chờ xử lý.
* Gắn account/key/nội dung giao hàng vào đơn.
* Preview email giao hàng.
* Gửi email giao hàng.
* Xem email log.
* Xem audit log.
* Cộng/trừ ví bằng transaction.
* Xử lý bảo hành cơ bản.

## 20.3. System

MVP đạt khi hệ thống:

* Xử lý webhook payOS đúng.
* Không xử lý duplicate webhook.
* Không gắn trùng account/key.
* Không cho user xem đơn của người khác.
* Không cho user truy cập admin API.
* Mã hóa credential/key.
* Lưu file lên R2.
* Lưu metadata file vào PostgreSQL.
* Gửi email qua Resend.
* Chạy được bằng Docker/Coolify trên VPS.

---

# 21. Roadmap triển khai

## Phase 0 — Setup nền tảng

* Setup monorepo pnpm + Turborepo.
* Setup Docker Compose.
* Setup Next.js web.
* Setup React Admin.
* Setup NestJS API.
* Setup PostgreSQL.
* Setup Prisma.
* Setup Redis.
* Setup BullMQ worker.
* Setup env/config.
* Setup Coolify deploy.

## Phase 1 — Core commerce

* User auth.
* Product/category.
* Product variant.
* Product detail.
* Order creation.
* payOS payment.
* Webhook payment.
* Email xác nhận thanh toán.
* User order history.

## Phase 2 — Wallet

* Wallet balance.
* Wallet transaction.
* Nạp tiền.
* Thanh toán bằng ví.
* Admin adjustment.
* Refund vào ví.

## Phase 3 — Source & inventory

* Supply sources.
* Source orders.
* Inventory account.
* Inventory key.
* Shared account slot.
* Link source với account/key/order.

## Phase 4 — Manual fulfillment

* Order fulfillment.
* Admin assign account.
* Admin assign key.
* Manual fulfillment note.
* Preview email.
* Send delivery email.
* User xem thông tin đã giao.

## Phase 5 — Warranty/log/security

* Warranty case.
* Warranty message.
* Replace account/key.
* Email log.
* Audit log.
* Sensitive data encryption.
* Sentry.
* Backup.
* Stock alert.

---

# 22. Metrics cần theo dõi

## 22.1. Business metrics

* Tổng đơn.
* Tổng doanh thu.
* Doanh thu theo ngày.
* Số đơn paid_waiting_admin.
* Số đơn delivered.
* Thời gian xử lý trung bình.
* Tỷ lệ hoàn tiền.
* Tỷ lệ bảo hành.
* Lợi nhuận ước tính theo variant.
* Lợi nhuận ước tính theo nguồn.

## 22.2. Source metrics

* Doanh thu theo nguồn.
* Giá vốn theo nguồn.
* Lợi nhuận theo nguồn.
* Số lỗi theo nguồn.
* Tỷ lệ bảo hành theo nguồn.
* Thời gian xử lý trung bình theo nguồn.
* Số source order đang chờ.

## 22.3. Inventory metrics

* Account available.
* Account expired.
* Account shared còn slot.
* Key available.
* Key invalid.
* Sản phẩm sắp hết kho.

## 22.4. User metrics

* User mới.
* User active.
* Tỷ lệ mua lại.
* Tổng tiền nạp ví.
* Tổng tiền thanh toán bằng ví.

---

# 23. Rủi ro và hướng xử lý

## 23.1. Rủi ro cấp trùng account/key

Giải pháp:

* Inventory status rõ ràng.
* Assign trong database transaction.
* Không giao hàng ngoài hệ thống.
* Audit log khi assign.

## 23.2. Rủi ro lỗi webhook/thanh toán

Giải pháp:

* Verify webhook.
* Idempotency.
* Log raw payload.
* Không xử lý payment paid lần hai.
* Có màn kiểm tra payment logs.

## 23.3. Rủi ro lộ credential

Giải pháp:

* Encrypt credential.
* Không log secret.
* Audit khi xem secret.
* User chỉ xem secret đơn của mình.
* Email giao hàng nên dùng link vào web thay vì gửi trực tiếp password/key.

## 23.4. Rủi ro nguồn hàng lỗi

Giải pháp:

* Quản lý `supply_sources`.
* Quản lý `source_orders`.
* Gắn warranty với source.
* Theo dõi tỷ lệ lỗi theo source.
* Có thể ngưng nguồn có nhiều lỗi.

## 23.5. Rủi ro mất dữ liệu

Giải pháp:

* Backup PostgreSQL hằng ngày.
* Dùng R2 cho file.
* Không lưu file lớn trong DB.
* Có quy trình restore.

---

# 24. Định nghĩa MVP hoàn thành

MVP hoàn thành khi vận hành được đầy đủ quy trình:

```txt
User đăng ký
→ User xem sản phẩm
→ User chọn variant
→ User thanh toán qua payOS hoặc ví
→ Hệ thống xác nhận paid
→ Hệ thống gửi email xác nhận thanh toán
→ Admin thấy đơn chờ xử lý
→ Admin chọn nguồn hàng nếu cần
→ Admin tạo source order nếu cần
→ Admin gắn account/key/nội dung giao hàng
→ Admin preview email
→ Admin gửi email giao hàng
→ User xem thông tin đã giao trong lịch sử đơn
→ User tạo bảo hành nếu có lỗi
→ Admin xử lý bảo hành
```

MVP không yêu cầu giao hàng tự động, nhưng bắt buộc các phần sau phải có log và trạng thái rõ ràng:

```txt
Thanh toán
Ví tiền
Nguồn hàng
Kho account/key
Gắn hàng vào đơn
Email giao hàng
Bảo hành
Audit admin
```
