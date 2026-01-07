/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { ProgressSpinner } from "primereact/progressspinner";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Helper function fetch
const apiCall = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    signal: options.signal
  });
  const json = await response.json();
  return { data: json };
};

export default function EntryKehadiranPage() {
  const toast = useRef(null);

  // debounce / abort refs
  const kelasDebounceRef = useRef(null);
  const kelasAbortRef = useRef(null);

  // =============================== FILTERS =====================================
  const [filters, setFilters] = useState({
    TAHUN_AJARAN_ID: "",
    TINGKATAN_ID: "",
    JURUSAN_ID: "",
    KELAS_ID: "",
  });

  // ============================= DATA KEHADIRAN =================================
  const [students, setStudents] = useState([]);
  const [opsiTahun, setOpsiTahun] = useState([]);
  const [opsiTingkat, setOpsiTingkat] = useState([]);
  const [opsiJurusan, setOpsiJurusan] = useState([]);
  const [opsiKelas, setOpsiKelas] = useState([]); 

  const [loading, setLoading] = useState(false);
  const [loadingKelas, setLoadingKelas] = useState(false);
  const [isTableVisible, setIsTableVisible] = useState(false);

  // ============================ LOAD MASTER DATA ===============================
  useEffect(() => {
    const loadMaster = async () => {
      try {
        const [thn, tkt, jur] = await Promise.all([
          apiCall(`${API_URL}/master-tahun-ajaran`),
          apiCall(`${API_URL}/master-tingkatan`),
          apiCall(`${API_URL}/master-jurusan`),
        ]);

        setOpsiTahun((thn.data.data || []).map((i) => ({
          label: i.NAMA_TAHUN_AJARAN,
          value: i.TAHUN_AJARAN_ID,
        })));

        setOpsiTingkat((tkt.data.data || []).map((i) => ({
          label: i.TINGKATAN || i.NAMA_TINGKATAN,
          value: i.TINGKATAN_ID,
        })));

        setOpsiJurusan((jur.data.data || []).map((i) => ({
          label: i.NAMA_JURUSAN,
          value: i.JURUSAN_ID,
        })));
      } catch (e) {
        toast.current?.show({ severity: "error", summary: "Error", detail: "Gagal memuat data master" });
      }
    };
    loadMaster();
  }, []);

  // ===================== RELOAD KELAS SAAT TAHUN BERUBAH ======================
  useEffect(() => {
    const loadKelasByTahun = async (signal) => {
      if (!filters.TAHUN_AJARAN_ID) {
        setOpsiKelas([]);
        return;
      }
      setLoadingKelas(true);
      try {
        const res = await apiCall(`${API_URL}/transaksi-siswa`, { signal });
        const trxFiltered = (res.data.data || []).filter(
          trx => trx.tahun_ajaran?.TAHUN_AJARAN_ID === filters.TAHUN_AJARAN_ID
        );

        const kelasUnique = [];
        const kelasSeen = new Set();

        trxFiltered.forEach(trx => {
          const kelasId = trx.kelas?.KELAS_ID;
          if (kelasId && !kelasSeen.has(kelasId)) {
            kelasSeen.add(kelasId);
            kelasUnique.push({
              KELAS_ID: trx.kelas.KELAS_ID,
              TINGKATAN_ID: trx.tingkatan?.TINGKATAN_ID,
              JURUSAN_ID: trx.jurusan?.JURUSAN_ID,
              NAMA_RUANG: trx.kelas.NAMA_RUANG,
            });
          }
        });
        setOpsiKelas(kelasUnique);
      } catch (e) {
        if (e.name !== 'AbortError') setOpsiKelas([]);
      } finally {
        setLoadingKelas(false);
      }
    };

    if (kelasDebounceRef.current) clearTimeout(kelasDebounceRef.current);
    kelasDebounceRef.current = setTimeout(() => {
      const ac = new AbortController();
      kelasAbortRef.current = ac;
      loadKelasByTahun(ac.signal);
    }, 250);

    return () => clearTimeout(kelasDebounceRef.current);
  }, [filters.TAHUN_AJARAN_ID]);

  const kelasFiltered = (opsiKelas || [])
    .filter(k => {
      const tingkatMatch = !filters.TINGKATAN_ID || k.TINGKATAN_ID === filters.TINGKATAN_ID;
      const jurusanMatch = !filters.JURUSAN_ID || k.JURUSAN_ID === filters.JURUSAN_ID;
      return tingkatMatch && jurusanMatch;
    })
    .map(k => ({
      label: `${k.KELAS_ID}${k.NAMA_RUANG ? ` - ${k.NAMA_RUANG}` : ''}`,
      value: k.KELAS_ID
    }));

  // ============================ LOAD DATA KEHADIRAN ============================
  const fetchKehadiran = async () => {
    if (!filters.TAHUN_AJARAN_ID || !filters.KELAS_ID) {
      toast.current?.show({ severity: "warn", summary: "Peringatan", detail: "Lengkapi filter terlebih dahulu" });
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        kelas_id: filters.KELAS_ID,
        tahun_ajaran_id: filters.TAHUN_AJARAN_ID,
        tingkatan_id: filters.TINGKATAN_ID,
        jurusan_id: filters.JURUSAN_ID
      });

      const res = await apiCall(`${API_URL}/kehadiran/cek-kehadiran?${params.toString()}`);
      
      // Normalisasi data dari DB (pastikan field SAKIT, IZIN, ALPA aman)
      const dataSiswa = (res.data.data || res.data || []).map(s => ({
        ...s,
        SAKIT: s.SAKIT ?? 0,
        IZIN: s.IZIN ?? 0,
        ALPA: s.ALPA ?? 0,
      }));

      setStudents(dataSiswa);
      setIsTableVisible(true);
      toast.current?.show({ severity: "success", summary: "Berhasil", detail: "Data kehadiran dimuat" });
    } catch (e) {
      toast.current?.show({ severity: "error", summary: "Error", detail: "Gagal memuat data kehadiran" });
    } finally {
      setLoading(false);
    }
  };

  // ============================== SAVE ALL ====================================
  const saveAll = async () => {
    setLoading(true);
    try {
      await apiCall(`${API_URL}/kehadiran/simpan-kehadiran`, {
        method: 'POST',
        body: JSON.stringify({
          tahun_ajaran_id: filters.TAHUN_AJARAN_ID,
          kelas_id: filters.KELAS_ID,
          tingkatan_id: filters.TINGKATAN_ID,
          jurusan_id: filters.JURUSAN_ID,
          data_kehadiran: students
        })
      });
      toast.current?.show({ severity: "success", summary: "Berhasil", detail: "Kehadiran berhasil disimpan" });
      fetchKehadiran();
    } catch (e) {
      toast.current?.show({ severity: "error", summary: "Gagal", detail: "Gagal menyimpan data" });
    } finally {
      setLoading(false);
    }
  };

  // ============================== TEMPLATE COLUMNS =============================
  const inputTemplate = (row, field) => (
    <input
      type="number"
      value={row[field] ?? 0}
      onChange={(e) => {
        const val = parseInt(e.target.value) || 0;
        if (val < 0) return;
        setStudents(prev => prev.map(s => s.NIS === row.NIS ? { ...s, [field]: val } : s));
      }}
      className="p-inputtext p-component w-full text-center"
      min="0"
    />
  );

  return (
    <div className="grid justify-content-center">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="col-12 md:col-11">
        <Card className="mb-4 shadow-1">
          <h5 className="font-bold text-900">Entry Kehadiran Siswa</h5>
          <p className="text-sm text-500 mb-3">Rekap absen (Sakit, Izin, Alpa) per tahun ajaran dan kelas.</p>
          <Divider />

          <div className="p-fluid formgrid grid">
            <div className="field col-12 md:col-3">
              <label className="font-medium">Tahun Ajaran</label>
              <Dropdown value={filters.TAHUN_AJARAN_ID} options={opsiTahun} 
                onChange={(e) => setFilters({ ...filters, TAHUN_AJARAN_ID: e.value, TINGKATAN_ID: "", JURUSAN_ID: "", KELAS_ID: "" })} 
                placeholder="Pilih Tahun" />
            </div>

            <div className="field col-12 md:col-2">
              <label className="font-medium">Tingkat</label>
              <Dropdown value={filters.TINGKATAN_ID} options={opsiTingkat} 
                onChange={(e) => setFilters({ ...filters, TINGKATAN_ID: e.value, KELAS_ID: "" })} 
                placeholder="Semua" showClear />
            </div>

            <div className="field col-12 md:col-3">
              <label className="font-medium">Jurusan</label>
              <Dropdown value={filters.JURUSAN_ID} options={opsiJurusan} 
                onChange={(e) => setFilters({ ...filters, JURUSAN_ID: e.value, KELAS_ID: "" })} 
                placeholder="Semua" showClear />
            </div>

            <div className="field col-12 md:col-4">
              <label className="font-medium">Kelas</label>
              <Dropdown value={filters.KELAS_ID} options={kelasFiltered} 
                onChange={(e) => setFilters({ ...filters, KELAS_ID: e.value })} 
                placeholder="Pilih Kelas" disabled={loadingKelas} />
            </div>
          </div>

          <div className="flex justify-content-end gap-2 mt-4">
            <Button label="Tampilkan Tabel" icon="pi pi-check" onClick={fetchKehadiran} disabled={!filters.KELAS_ID || loading} />
          </div>
        </Card>
      </div>

      {!loading && isTableVisible && students.length > 0 && (
        <div className="col-12 md:col-11">
          <Card className="shadow-1">
            <div className="flex justify-content-between align-items-center mb-3">
               <h5 className="font-bold m-0">Daftar Siswa - {filters.KELAS_ID}</h5>
               <Button label="Simpan Semua" icon="pi pi-save" severity="success" onClick={saveAll} loading={loading} />
            </div>
            
            <DataTable value={students} showGridlines stripedRows paginator rows={10}>
              <Column header="No." body={(r, o) => o.rowIndex + 1} style={{ width: "50px" }} />
              <Column field="NIS" header="NIS" style={{ width: "120px" }} />
              <Column field="NAMA" header="Nama Siswa" />
              <Column header="Sakit" body={(r) => inputTemplate(r, "SAKIT")} style={{ width: "100px" }} />
              <Column header="Izin" body={(r) => inputTemplate(r, "IZIN")} style={{ width: "100px" }} />
              <Column header="Alpa" body={(r) => inputTemplate(r, "ALPA")} style={{ width: "100px" }} />
            </DataTable>
          </Card>
        </div>
      )}

      {loading && (
        <div className="col-12 text-center p-8">
          <ProgressSpinner />
        </div>
      )}
    </div>
  );
}
