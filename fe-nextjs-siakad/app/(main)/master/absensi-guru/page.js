"use client";

import axios from "axios";
import { useEffect, useState, useRef } from "react";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { Image } from "primereact/image";

// Components
import ToastNotifier from "../../../components/ToastNotifier";
import HeaderBar from "../../../components/headerbar";
import CustomDataTable from "../../../components/DataTable";
import FilterTanggal from "../../../components/filterTanggal";

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

  // Master Data
  const [guruOptions, setGuruOptions] = useState([]);

  // Filter tanggal
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Dialog states
  const [formMasukVisible, setFormMasukVisible] = useState(false);
  const [formPulangVisible, setFormPulangVisible] = useState(false);
  const [selectedNipPulang, setSelectedNipPulang] = useState(null);
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
      fetchGuruList(t);

      const date = new Date();
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      setStartDate(firstDay);
      setEndDate(lastDay);
      fetchAbsensi(t, firstDay, lastDay);
    }

    return () => {
      isMounted.current = false;
    };
  }, []);

  // fetch guru list
  const fetchGuruList = async (t) => {
    try {
      const res = await axios.get(`${API_URL}/absensi-guru/list-guru`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.data.status === "success") {
        const options = (res.data.data || []).map((g) => ({
          label: `${g.NAMA} - ${g.NIP}`,
          value: g.NIP,
        }));
        setGuruOptions(options);
      }
    } catch (error) {
      console.error("Gagal ambil guru:", error);
    }
  };

  // fetch absensi
  const fetchAbsensi = async (t, start, end) => {
    if (!start || !end) return;
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/absensi-guru/rekap`, {
        headers: { Authorization: `Bearer ${t}` },
        params: {
          startDate: start.toLocaleDateString("en-CA"),
          endDate: end.toLocaleDateString("en-CA"),
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
        toastRef.current?.showToast("01", res.data.message);
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
  const handleFilterDate = () => fetchAbsensi(token, startDate, endDate);
  const resetFilter = () => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setStartDate(first);
    setEndDate(last);
    fetchAbsensi(token, first, last);
  };

  const handleSearch = (keyword) => {
    if (!keyword) setAbsensi(originalData);
    else {
      const lower = keyword.toLowerCase();
      setAbsensi(
        originalData.filter(
          (x) =>
            x.NAMA_GURU?.toLowerCase().includes(lower) ||
            x.NIP?.toLowerCase().includes(lower)
        )
      );
    }
  };

  // CRUD
  const handleSaveMasuk = async (formData) => {
    setSaving(true);
    try {
      const res = await axios.post(`${API_URL}/absensi-guru/masuk`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === "success") {
        toastRef.current?.showToast("00", "Berhasil absen masuk");
        setFormMasukVisible(false);
        handleFilterDate();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPulang = (row) => {
    setSelectedNipPulang(row.NIP);
    setFormPulangVisible(true);
  };

  const handleSavePulang = async (payload) => {
    setSaving(true);
    try {
      const res = await axios.post(`${API_URL}/absensi-guru/pulang`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === "success") {
        toastRef.current?.showToast("00", "Berhasil pulang");
        setFormPulangVisible(false);
        handleFilterDate();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (row) => {
    confirmDialog({
      message: `Hapus ${row.NAMA_GURU}?`,
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

  // columns definition (aksi: tombol diperbarui agar konsisten)
  const columns = [
    {
      field: "NAMA_GURU",
      header: "Guru",
      body: (row) => (
        <div>
          <b>{row.NAMA_GURU}</b>
          <br />
          <small>{row.NIP}</small>
        </div>
      ),
    },
    { field: "KODE", header: "Kode", body: (r) => <Tag value={r.KODE} /> },
    {
      field: "TANGGAL",
      header: "Tanggal",
      body: (r) => new Date(r.TANGGAL).toLocaleDateString("id-ID"),
    },
    { header: "Masuk", body: (r) => r.JAM_MASUK?.slice(0, 5) || "-" },
    { header: "Pulang", body: (r) => r.JAM_KELUAR?.slice(0, 5) || "Belum" },
    {
      header: "Aksi",
      body: (row) => (
        <div className="flex gap-2">
          {/* Lihat detail — tampil konsisten */}
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
              onClick={() => handleOpenPulang(row)}
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

      <h3>Rekap Absensi Guru</h3>

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
          placeholder="Cari..."
          onSearch={handleSearch}
          showAddButton
          onAddClick={() => setFormMasukVisible(true)}
        />
      </div>

      <CustomDataTable
        columns={columns}
        data={absensi}
        loading={isLoading}
        emptyMessage="Tidak ada data"
      />

      <FormAbsensiGuru
        visible={formMasukVisible}
        onHide={() => setFormMasukVisible(false)}
        onSave={handleSaveMasuk}
        isLoading={saving}
        guruOptions={guruOptions}
      />

      <FormAbsensiGuruPulang
        visible={formPulangVisible}
        onHide={() => setFormPulangVisible(false)}
        onSave={handleSavePulang}
        isLoading={saving}
        defaultNip={selectedNipPulang}
        guruOptions={guruOptions}
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
