"use client";

import axios from "axios";
import { useEffect, useState, useRef } from "react";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Dialog } from 'primereact/dialog';

import ToastNotifier from "../../../components/ToastNotifier";
import HeaderBar from "../../../components/headerbar";
import CustomDataTable from "../../../components/DataTable";
import FormPembayaranTunai from "./components/FormPembayaranTunai";
import FormPembayaranOnline from "./components/FormPembayaranOnline";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function PembayaranPage() {
  const toastRef = useRef(null);
  const isMounted = useRef(true);

  const [token, setToken] = useState("");
  const [pembayaranList, setPembayaranList] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPembayaran, setSelectedPembayaran] = useState(null);
  
  // Dialog States
  const [tunaiDialogVisible, setTunaiDialogVisible] = useState(false);
  const [onlineDialogVisible, setOnlineDialogVisible] = useState(false);
  const [detailDialogVisible, setDetailDialogVisible] = useState(false);

  // Filter
  const [nisFilter, setNisFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [metodeFilter, setMetodeFilter] = useState(null);
  const [startDateFilter, setStartDateFilter] = useState(null);
  const [endDateFilter, setEndDateFilter] = useState(null);

  const [siswaOptions, setSiswaOptions] = useState([]);

  const statusOptions = [
    { label: "Pending", value: "PENDING" },
    { label: "Sukses", value: "SUKSES" },
    { label: "Gagal", value: "GAGAL" },
    { label: "Expired", value: "EXPIRED" },
  ];

  const metodeOptions = [
    { label: "Tunai", value: "TUNAI" },
    { label: "Transfer Bank", value: "TRANSFER_BANK" },
    { label: "VA BCA", value: "VA_BCA" },
    { label: "VA BNI", value: "VA_BNI" },
    { label: "VA BRI", value: "VA_BRI" },
    { label: "VA Mandiri", value: "VA_MANDIRI" },
    { label: "GoPay", value: "GOPAY" },
    { label: "OVO", value: "OVO" },
    { label: "ShopeePay", value: "SHOPEEPAY" },
    { label: "QRIS", value: "QRIS" },
    { label: "Alfamart", value: "ALFAMART" },
    { label: "Indomaret", value: "INDOMARET" },
  ];

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) {
      window.location.href = "/";
    } else {
      setToken(t);
      initializeData(t);
    }

    return () => {
      isMounted.current = false;
      toastRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeData = async (t) => {
    await fetchSiswa(t);
    await fetchPembayaran(t);
  };

  const fetchPembayaran = async (t, filters = {}) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.nis) params.append("nis", filters.nis);
      if (filters.status) params.append("status", filters.status);
      if (filters.metode_bayar) params.append("metode_bayar", filters.metode_bayar);
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);

      const res = await axios.get(`${API_URL}/pembayaran?${params.toString()}`, {
        headers: { Authorization: `Bearer ${t}` },
      });

      if (!isMounted.current) return;

      if (res.data.status === "00") {
        const data = res.data.data || [];
        data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setPembayaranList(data);
        setOriginalData(data);
      } else {
        toastRef.current?.showToast("01", res.data.message || "Gagal memuat data pembayaran");
      }
    } catch (err) {
      console.error(err);
      toastRef.current?.showToast("01", "Gagal memuat data pembayaran");
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  };

  const fetchSiswa = async (t) => {
    try {
      const res = await axios.get(`${API_URL}/siswa`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.data.status === "00") {
        const data = res.data.data || [];
        setSiswaOptions(
          data
            .filter((s) => s.STATUS === "Aktif")
            .map((s) => ({
              label: `${s.NIS} - ${s.NAMA}`,
              value: s.NIS,
            }))
        );
      }
    } catch (err) {
      console.error("Error fetch siswa:", err);
    }
  };

  // Search handler
  const handleSearch = (keyword) => {
    if (!keyword) {
      applyFiltersWithValue(nisFilter, statusFilter, metodeFilter, startDateFilter, endDateFilter);
    } else {
      let filtered = [...originalData];

      // Apply dropdown filters first
      if (nisFilter) filtered = filtered.filter((p) => p.NIS === nisFilter);
      if (statusFilter) filtered = filtered.filter((p) => p.STATUS === statusFilter);
      if (metodeFilter) filtered = filtered.filter((p) => p.METODE_BAYAR === metodeFilter);
      if (startDateFilter) {
        filtered = filtered.filter((p) => new Date(p.TGL_BAYAR) >= startDateFilter);
      }
      if (endDateFilter) {
        filtered = filtered.filter((p) => new Date(p.TGL_BAYAR) <= endDateFilter);
      }

      // Then apply search keyword
      const lowerKeyword = keyword.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.PEMBAYARAN_ID?.toLowerCase().includes(lowerKeyword) ||
          p.NOMOR_PEMBAYARAN?.toLowerCase().includes(lowerKeyword) ||
          p.NAMA_SISWA?.toLowerCase().includes(lowerKeyword) ||
          p.MIDTRANS_ORDER_ID?.toLowerCase().includes(lowerKeyword)
      );

      setPembayaranList(filtered);
    }
  };

  // Apply all filters with values
  const applyFiltersWithValue = (nis, status, metode, startDate, endDate) => {
    let filtered = [...originalData];

    if (nis) filtered = filtered.filter((p) => p.NIS === nis);
    if (status) filtered = filtered.filter((p) => p.STATUS === status);
    if (metode) filtered = filtered.filter((p) => p.METODE_BAYAR === metode);
    if (startDate) {
      filtered = filtered.filter((p) => new Date(p.TGL_BAYAR) >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((p) => new Date(p.TGL_BAYAR) <= endDate);
    }

    setPembayaranList(filtered);
  };

  // Reset all filters
  const resetFilter = () => {
    setNisFilter(null);
    setStatusFilter(null);
    setMetodeFilter(null);
    setStartDateFilter(null);
    setEndDateFilter(null);
    setPembayaranList(originalData);
  };

  const handleTunaiSubmit = async (data) => {
    try {
      const res = await axios.post(`${API_URL}/pembayaran/tunai`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.status === "00") {
        toastRef.current?.showToast("00", "Pembayaran tunai berhasil dicatat");
        await fetchPembayaran(token);
        setTunaiDialogVisible(false);
      } else {
        toastRef.current?.showToast("01", res.data.message || "Gagal mencatat pembayaran");
      }
    } catch (err) {
      console.error(err);
      toastRef.current?.showToast("01", err.response?.data?.message || "Gagal mencatat pembayaran");
    }
  };

  const handleOnlineSubmit = async (data) => {
    try {
      const res = await axios.post(`${API_URL}/pembayaran/online`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.status === "00") {
        toastRef.current?.showToast("00", "Link pembayaran berhasil dibuat");
        
        // Open Midtrans Snap in new window
        if (res.data.data.redirect_url) {
          window.open(res.data.data.redirect_url, "_blank");
        }
        
        await fetchPembayaran(token);
        setOnlineDialogVisible(false);
      } else {
        toastRef.current?.showToast("01", res.data.message || "Gagal membuat link pembayaran");
      }
    } catch (err) {
      console.error(err);
      toastRef.current?.showToast("01", err.response?.data?.message || "Gagal membuat link pembayaran");
    }
  };

  const handleViewDetail = async (rowData) => {
    try {
      const res = await axios.get(`${API_URL}/pembayaran/${rowData.PEMBAYARAN_ID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.status === "00") {
        setSelectedPembayaran(res.data.data);
        setDetailDialogVisible(true);
      } else {
        toastRef.current?.showToast("01", "Gagal memuat detail pembayaran");
      }
    } catch (err) {
      console.error(err);
      toastRef.current?.showToast("01", "Gagal memuat detail pembayaran");
    }
  };

  const handleDelete = (rowData) => {
    if (rowData.STATUS === "SUKSES") {
      toastRef.current?.showToast("01", "Tidak dapat menghapus pembayaran yang sudah sukses");
      return;
    }

    confirmDialog({
      message: `Yakin ingin menghapus pembayaran "${rowData.NOMOR_PEMBAYARAN}"?`,
      header: "Konfirmasi Hapus",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Ya",
      rejectLabel: "Batal",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await axios.delete(`${API_URL}/pembayaran/${rowData.PEMBAYARAN_ID}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          toastRef.current?.showToast("00", "Pembayaran berhasil dihapus");
          if (isMounted.current) {
            await fetchPembayaran(token);
          }
        } catch (err) {
          console.error(err);
          toastRef.current?.showToast("01", err.response?.data?.message || "Gagal menghapus pembayaran");
        }
      },
    });
  };

  const formatRupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatTanggal = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      PENDING: { label: "Pending", severity: "warning", icon: "pi-clock" },
      SUKSES: { label: "Sukses", severity: "success", icon: "pi-check-circle" },
      GAGAL: { label: "Gagal", severity: "danger", icon: "pi-times-circle" },
      EXPIRED: { label: "Expired", severity: "secondary", icon: "pi-ban" },
    };

    const config = statusMap[status] || { label: status, severity: "secondary", icon: "pi-info-circle" };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-${config.severity}-100 text-${config.severity}-700`}>
        <i className={`pi ${config.icon}`}></i>
        {config.label}
      </span>
    );
  };

  const getMetodeBadge = (metode) => {
    const colors = {
      TUNAI: "blue",
      TRANSFER_BANK: "purple",
      VA_BCA: "indigo",
      VA_BNI: "orange",
      VA_BRI: "cyan",
      VA_MANDIRI: "yellow",
      GOPAY: "green",
      OVO: "purple",
      SHOPEEPAY: "orange",
      QRIS: "pink",
      ALFAMART: "red",
      INDOMARET: "yellow",
    };

    const color = colors[metode] || "gray";
    const label = metodeOptions.find((m) => m.value === metode)?.label || metode;

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium bg-${color}-100 text-${color}-700`}>
        {label}
      </span>
    );
  };

  const pembayaranColumns = [
    { field: "id", header: "ID", style: { width: "60px" } },
    { field: "NOMOR_PEMBAYARAN", header: "No. Pembayaran", style: { minWidth: "140px" } },
    {
      field: "NAMA_SISWA",
      header: "Siswa",
      style: { minWidth: "180px" },
      body: (row) => (
        <div>
          <div className="font-medium">{row.NAMA_SISWA || "-"}</div>
          <small className="text-gray-500">{row.NIS || ""}</small>
        </div>
      ),
    },
    {
      field: "TOTAL_BAYAR",
      header: "Total Bayar",
      style: { minWidth: "140px" },
      body: (row) => (
        <span className="font-semibold text-green-600">{formatRupiah(row.TOTAL_BAYAR || 0)}</span>
      ),
    },
    {
      field: "METODE_BAYAR",
      header: "Metode",
      style: { minWidth: "130px" },
      body: (row) => getMetodeBadge(row.METODE_BAYAR),
    },
    {
      field: "STATUS",
      header: "Status",
      style: { minWidth: "120px" },
      body: (row) => getStatusBadge(row.STATUS),
    },
    {
      field: "TGL_BAYAR",
      header: "Tanggal Bayar",
      style: { minWidth: "160px" },
      body: (row) => formatTanggal(row.TGL_BAYAR),
    },
    {
      header: "Aksi",
      body: (rowData) => (
        <div className="flex gap-2">
          <Button
            icon="pi pi-eye"
            size="small"
            severity="info"
            tooltip="Lihat Detail"
            tooltipOptions={{ position: "top" }}
            onClick={() => handleViewDetail(rowData)}
          />
          <Button
            icon="pi pi-trash"
            size="small"
            severity="danger"
            tooltip="Hapus"
            tooltipOptions={{ position: "top" }}
            onClick={() => handleDelete(rowData)}
            disabled={rowData.STATUS === "SUKSES"}
          />
        </div>
      ),
      style: { width: "120px" },
    },
  ];

  return (
    <div className="card">
      <ToastNotifier ref={toastRef} />
      <ConfirmDialog />

      <div className="flex justify-content-between align-items-center mb-3">
        <h3 className="text-xl font-semibold">Pembayaran</h3>
        <div className="flex gap-2">
          <Button
            label="Pembayaran Tunai"
            icon="pi pi-money-bill"
            severity="success"
            onClick={() => setTunaiDialogVisible(true)}
          />
          <Button
            label="Pembayaran Online"
            icon="pi pi-credit-card"
            severity="info"
            onClick={() => setOnlineDialogVisible(true)}
          />
        </div>
      </div>

      {/* Filter & Toolbar */}
      <div className="flex flex-col md:flex-row justify-content-between md:items-center gap-4 mb-4">
        {/* Filter Section */}
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex flex-column gap-2">
            <label htmlFor="nis-filter" className="text-sm font-medium">
              Siswa
            </label>
            <Dropdown
              id="nis-filter"
              value={nisFilter}
              options={siswaOptions}
              onChange={(e) => {
                setNisFilter(e.value);
                applyFiltersWithValue(e.value, statusFilter, metodeFilter, startDateFilter, endDateFilter);
              }}
              placeholder="Pilih siswa"
              className="w-64"
              filter
              showClear
            />
          </div>

          <div className="flex flex-column gap-2">
            <label htmlFor="status-filter" className="text-sm font-medium">
              Status
            </label>
            <Dropdown
              id="status-filter"
              value={statusFilter}
              options={statusOptions}
              onChange={(e) => {
                setStatusFilter(e.value);
                applyFiltersWithValue(nisFilter, e.value, metodeFilter, startDateFilter, endDateFilter);
              }}
              placeholder="Pilih status"
              className="w-40"
              showClear
            />
          </div>

          <div className="flex flex-column gap-2">
            <label htmlFor="metode-filter" className="text-sm font-medium">
              Metode
            </label>
            <Dropdown
              id="metode-filter"
              value={metodeFilter}
              options={metodeOptions}
              onChange={(e) => {
                setMetodeFilter(e.value);
                applyFiltersWithValue(nisFilter, statusFilter, e.value, startDateFilter, endDateFilter);
              }}
              placeholder="Pilih metode"
              className="w-48"
              filter
              showClear
            />
          </div>

          <div className="flex flex-column gap-2">
            <label htmlFor="start-date-filter" className="text-sm font-medium">
              Dari Tanggal
            </label>
            <Calendar
              id="start-date-filter"
              value={startDateFilter}
              onChange={(e) => {
                setStartDateFilter(e.value);
                applyFiltersWithValue(nisFilter, statusFilter, metodeFilter, e.value, endDateFilter);
              }}
              dateFormat="dd/mm/yy"
              placeholder="Pilih tanggal"
              showIcon
              className="w-48"
            />
          </div>

          <div className="flex flex-column gap-2">
            <label htmlFor="end-date-filter" className="text-sm font-medium">
              Sampai Tanggal
            </label>
            <Calendar
              id="end-date-filter"
              value={endDateFilter}
              onChange={(e) => {
                setEndDateFilter(e.value);
                applyFiltersWithValue(nisFilter, statusFilter, metodeFilter, startDateFilter, e.value);
              }}
              dateFormat="dd/mm/yy"
              placeholder="Pilih tanggal"
              showIcon
              className="w-48"
            />
          </div>

          <Button
            icon="pi pi-refresh"
            className="p-button-secondary mt-3"
            tooltip="Reset Filter"
            onClick={resetFilter}
          />
        </div>

        {/* Search Section */}
        <div className="flex items-center justify-end gap-2">
          <HeaderBar
            title=""
            placeholder="Cari pembayaran (No. Pembayaran, Siswa)"
            onSearch={handleSearch}
            hideAddButton
          />
        </div>
      </div>

      {/* Tabel Data */}
      <CustomDataTable data={pembayaranList} loading={isLoading} columns={pembayaranColumns} />

      {/* Form Pembayaran Tunai */}
      <FormPembayaranTunai
        visible={tunaiDialogVisible}
        onHide={() => setTunaiDialogVisible(false)}
        onSave={handleTunaiSubmit}
        token={token}
      />

      {/* Form Pembayaran Online */}
      <FormPembayaranOnline
        visible={onlineDialogVisible}
        onHide={() => setOnlineDialogVisible(false)}
        onSave={handleOnlineSubmit}
        token={token}
      />

      {/* Detail Dialog */}
      {selectedPembayaran && (
        <DetailPembayaranDialog
          visible={detailDialogVisible}
          onHide={() => {
            setDetailDialogVisible(false);
            setSelectedPembayaran(null);
          }}
          data={selectedPembayaran}
          formatRupiah={formatRupiah}
          formatTanggal={formatTanggal}
          getStatusBadge={getStatusBadge}
          getMetodeBadge={getMetodeBadge}
        />
      )}
    </div>
  );
}

