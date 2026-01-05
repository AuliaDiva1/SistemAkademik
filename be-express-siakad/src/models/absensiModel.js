import { db } from "../core/config/knex.js";

/* --------------------------- NAMA TABEL --------------------------- */
const tableAbsensiSiswa = "t_absensi_siswa";
const tableAbsensiGuru = "t_absensi_guru";

/* --------------------------- ABSENSI SISWA --------------------------- */
export const getAllAbsensiSiswa = async () => {
  const rows = await db(tableAbsensiSiswa)
    .select(
      "t_absensi_siswa.ABSENSI_ID",
      "t_absensi_siswa.TANGGAL",
      "t_absensi_siswa.STATUS",
      "t_absensi_siswa.JAM_ABSEN",
      "t_absensi_siswa.KETERANGAN",
      "m_siswa.NAMA as NAMA_SISWA",
      "m_siswa.NIS",
      "master_mata_pelajaran.NAMA_MAPEL",
      "m_kelas.NAMA_KELAS",
      "m_guru.NAMA as NAMA_GURU",
      "master_hari.NAMA_HARI",
      "t_jadwal.JAM_MULAI",
      "t_jadwal.JAM_SELESAI"
    )
    // Join siswa
    .leftJoin("m_siswa", "t_absensi_siswa.SISWA_ID", "m_siswa.SISWA_ID")
    // Join jadwal
    .leftJoin("t_jadwal", "t_absensi_siswa.JADWAL_ID", "t_jadwal.JADWAL_ID")
    // Join mapel_kelas agar bisa ambil mapel dan guru
    .leftJoin("t_mapel_kelas", "t_jadwal.MAPEL_KELAS_ID", "t_mapel_kelas.MAPEL_KELAS_ID")
    // Join master tabel
    .leftJoin("master_mata_pelajaran", "t_mapel_kelas.MAPEL_ID", "master_mata_pelajaran.MAPEL_ID")
    .leftJoin("m_guru", "t_mapel_kelas.GURU_ID", "m_guru.GURU_ID")
    .leftJoin("m_kelas", "t_mapel_kelas.KELAS_ID", "m_kelas.KELAS_ID")
    .leftJoin("master_hari", "t_jadwal.HARI_ID", "master_hari.HARI_ID")
    .orderBy("t_absensi_siswa.ABSENSI_ID", "desc");

  return rows.map((r) => ({
    ABSENSI_ID: r.ABSENSI_ID,
    TANGGAL: r.TANGGAL,
    STATUS: r.STATUS,
    JAM_ABSEN: r.JAM_ABSEN,
    KETERANGAN: r.KETERANGAN,
    siswa: {
      NAMA: r.NAMA_SISWA,
      NIS: r.NIS,
    },
    jadwal: {
      NAMA_MAPEL: r.NAMA_MAPEL,
      NAMA_KELAS: r.NAMA_KELAS,
      NAMA_GURU: r.NAMA_GURU,
      NAMA_HARI: r.NAMA_HARI,
      JAM_MULAI: r.JAM_MULAI,
      JAM_SELESAI: r.JAM_SELESAI,
    },
  }));
};

// 🔹 Create Absensi Siswa
export const createAbsensiSiswa = async (data) => {
  const [id] = await db(tableAbsensiSiswa).insert(data);
  return db(tableAbsensiSiswa).where({ ABSENSI_ID: id }).first();
};

// 🔹 Update Absensi Siswa
export const updateAbsensiSiswa = async (id, data) => {
  const exist = await db(tableAbsensiSiswa).where({ ABSENSI_ID: id }).first();
  if (!exist) return null;
  await db(tableAbsensiSiswa).where({ ABSENSI_ID: id }).update(data);
  return db(tableAbsensiSiswa).where({ ABSENSI_ID: id }).first();
};

// 🔹 Delete Absensi Siswa
export const deleteAbsensiSiswa = async (id) => {
  const exist = await db(tableAbsensiSiswa).where({ ABSENSI_ID: id }).first();
  if (!exist) return null;
  await db(tableAbsensiSiswa).where({ ABSENSI_ID: id }).del();
  return exist;
};

/* --------------------------- ABSENSI GURU --------------------------- */
export const getAllAbsensiGuru = async () => {
  const rows = await db(tableAbsensiGuru)
    .select(
      "t_absensi_guru.*",
      "m_guru.NAMA as NAMA_GURU",
      "m_guru.NIP"
    )
    .leftJoin("m_guru", "t_absensi_guru.GURU_ID", "m_guru.GURU_ID")
    .orderBy("t_absensi_guru.TANGGAL", "desc");

  return rows.map((r) => ({
    ...r,
    guru: { NAMA: r.NAMA_GURU, NIP: r.NIP },
  }));
};

export const createAbsensiGuru = async (data) => {
  const [id] = await db(tableAbsensiGuru).insert(data);
  return db(tableAbsensiGuru).where({ ABSENSI_ID: id }).first();
};

export const updateAbsensiGuru = async (id, data) => {
  const exist = await db(tableAbsensiGuru).where({ ABSENSI_ID: id }).first();
  if (!exist) return null;
  await db(tableAbsensiGuru).where({ ABSENSI_ID: id }).update(data);
  return db(tableAbsensiGuru).where({ ABSENSI_ID: id }).first();
};

export const deleteAbsensiGuru = async (id) => {
  const exist = await db(tableAbsensiGuru).where({ ABSENSI_ID: id }).first();
  if (!exist) return null;
  await db(tableAbsensiGuru).where({ ABSENSI_ID: id }).del();
  return exist;
};
