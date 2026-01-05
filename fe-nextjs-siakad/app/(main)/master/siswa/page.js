"use client";

import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { ProgressSpinner } from "primereact/progressspinner";
import dynamic from "next/dynamic";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";

// Import Komponen Custom
import ToastNotifier from "../../../components/ToastNotifier";
import HeaderBar from "../../../components/headerbar";
import TabelSiswa from "./components/tabelSiswa";
import FormDialogSiswa from "./components/FormDialogSiswa";
import AdjustPrintMarginLaporan from "./print/AdjustPrintMarginLaporan";

// SESUAIKAN DENGAN NAMA FILE KAMU (f kecil)
import FilterTanggal from "../../../components/filterTanggal";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Dynamic import PDFViewer agar tidak error saat build
const PDFViewer = dynamic(() => import("./print/PDFViewer"), {
    loading: () => (
        <div className="flex items-center justify-center h-full">
            <ProgressSpinner style={{ width: "50px", height: "50px" }} strokeWidth="4" />
        </div>
    ),
    ssr: false,
});

const SiswaPage = () => {
    const toastRef = useRef(null);
    const [token, setToken] = useState("");
    const [data, setData] = useState([]);
    const [originalData, setOriginalData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [selectedSiswa, setSelectedSiswa] = useState(null);

    // STATE UNTUK FILTER TANGGAL (PENTING: Agar tidak "is not defined")
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    // PDF Preview State
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [pdfUrl, setPdfUrl] = useState("");
    const [fileName, setFileName] = useState("");
    const [jsPdfPreviewOpen, setJsPdfPreviewOpen] = useState(false);

    useEffect(() => {
        const t = localStorage.getItem("token");
        if (!t) {
            window.location.href = "/";
        } else {
            setToken(t);
            fetchSiswa(t);
        }
    }, []);

    const fetchSiswa = async (t) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/siswa`, {
                headers: { Authorization: `Bearer ${t}` },
            });
            if (res.data.status === "00") {
                const siswaData = Array.isArray(res.data.data) ? res.data.data : [res.data.data];
                const sorted = siswaData.sort((a, b) => a.SISWA_ID - b.SISWA_ID);
                setData(sorted);
                setOriginalData(sorted);
            } else {
                toastRef.current?.showToast("01", res.data.message || "Gagal mengambil data");
            }
        } catch (err) {
            console.error("Gagal mengambil data:", err);
            toastRef.current?.showToast("01", "Gagal mengambil data");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (keyword) => {
        if (!keyword) {
            setData(originalData);
        } else {
            const filtered = originalData.filter(
                (item) =>
                    item.NIS?.toLowerCase().includes(keyword.toLowerCase()) ||
                    item.NISN?.toLowerCase().includes(keyword.toLowerCase()) ||
                    item.NAMA?.toLowerCase().includes(keyword.toLowerCase()) ||
                    item.EMAIL?.toLowerCase().includes(keyword.toLowerCase())
            );
            setData(filtered);
        }
    };

    const handleDateFilter = () => {
        if (!startDate && !endDate) {
            setData(originalData);
            return;
        }
        const filtered = originalData.filter((item) => {
            if (!item.TGL_LAHIR) return false;
            const birthDate = new Date(item.TGL_LAHIR).getTime();
            const from = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
            const to = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;

            if (from && to) return birthDate >= from && birthDate <= to;
            if (from) return birthDate >= from;
            if (to) return birthDate <= to;
            return true;
        });
        setData(filtered);
    };

    const resetFilter = () => {
        setStartDate(null);
        setEndDate(null);
        setData(originalData);
    };

    const handleEdit = (row) => {
        setSelectedSiswa(row);
        setDialogVisible(true);
    };

    const handleDelete = (row) => {
        confirmDialog({
            message: `Apakah Anda yakin ingin menghapus siswa ${row.NAMA}?`,
            header: "Konfirmasi Hapus",
            icon: "pi pi-exclamation-triangle",
            acceptLabel: "Ya",
            rejectLabel: "Batal",
            acceptClassName: "p-button-danger",
            accept: async () => {
                try {
                    await axios.delete(`${API_URL}/siswa/${row.SISWA_ID}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    fetchSiswa(token);
                    toastRef.current?.showToast("00", "Data berhasil dihapus");
                } catch (err) {
                    toastRef.current?.showToast("01", "Gagal menghapus data");
                }
            },
        });
    };

    const handlePrintClick = () => {
        setAdjustDialog(true);
    };

    const handleClosePdfPreview = () => {
        setJsPdfPreviewOpen(false);
        setTimeout(() => setPdfUrl(""), 300);
    };

    return (
        <div className="card">
            <ToastNotifier ref={toastRef} />
            <ConfirmDialog />

            <h3 className="text-xl font-semibold mb-3">Master Siswa</h3>

            <div className="flex flex-column md:flex-row justify-content-between md:align-items-center gap-3 mb-4">
                {/* Komponen Filter Tanggal (Case Sensitive sesuai file) */}
                <FilterTanggal
                    startDate={startDate}
                    endDate={endDate}
                    setStartDate={setStartDate}
                    setEndDate={setEndDate}
                    handleDateFilter={handleDateFilter}
                    resetFilter={resetFilter}
                />

                <div className="flex align-items-center justify-content-end gap-2">
                    <Button
                        icon="pi pi-print"
                        className="p-button-warning"
                        tooltip="Cetak Laporan"
                        onClick={handlePrintClick}
                        disabled={data.length === 0}
                    />

                    <HeaderBar
                        title=""
                        placeholder="Cari siswa..."
                        onSearch={handleSearch}
                        onAddClick={() => {
                            setSelectedSiswa(null);
                            setDialogVisible(true);
                        }}
                    />
                </div>
            </div>

            <TabelSiswa
                data={data}
                loading={loading}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            <FormDialogSiswa
                visible={dialogVisible}
                onHide={() => {
                    setDialogVisible(false);
                    setSelectedSiswa(null);
                }}
                selectedSiswa={selectedSiswa}
                token={token}
                reloadData={() => fetchSiswa(token)}
                toastRef={toastRef}
            />

            <AdjustPrintMarginLaporan
                adjustDialog={adjustDialog}
                setAdjustDialog={setAdjustDialog}
                dataSiswa={data}
                setPdfUrl={setPdfUrl}
                setFileName={setFileName}
                setJsPdfPreviewOpen={setJsPdfPreviewOpen}
            />

            <Dialog
                visible={jsPdfPreviewOpen}
                onHide={handleClosePdfPreview}
                modal
                maximizable
                style={{ width: "90vw", height: "90vh" }}
                header="Preview Laporan Siswa"
                contentStyle={{ height: "calc(90vh - 60px)", padding: 0 }}
            >
                {pdfUrl && (
                    <PDFViewer
                        pdfUrl={pdfUrl}
                        fileName={fileName || "laporan-siswa"}
                        paperSize="A4"
                    />
                )}
            </Dialog>
        </div>
    );
};

export default SiswaPage;