// Detail Dialog Component
function DetailPembayaranDialog({ visible, onHide, data, formatRupiah, formatTanggal, getStatusBadge, getMetodeBadge }) {
  return (
    <Dialog
      header="Detail Pembayaran"
      visible={visible}
      style={{ width: "50vw" }}
      modal
      onHide={onHide}
    >
      <div className="grid">
        <div className="col-6">
          <p className="text-sm text-gray-500 mb-1">No. Pembayaran</p>
          <p className="font-semibold">{data.NOMOR_PEMBAYARAN}</p>
        </div>
        <div className="col-6">
          <p className="text-sm text-gray-500 mb-1">Status</p>
          {getStatusBadge(data.STATUS)}
        </div>
        <div className="col-6">
          <p className="text-sm text-gray-500 mb-1">Siswa</p>
          <p className="font-semibold">{data.NAMA_SISWA}</p>
          <p className="text-sm text-gray-500">{data.NIS}</p>
        </div>
        <div className="col-6">
          <p className="text-sm text-gray-500 mb-1">Metode Bayar</p>
          {getMetodeBadge(data.METODE_BAYAR)}
        </div>
        <div className="col-6">
          <p className="text-sm text-gray-500 mb-1">Total Bayar</p>
          <p className="font-semibold text-green-600 text-xl">{formatRupiah(data.TOTAL_BAYAR)}</p>
        </div>
        <div className="col-6">
          <p className="text-sm text-gray-500 mb-1">Tanggal Bayar</p>
          <p className="font-semibold">{formatTanggal(data.TGL_BAYAR)}</p>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="font-semibold mb-2">Detail Tagihan yang Dibayar</h4>
        <div className="border-1 border-gray-300 border-round p-3">
          {data.DETAIL && data.DETAIL.length > 0 ? (
            data.DETAIL.map((detail, index) => (
              <div key={index} className="flex justify-content-between align-items-center mb-2 pb-2 border-bottom-1 border-gray-200">
                <div>
                  <p className="font-medium">{detail.NAMA_KOMPONEN}</p>
                  <p className="text-sm text-gray-500">
                    {detail.NOMOR_TAGIHAN}
                    {detail.BULAN && ` - Bulan ${detail.BULAN}/${detail.TAHUN}`}
                  </p>
                </div>
                <p className="font-semibold text-green-600">{formatRupiah(detail.JUMLAH_BAYAR)}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center">Tidak ada detail tagihan</p>
          )}
        </div>
      </div>

      {data.KETERANGAN && (
        <div className="mt-3">
          <p className="text-sm text-gray-500 mb-1">Keterangan</p>
          <p>{data.KETERANGAN}</p>
        </div>
      )}

      <div className="flex justify-content-end gap-2 mt-4">
        <Button label="Tutup" icon="pi pi-times" className="p-button-text" onClick={onHide} />
      </div>
    </Dialog>
  );
}
