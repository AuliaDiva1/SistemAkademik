"use client";

import axios from "axios";
import { useEffect, useState, useRef } from "react";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { Image } from "primereact/image";

// Components
import ToastNotifier from "../../../../components/ToastNotifier";
import HeaderBar from "../../../../components/headerbar";
import CustomDataTable from "../../../../components/DataTable";
import FilterTanggal from "../../../../components/filterTanggal";

// Forms & Prints
import FormAbsensiGuru from "./components/FormAbsensiGuru";
import FormAbsensiGuruPulang from "./components/FormAbsensiGuruPulang";
import AdjustPrintAbsensiGuru from "./print/AdjustPrintAbsensiGuru";

// Detail dialog
import AbsensiDetailDialog from "./components/AbsensiDetailDialog";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8100";

export default function AbsensiGuruPage() {
  const toastRef = useRef(null);
  const isMounted = useRef(true);

  // state
  const [token, setToken] = useState("");
  const [absensi, setAbsensi] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Data guru yang login (dari getProfile)
  const [currentUser, setCurrentUser] = useState(null);
  const [currentGuru, setCurrentGuru] = useState(null);

  // Filter tanggal
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Dialog states
  const [formMasukVisible, setFormMasukVisible] = useState(false);
  const [formPulangVisible, setFormPulangVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // detail
  const [detailDialogVisible, setDetailDialogVisible] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);

  // print states
  const [adjustDialog, setAdjustDialog] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [jsPdfPreviewOpen, setJsPdfPreviewOpen] = useState(false);

  useEffect(() => {
    isMounted.current = true;
    const t = localStorage.getItem("token");
    
    if (!t) {
      window.location.href = "/";
    } else {
      setToken(t);
      
      // Fetch profile user yang login (menggunakan auth/profile)
      fetchUserProfile(t);

      const date = new Date();
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      setStartDate(firstDay);
      setEndDate(lastDay);
    }

    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch user profile menggunakan endpoint auth/profile
  const fetchUserProfile = async (t) => {
    try {
      const res = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      
      if (res.data.status === "00") {
        const user = res.data.user;
        setCurrentUser(user);

        // Cek apakah user adalah GURU
        if (user.role === "GURU") {
          // Ambil data detail guru berdasarkan email
          fetchGuruDetailByEmail(t, user.email);
        } else {
          toastRef.current?.showToast("01", "Anda bukan guru, tidak bisa mengakses halaman ini");
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 2000);
        }
      } else {
        toastRef.current?.showToast("01", "Gagal mengambil profil user");
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Gagal ambil profil:", error);
      toastRef.current?.showToast("01", "Sesi anda habis, silakan login kembali");
      localStorage.removeItem("token");
      window.location.href = "/";
    }
  };

  // Fetch detail guru dari master_guru berdasarkan email
  const fetchGuruDetailByEmail = async (t, email) => {
    try {
      const res = await axios.get(`${API_URL}/master-guru`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      
      if (res.data.status === "00") {
        // Cari guru yang emailnya sama dengan user yang login
        const guruData = res.data.data.find(g => g.EMAIL === email);
        
        if (guruData) {
          setCurrentGuru(guruData);
          
          // Setelah dapat data guru, fetch absensinya
          const date = new Date();
          const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
          const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
          fetchAbsensi(t, guruData.NIP, firstDay, lastDay);
        } else {
          toastRef.current?.showToast("01", "Data guru tidak ditemukan di database");
        }
      }
    } catch (error) {
      console.error("Gagal ambil data guru:", error);
      toastRef.current?.showToast("01", "Gagal mengambil data guru");
    }
  };

  // fetch absensi - hanya untuk guru yang login
  const fetchAbsensi = async (t, nip, start, end) => {
    if (!start || !end || !nip) return;
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/absensi-guru/rekap`, {
        headers: { Authorization: `Bearer ${t}` },
        params: {
          startDate: start.toLocaleDateString("en-CA"),
          endDate: end.toLocaleDateString("en-CA"),
          nip: nip, // Filter berdasarkan NIP guru yang login
        },
      });

      if (!isMounted.current) return;

      if (res.data.status === "success") {
        const sorted = (res.data.data || []).sort(
          (a, b) => new Date(b.TANGGAL) - new Date(a.TANGGAL)
        );
        setAbsensi(sorted);
        setOriginalData(sorted);
      } else {
        setAbsensi([]);
      }
    } catch (err) {
      toastRef.current?.showToast("01", "Gagal koneksi");
      setAbsensi([]);
    } finally {
      isMounted.current && setIsLoading(false);
    }
  };

  // filter handlers
  const handleFilterDate = () => {
    if (currentGuru) {
      fetchAbsensi(token, currentGuru.NIP, startDate, endDate);
    }
  };

  const resetFilter = () => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setStartDate(first);
    setEndDate(last);
    if (currentGuru) {
      fetchAbsensi(token, currentGuru.NIP, first, last);
    }
  };

  const handleSearch = (keyword) => {
    if (!keyword) setAbsensi(originalData);
    else {
      const lower = keyword.toLowerCase();
      setAbsensi(
        originalData.filter(
          (x) =>
            x.KODE?.toLowerCase().includes(lower) ||
            x.STATUS?.toLowerCase().includes(lower)
        )
      );
    }
  };

  // CRUD - Absen Masuk (otomatis pakai data guru yang login)
  const handleSaveMasuk = async (formData) => {
    if (!currentGuru) {
      toastRef.current?.showToast("01", "Data guru tidak ditemukan");
      return;
    }

    setSaving(true);
    try {
      // FormData sudah berisi NIP dari form component
      // Tidak perlu spread karena formData adalah FormData object, bukan plain object
      
      // Debug: cek isi FormData
      console.log("=== Checking FormData before send ===");
      for (let pair of formData.entries()) {
        console.log(pair[0], ':', pair[1]);
      }

      const res = await axios.post(`${API_URL}/absensi-guru/masuk`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          // Jangan set Content-Type, biar axios auto-detect multipart/form-data
        },
      });
      
      if (res.data.status === "success") {
        toastRef.current?.showToast("00", "Berhasil absen masuk");
        setFormMasukVisible(false);
        handleFilterDate();
      } else {
        toastRef.current?.showToast("01", res.data.message || "Gagal absen masuk");
      }
    } catch (error) {
      console.error("Error absen masuk:", error);
      console.error("Response data:", error.response?.data);
      toastRef.current?.showToast("01", error.response?.data?.message || "Gagal absen masuk");
    } finally {
      setSaving(false);
    }
  };

  // Absen Pulang
  const handleSavePulang = async (payload) => {
    if (!currentGuru) {
      toastRef.current?.showToast("01", "Data guru tidak ditemukan");
      return;
    }

    setSaving(true);
    try {
      const finalPayload = {
        ...payload,
        nip: currentGuru.NIP,
      };

      const res = await axios.post(`${API_URL}/absensi-guru/pulang`, finalPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === "success") {
        toastRef.current?.showToast("00", "Berhasil absen pulang");
        setFormPulangVisible(false);
        handleFilterDate();
      }
    } catch (error) {
      toastRef.current?.showToast("01", error.response?.data?.message || "Gagal absen pulang");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (row) => {
    confirmDialog({
      message: `Hapus absensi tanggal ${new Date(row.TANGGAL).toLocaleDateString("id-ID")}?`,
      header: "Hapus Data",
      icon: "pi pi-trash",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await axios.delete(`${API_URL}/absensi-guru/${row.ID}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          toastRef.current?.showToast("00", "Terhapus");
          handleFilterDate();
        } catch (err) {
          console.error("Gagal hapus:", err);
          toastRef.current?.showToast("01", "Gagal hapus data");
        }
      },
    });
  };

  // detail
  const handleDetail = (row) => {
    setSelectedDetail(row);
    setDetailDialogVisible(true);
  };

  // columns definition
  const columns = [
    {
      field: "TANGGAL",
      header: "Tanggal",
      body: (r) => new Date(r.TANGGAL).toLocaleDateString("id-ID"),
    },
    { field: "KODE", header: "Kode", body: (r) => <Tag value={r.KODE} /> },
    { header: "Masuk", body: (r) => r.JAM_MASUK?.slice(0, 5) || "-" },
    { header: "Pulang", body: (r) => r.JAM_KELUAR?.slice(0, 5) || "Belum" },
    {
      header: "Status",
      body: (r) => (
        <Tag 
          value={r.STATUS} 
          severity={r.STATUS === "Hadir" ? "success" : r.STATUS === "Izin" ? "warning" : "danger"}
        />
      ),
    },
    {
      header: "Aksi",
      body: (row) => (
        <div className="flex gap-2">
          {/* Lihat detail */}
          <Button
            icon="pi pi-eye"
            className="p-button-sm p-button-info"
            tooltip="Lihat Detail"
            onClick={() => handleDetail(row)}
          />

          {/* Jika sudah hadir dan belum pulang → tombol pulang */}
          {row.STATUS === "Hadir" && !row.JAM_KELUAR && (
            <Button
              icon="pi pi-sign-out"
              className="p-button-sm p-button-warning"
              tooltip="Absen Pulang"
              onClick={() => setFormPulangVisible(true)}
            />
          )}

          {/* Hapus */}
          <Button
            icon="pi pi-trash"
            className="p-button-sm p-button-danger"
            tooltip="Hapus"
            onClick={() => handleDelete(row)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="card">
      <ToastNotifier ref={toastRef} />
      <ConfirmDialog />

      <div className="mb-3">
        <h3>Absensi Saya</h3>
        {currentGuru && (
          <div className="text-lg">
            <strong>{currentGuru.NAMA}</strong> - {currentGuru.NIP}
            <br />
            <small className="text-gray-600">{currentGuru.JABATAN || "Guru"}</small>
          </div>
        )}
      </div>

      <div className="flex justify-content-between mb-3">
        <FilterTanggal
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          handleDateFilter={handleFilterDate}
          resetFilter={resetFilter}
        />
        <HeaderBar
          placeholder="Cari kode/status..."
          onSearch={handleSearch}
          showAddButton
          addButtonLabel="Absen Masuk"
          onAddClick={() => setFormMasukVisible(true)}
        />
      </div>

      <CustomDataTable
        columns={columns}
        data={absensi}
        loading={isLoading}
        emptyMessage="Tidak ada data absensi"
      />

      <FormAbsensiGuru
        visible={formMasukVisible}
        onHide={() => setFormMasukVisible(false)}
        onSave={handleSaveMasuk}
        isLoading={saving}
        currentGuru={currentGuru}
      />

      <FormAbsensiGuruPulang
        visible={formPulangVisible}
        onHide={() => setFormPulangVisible(false)}
        onSave={handleSavePulang}
        isLoading={saving}
        currentGuru={currentGuru}
      />

      <AbsensiDetailDialog
        visible={detailDialogVisible}
        onHide={() => setDetailDialogVisible(false)}
        data={selectedDetail}
      />

      <AdjustPrintAbsensiGuru
        visible={adjustDialog}
        onHide={() => setAdjustDialog(false)}
        token={token}
        setPdfUrl={setPdfUrl}
        setFileName={setFileName}
        setJsPdfPreviewOpen={setJsPdfPreviewOpen}
      />

      <Dialog visible={jsPdfPreviewOpen} onHide={() => setJsPdfPreviewOpen(false)} style={{ width: "90vw" }}>
        {pdfUrl && <iframe src={pdfUrl} width="100%" height="100%" />}
      </Dialog>
    </div>
  );
}
