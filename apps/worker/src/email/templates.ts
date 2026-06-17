import { config } from "../config";

function vnd(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px">
  <div style="max-width:560px;margin:auto;background:#fff;border-radius:12px;padding:32px">
    <h1 style="color:#4f46e5;font-size:20px;margin:0 0 16px">Cynex</h1>
    <h2 style="font-size:18px;margin:0 0 12px">${title}</h2>
    ${bodyHtml}
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
    <p style="color:#94a3b8;font-size:12px">Email tự động từ Cynex. Vui lòng không trả lời email này.</p>
  </div></body></html>`;
}

export function paymentConfirmedEmail(d: {
  userName?: string | null;
  orderCode: string;
  totalAmount: number;
}): { subject: string; html: string } {
  const subject = `Thanh toán đơn hàng #${d.orderCode} đã được xác nhận`;
  const html = layout("Thanh toán thành công", `
    <p>Xin chào ${d.userName ?? "bạn"},</p>
    <p>Đơn hàng <strong>#${d.orderCode}</strong> đã được thanh toán.</p>
    <p>Tổng tiền: <strong>${vnd(d.totalAmount)}</strong></p>
    <p>Trạng thái: <strong>Đã thanh toán — đang chờ xử lý.</strong></p>
    <p><a href="${config.webBaseUrl}/orders/${d.orderCode}" style="color:#4f46e5">Xem đơn hàng</a></p>
  `);
  return { subject, html };
}

export function walletDepositEmail(d: {
  amount: number;
  balanceAfter: number;
  paymentCode: string;
}): { subject: string; html: string } {
  const subject = `Nạp tiền thành công: +${vnd(d.amount)}`;
  const html = layout("Nạp tiền thành công", `
    <p>Số tiền nạp: <strong>${vnd(d.amount)}</strong></p>
    <p>Số dư hiện tại: <strong>${vnd(d.balanceAfter)}</strong></p>
    <p>Mã giao dịch: ${d.paymentCode}</p>
  `);
  return { subject, html };
}

export function resetPasswordEmail(d: { link: string }): { subject: string; html: string } {
  const subject = "Đặt lại mật khẩu Cynex";
  const html = layout("Đặt lại mật khẩu", `
    <p>Bạn vừa yêu cầu đặt lại mật khẩu. Link có hiệu lực trong 1 giờ:</p>
    <p><a href="${d.link}" style="color:#4f46e5">${d.link}</a></p>
    <p>Nếu không phải bạn, hãy bỏ qua email này.</p>
  `);
  return { subject, html };
}

export function deliveryEmail(d: { orderCode: string }): { subject: string; html: string } {
  const subject = `Đơn hàng #${d.orderCode} đã sẵn sàng`;
  const html = layout("Đơn hàng đã sẵn sàng", `
    <p>Đơn hàng <strong>#${d.orderCode}</strong> của bạn đã sẵn sàng.</p>
    <p>Vui lòng đăng nhập website để xem thông tin sử dụng.</p>
    <p><a href="${config.webBaseUrl}/orders/${d.orderCode}" style="color:#4f46e5">Xem thông tin</a></p>
  `);
  return { subject, html };
}

export function refundEmail(d: {
  orderCode: string;
  amount: number;
  reason?: string;
  balanceAfter: number;
}): { subject: string; html: string } {
  const subject = `Hoàn tiền đơn hàng #${d.orderCode}`;
  const html = layout("Hoàn tiền thành công", `
    <p>Đơn hàng <strong>#${d.orderCode}</strong> đã được hoàn tiền vào ví.</p>
    <p>Số tiền hoàn: <strong>${vnd(d.amount)}</strong></p>
    ${d.reason ? `<p>Lý do: ${d.reason}</p>` : ""}
    <p>Số dư hiện tại: <strong>${vnd(d.balanceAfter)}</strong></p>
  `);
  return { subject, html };
}
