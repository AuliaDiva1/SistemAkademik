"use client";

import { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import { Skeleton } from "primereact/skeleton";
import { Tag } from "primereact/tag";
import axios from "axios";

const SiswaDetailDialog = ({ visible, onHide, siswa }) => {
  const [transaksi, setTransaksi] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const API_TRANSAKSI = `${API_URL}/transaksi-siswa`;

  useEffect(() => {
    if (siswa && visible) {
      setLoading(true);
      axios
        .get(API_TRANSAKSI)
        .then((res) => {
          const data = res.data.data;
          // Cari transaksi berdasarkan NIS
          const transaksiSiswa = data.find(
            (item) => item.siswa && item.siswa.NIS === siswa.NIS
          );
          console.log("Transaksi siswa ditemukan:", transaksiSiswa); // Debug
          setTransaksi(transaksiSiswa || null);
        })
        .catch((err) => {
          console.error("Gagal memuat transaksi siswa:", err);
          setTransaksi(null);
        })
        .finally(() => setLoading(false));
    }
  }, [siswa, visible, API_TRANSAKSI]);
const fotoUrl = (() => {
  if (!siswa?.FOTO) return null;

  // Jika sudah link lengkap (Cloudinary/http), langsung pakai
  if (siswa.FOTO.startsWith("http")) return siswa.FOTO;

  // Bersihkan host (hapus /api di ujung)
  const host = API_URL ? API_URL.replace(/\/api$/, "").replace(/\/$/, "") : "";

  // Ambil nama filenya saja dari database 
  // (Jika di DB: "/uploads/foto_siswa/gambar.jpg" -> kita ambil "gambar.jpg")
  const namaFile = siswa.FOTO.split('/').pop(); 

  // Panggil route jembatan yang kita buat tadi
  return `${host}/uploads/foto_siswa/${namaFile}`;
})();

  const InfoItem = ({ label, value }) => (
    <div className="mb-3">
      <span className="text-600 text-sm font-medium block mb-1">{label}</span>
      <span className="text-900 font-semibold">{value || "-"}</span>
    </div>
  );

  return (
    <Dialog
      header={
        <div className="flex align-items-center gap-2">
          <i className="pi pi-user text-primary text-2xl"></i>
          <span className="font-bold text-xl">Detail Siswa</span>
        </div>
      }
      visible={visible}
      style={{ width: "900px", maxWidth: "95vw" }}
      modal
      draggable={false}
      onHide={onHide}
      className="p-fluid"
    >
      {siswa ? (
        <div className="pb-2">
          <Card className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-none shadow-3">
            <div className="grid align-items-center">
              <div className="col-12 md:col-4 text-center">
                <div className="relative inline-block">
                  <img
                    src={fotoUrl || "https://www.primefaces.org/wp-content/uploads/2020/05/placeholder.png"}
                    alt="Foto Siswa"
                    className="border-circle shadow-4"
                    onError={(e) => {
                      // Jika /tmp tidak bisa diakses, tampilkan placeholder
                      e.target.src = "https://www.primefaces.org/wp-content/uploads/2020/05/placeholder.png";
                    }}
                    style={{
                      width: "160px",
                      height: "160px",
                      objectFit: "cover",
                      border: "4px solid white",
                    }}
                  />
                </div>
              </div>
              <div className="col-12 md:col-8">
                <h2 className="mt-0 mb-2 text-primary">{siswa.NAMA}</h2>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Tag severity={siswa.STATUS === "AKTIF" ? "success" : "warning"} value={siswa.STATUS} />
                  <Tag severity="info" value={siswa.GENDER === "L" ? "Laki-laki" : "Perempuan"} />
                </div>
                <div className="grid">
                  <div className="col-6">
                    <InfoItem label="NIS" value={siswa.NIS} />
                    <InfoItem label="NISN" value={siswa.NISN} />
                  </div>
                  <div className="col-6">
                    <InfoItem label="Email" value={siswa.EMAIL} />
                    <InfoItem label="No. Telp" value={siswa.NO_TELP} />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* ====== DATA PRIBADI ====== */}
          <Card title="Data Pribadi" className="mb-4 shadow-2">
            <div className="grid">
              <div className="col-12 md:col-6">
                <InfoItem label="Tempat Lahir" value={siswa.TEMPAT_LAHIR} />
                <InfoItem
                  label="Tanggal Lahir"
                  value={
                    siswa.TGL_LAHIR
                      ? new Date(siswa.TGL_LAHIR).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "-"
                  }
                />
                <InfoItem label="Agama" value={siswa.AGAMA} />
                <InfoItem label="Golongan Darah" value={siswa.GOL_DARAH} />
              </div>
              <div className="col-12 md:col-6">
                <InfoItem
                  label="Tinggi Badan"
                  value={siswa.TINGGI ? `${siswa.TINGGI} cm` : "-"}
                />
                <InfoItem
                  label="Berat Badan"
                  value={siswa.BERAT ? `${siswa.BERAT} kg` : "-"}
                />
                <InfoItem
                  label="Kebutuhan Khusus"
                  value={siswa.KEBUTUHAN_KHUSUS}
                />
                <InfoItem label="Alamat" value={siswa.ALAMAT} />
              </div>
            </div>
          </Card>

          {/* ====== DATA AKADEMIK ====== */}
          <Card title="Data Akademik" className="mb-4 shadow-2">
            {loading ? (
              <div className="grid">
                <div className="col-4">
                  <Skeleton height="60px" />
                </div>
                <div className="col-4">
                  <Skeleton height="60px" />
                </div>
                <div className="col-4">
                  <Skeleton height="60px" />
                </div>
              </div>
            ) : transaksi ? (
              <div className="grid">
                <div className="col-12 md:col-3">
                  <InfoItem
                    label="Tingkatan"
                    value={transaksi.tingkatan?.TINGKATAN}
                  />
                </div>
                <div className="col-12 md:col-3">
                  <InfoItem
                    label="Jurusan"
                    value={transaksi.jurusan?.NAMA_JURUSAN}
                  />
                </div>
                <div className="col-12 md:col-3">
                  <InfoItem
                    label="Kelas"
                    value={transaksi.kelas?.NAMA_RUANG}
                  />
                </div>
                <div className="col-12 md:col-3">
                  <InfoItem
                    label="Tahun Ajaran"
                    value={transaksi.tahun_ajaran?.NAMA_TAHUN_AJARAN}
                  />
                </div>
                <div className="col-12">
                  <div className="surface-100 border-round p-3 mt-2">
                    <div className="flex align-items-center gap-2">
                      <i className="pi pi-info-circle text-blue-500"></i>
                      <span className="text-700">
                        <strong>ID Transaksi:</strong> {transaksi.TRANSAKSI_ID}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <i className="pi pi-inbox text-4xl text-400 mb-3 block"></i>
                <p className="text-600 font-medium">
                  Siswa belum ditempatkan di kelas
                </p>
                <p className="text-500 text-sm">
                  Silakan tambahkan data transaksi penempatan kelas
                </p>
              </div>
            )}
          </Card>

          <Divider align="center">
            <span className="bg-white px-3 text-700 font-semibold">
              Data Keluarga
            </span>
          </Divider>

          {/* ====== DATA AYAH ====== */}
          <Card
            title={
              <div className="flex align-items-center gap-2">
                <span>Data Ayah</span>
              </div>
            }
            className="mb-3 shadow-2"
          >
            <div className="grid">
              <div className="col-12 md:col-6">
                <InfoItem label="Nama Ayah" value={siswa.NAMA_AYAH} />
                <InfoItem label="Pekerjaan" value={siswa.PEKERJAAN_AYAH} />
                <InfoItem label="Pendidikan" value={siswa.PENDIDIKAN_AYAH} />
              </div>
              <div className="col-12 md:col-6">
                <InfoItem label="Alamat" value={siswa.ALAMAT_AYAH} />
                <InfoItem label="No. Telepon" value={siswa.NO_TELP_AYAH} />
              </div>
            </div>
          </Card>

          {/* ====== DATA IBU ====== */}
          <Card
            title={
              <div className="flex align-items-center gap-2">
                <span>Data Ibu</span>
              </div>
            }
            className="mb-3 shadow-2"
          >
            <div className="grid">
              <div className="col-12 md:col-6">
                <InfoItem label="Nama Ibu" value={siswa.NAMA_IBU} />
                <InfoItem label="Pekerjaan" value={siswa.PEKERJAAN_IBU} />
                <InfoItem label="Pendidikan" value={siswa.PENDIDIKAN_IBU} />
              </div>
              <div className="col-12 md:col-6">
                <InfoItem label="Alamat" value={siswa.ALAMAT_IBU} />
                <InfoItem label="No. Telepon" value={siswa.NO_TELP_IBU} />
              </div>
            </div>
          </Card>

          {/* ====== DATA WALI ====== */}
          <Card
            title={
              <div className="flex align-items-center gap-2">
                <span>Data Wali</span>
              </div>
            }
            className="shadow-2"
          >
            <div className="grid">
              <div className="col-12 md:col-6">
                <InfoItem label="Nama Wali" value={siswa.NAMA_WALI} />
                <InfoItem label="Pekerjaan" value={siswa.PEKERJAAN_WALI} />
                <InfoItem label="Pendidikan" value={siswa.PENDIDIKAN_WALI} />
              </div>
              <div className="col-12 md:col-6">
                <InfoItem label="Alamat" value={siswa.ALAMAT_WALI} />
                <InfoItem label="No. Telepon" value={siswa.NO_TELP_WALI} />
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <div className="text-center py-6">
          <i className="pi pi-spin pi-spinner text-4xl text-primary mb-3"></i>
          <p className="text-600">Memuat data siswa...</p>
        </div>
      )}
    </Dialog>
  );
};

export default SiswaDetailDialog;
