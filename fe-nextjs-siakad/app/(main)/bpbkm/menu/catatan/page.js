'use client';

import React, { useState, useRef } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import ToastNotifier from "../../../../components/ToastNotifier";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

// Pakai CustomDataTable jika ada
import CustomDataTable from "../../../../components/DataTable";

const CatatanBK = () => {
  const toast = useRef(null);

  // contoh data awal
  const [records, setRecords] = useState([
    { id: 1, nama: "Siswa A", kelas: "XI IPA 1", catatan: "Sering terlambat", tanggal: "2025-09-20" },
    { id: 2, nama: "Siswa B", kelas: "X IPS 2", catatan: "Bolos pelajaran", tanggal: "2025-09-21" },
    { id: 3, nama: "Siswa C", kelas: "XI IPA 3", catatan: "Tidak memakai seragam", tanggal: "2025-09-22" },
  ]);

  const [filterKelas, setFilterKelas] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");

  // modal form
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    nama: "",
    kelas: "",
    catatan: "",
    tanggal: "",
  });

  const kelasOptions = ["X IPA 1", "X IPS 2", "XI IPA 1", "XI IPA 3", "XII IPA 2"];

  // handle save form
  const handleSave = () => {
    if (!form.nama || !form.kelas || !form.catatan || !form.tanggal) {
      toast.current?.show({ severity: "warn", summary: "Validasi", detail: "Lengkapi semua field" });
      return;
    }

    if (editing) {
      // edit mode
      setRecords((prev) =>
        prev.map((r) => (r.id === editing.id ? { ...editing, ...form } : r))
      );
      toast.current?.show({ severity: "success", summary: "Update", detail: "Catatan diperbarui" });
    } else {
      // tambah baru
      const newData = { id: Date.now(), ...form };
      setRecords((prev) => [...prev, newData]);
      toast.current?.show({ severity: "success", summary: "Tambah", detail: "Catatan ditambahkan" });
    }

    setShowDialog(false);
    setEditing(null);
    setForm({ nama: "", kelas: "", catatan: "", tanggal: "" });
  };

  // hapus data
  const handleDelete = (row) => {
    confirmDialog({
      message: `Hapus catatan untuk ${row.nama}?`,
      header: "Konfirmasi",
      icon: "pi pi-exclamation-triangle",
      accept: () => {
        setRecords((prev) => prev.filter((r) => r.id !== row.id));
        toast.current?.show({ severity: "success", summary: "Dihapus", detail: "Catatan dihapus" });
      },
    });
  };

  // export CSV
  const exportCSV = () => {
    if (!records.length) return;
    const keys = Object.keys(records[0]);
    const csv = [
      keys.join(","),
      ...records.map((r) =>
        keys.map((k) => `"${(r[k] ?? "").toString().replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", "catatan-bk.csv");
    link.click();
    URL.revokeObjectURL(url);
  };

  // kolom untuk DataTable
  const columns = [
    { field: "nama", header: "Nama" },
    { field: "kelas", header: "Kelas" },
    { field: "catatan", header: "Catatan" },
    { field: "tanggal", header: "Tanggal" },
    {
      header: "Aksi",
      body: (row) => (
        <div className="flex gap-2">
          <Button
            icon="pi pi-pencil"
            size="small"
            severity="warning"
            onClick={() => {
              setEditing(row);
              setForm(row);
              setShowDialog(true);
            }}
          />
          <Button icon="pi pi-trash" size="small" severity="danger" onClick={() => handleDelete(row)} />
        </div>
      ),
      style: { width: "120px" },
    },
  ];

  const useCustom = !!CustomDataTable;

  return (
    <div className="card p-3">
      <ToastNotifier ref={toastRef} />
      <ConfirmDialog />

      <div className="col-12">
        <div className="card">
          <div className="flex justify-content-between align-items-center mb-3">
            <h5>Catatan BK</h5>
            <div className="flex gap-2">
              <Button label="Tambah" icon="pi pi-plus" onClick={() => setShowDialog(true)} />
              <Button label="Export CSV" icon="pi pi-file" onClick={exportCSV} />
            </div>
          </div>

          <div className="flex gap-2 mb-3">
            <InputText
              placeholder="Cari nama..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
            <Dropdown
              value={filterKelas}
              options={kelasOptions}
              onChange={(e) => setFilterKelas(e.value)}
              placeholder="Filter Kelas"
              showClear
            />
          </div>

          {useCustom ? (
            <CustomDataTable
              data={records.filter(
                (r) =>
                  (!filterKelas || r.kelas === filterKelas) &&
                  (!globalFilter || r.nama.toLowerCase().includes(globalFilter.toLowerCase()))
              )}
              loading={false}
              columns={columns}
            />
          ) : (
            <DataTable
              value={records.filter(
                (r) =>
                  (!filterKelas || r.kelas === filterKelas) &&
                  (!globalFilter || r.nama.toLowerCase().includes(globalFilter.toLowerCase()))
              )}
              paginator
              rows={10}
            >
              {columns.map((col, i) => (
                <Column key={i} {...col} />
              ))}
            </DataTable>
          )}
        </div>
      </div>

      {/* Dialog Form */}
      <Dialog
        header={editing ? "Edit Catatan" : "Tambah Catatan"}
        visible={showDialog}
        style={{ width: "30rem" }}
        modal
        onHide={() => setShowDialog(false)}
      >
        <div className="flex flex-column gap-3">
          <div>
            <label className="block mb-1">Nama Siswa</label>
            <InputText
              className="w-full"
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
            />
          </div>

          <div>
            <label className="block mb-1">Kelas</label>
            <Dropdown
              value={form.kelas}
              options={kelasOptions}
              onChange={(e) => setForm({ ...form, kelas: e.value })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block mb-1">Catatan</label>
            <InputText
              className="w-full"
              value={form.catatan}
              onChange={(e) => setForm({ ...form, catatan: e.target.value })}
            />
          </div>

          <div>
            <label className="block mb-1">Tanggal</label>
            <InputText
              type="date"
              className="w-full"
              value={form.tanggal}
              onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-content-end gap-2 mt-4">
          <Button label="Batal" icon="pi pi-times" severity="secondary" onClick={() => setShowDialog(false)} />
          <Button label="Simpan" icon="pi pi-check" onClick={handleSave} />
        </div>
      </Dialog>
    </div>
  );
};

export default CatatanBK;
