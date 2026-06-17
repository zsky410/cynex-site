import { useEffect, useState } from "react";
import { Card, CardContent, Grid, Typography } from "@mui/material";
import { API_URL } from "./config";
import { getToken } from "./authProvider";

interface DashboardData {
  pending: number;
  processing: number;
  deliveredToday: number;
  revenue: number;
  stock: {
    accountsAvailable: number;
    keysAvailable: number;
    totalAvailable: number;
  };
}

function money(v: number): string {
  return new Intl.NumberFormat("vi-VN").format(v) + "đ";
}

function StatCard(props: { title: string; value: string | number; note?: string }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          {props.title}
        </Typography>
        <Typography variant="h4" sx={{ mt: 1 }}>
          {props.value}
        </Typography>
        {props.note ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {props.note}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/admin/dashboard`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message ?? res.statusText);
        }
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) {
    return <Typography color="error">Dashboard load failed: {error}</Typography>;
  }
  if (!data) {
    return <Typography>Loading dashboard…</Typography>;
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <StatCard title="Pending" value={data.pending} note="Đơn đã thanh toán, chờ admin xử lý" />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <StatCard title="Processing" value={data.processing} note="Đơn đang xử lý hoặc đã gán" />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <StatCard title="Delivered Today" value={data.deliveredToday} note="Đơn giao thành công hôm nay" />
      </Grid>
      <Grid item xs={12} sm={6} md={6} lg={2}>
        <StatCard title="Revenue" value={money(data.revenue)} note="Tổng doanh thu các đơn đang ở trạng thái paid" />
      </Grid>
      <Grid item xs={12} sm={6} md={6} lg={2}>
        <StatCard
          title="Stock"
          value={data.stock.totalAvailable}
          note={`Accounts: ${data.stock.accountsAvailable} · Keys: ${data.stock.keysAvailable}`}
        />
      </Grid>
    </Grid>
  );
}
