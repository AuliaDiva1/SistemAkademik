import { db } from "../core/config/knex.js";

const table = "absensi_siswa";

/**
 * Helper untuk format data agar UI PrimeReact/Tabel konsisten.
 */
const formatRow = (r) => {
    if (!r) return null;
    return {
        ID: r.ID,
        ABSENSI_ID: r.ABSENSI_ID,
        NIS: r.NIS,
        NAMA: r.NAMA_SISWA, // Digunakan langsung di table column field="NAMA"
        siswa: { 
            NIS: r.NIS, 
            NAMA: r.NAMA_SISWA 
        },
        posisi: { 
            TAHUN_AJARAN: r.NAMA_TAHUN_AJARAN, 
            KELAS: r.KELAS_ID, 
            TINGKATAN: r.TINGKATAN_ID 
        },
        TANGGAL: r.TANGGAL,
        STATUS: r.STATUS,
        KELAS_ID: r.KELAS_ID,
        BK: {
            CATATAN: r.CATATAN_BK,
            PERLU_TINDAKAN: !!r.PERLU_TINDAKAN,
            SUDAH_DITANGGANI: !!r.SUDAH_DITANGGANI,
            KODE_PELANGGARAN: r.KODE_PELANGGARAN,
            TGL_VERIFIKASI: r.TGL_VERIFIKASI_BK,
            PETUGAS_BK: r.NAMA_GURU_BK || r.VERIFIKASI_BK_ID || "Belum Ditangani"
        },
        VERIFIKASI_BK_ID: r.VERIFIKASI_BK_ID,
        CATATAN_BK: r.CATATAN_BK,
        SUDAH_DITANGGANI: r.SUDAH_DITANGGANI,
        KODE_PELANGGARAN: r.KODE_PELANGGARAN,
        INPUTER: r.NAMA_TU || r.INPUT_OLEH_ID, 
        created_at: r.created_at
    };
};

/**
 * PERBAIKAN: getById sekarang menggunakan JOIN lengkap.
 */
export const getById = async (id) => {
    const row = await db(`${table} as a`)
        .select(
            "a.*", 
            "s.NAMA as NAMA_SISWA", 
            "ta.NAMA_TAHUN_AJARAN", 
            "g1.NAMA as NAMA_TU", 
            "g2.NAMA as NAMA_GURU_BK"
        )
        .join("master_siswa as s", "a.NIS", "s.NIS")
        .join("master_tahun_ajaran as ta", "a.TAHUN_AJARAN_ID", "ta.TAHUN_AJARAN_ID")
        .leftJoin("master_guru as g1", "a.INPUT_OLEH_ID", "g1.NIP")
        .leftJoin("master_guru as g2", "a.VERIFIKASI_BK_ID", "g2.NIP")
        .where("a.ABSENSI_ID", id)
        .first();
    
    return formatRow(row);
};

export const bulkInsertAbsensi = async (dataArray, trx) => {
    const dbInstance = trx || db;
    return await dbInstance(table).insert(dataArray);
};

export const getAbsensiByKelasAndTanggal = async (kelasId, tanggal) => {
    let query = db(`${table} as a`)
        .select(
            "a.*", 
            "s.NAMA as NAMA_SISWA", 
            "ta.NAMA_TAHUN_AJARAN", 
            "g1.NAMA as NAMA_TU", 
            "g2.NAMA as NAMA_GURU_BK"
        )
        .join("master_siswa as s", "a.NIS", "s.NIS")
        .join("master_tahun_ajaran as ta", "a.TAHUN_AJARAN_ID", "ta.TAHUN_AJARAN_ID")
        .leftJoin("master_guru as g1", "a.INPUT_OLEH_ID", "g1.NIP")
        .leftJoin("master_guru as g2", "a.VERIFIKASI_BK_ID", "g2.NIP");

    if (tanggal) query.whereRaw("DATE(a.TANGGAL) = ?", [tanggal]);
    if (kelasId && kelasId !== "null" && kelasId !== "") query.andWhere("a.KELAS_ID", kelasId);

    const rows = await query.orderBy("a.created_at", "desc");
    return rows.map(formatRow);
};

export const updateTU = async (id, data) => {
    return await db(table).where("ABSENSI_ID", id).update({
        STATUS: data.STATUS,
        TANGGAL: data.TANGGAL,
        KELAS_ID: data.KELAS_ID,
        updated_at: new Date()
    });
};

/**
 * FUNGSI BARU: Khusus untuk update penanganan BK
 * Mengatasi error Foreign Key dengan memastikan NIP yang dikirim benar.
 */
export const updateBK = async (id, data) => {
    return await db(table).where("ABSENSI_ID", id).update({
        STATUS: data.statusBaru,            // Update status (misal Alpa -> Sakit)
        CATATAN_BK: data.catatan,           // Hasil pembinaan
        SUDAH_DITANGGANI: data.statusTangani, // 0 atau 1
        KODE_PELANGGARAN: data.kodePelanggaran,
        VERIFIKASI_BK_ID: data.nipBK,       // NIP Guru yang menangani
        TGL_VERIFIKASI_BK: new Date(),      // Tanggal ditangani
        updated_at: new Date()
    });
};

export const remove = async (id) => {
    return await db(table).where("ABSENSI_ID", id).del();
};

export const getRiwayatSiswaIndividual = async (nis) => {
    const rows = await db(`${table} as a`)
        .select("a.*", "ta.NAMA_TAHUN_AJARAN", "s.NAMA as NAMA_SISWA", "g1.NAMA as NAMA_TU", "g2.NAMA as NAMA_GURU_BK")
        .join("master_siswa as s", "a.NIS", "s.NIS")
        .join("master_tahun_ajaran as ta", "a.TAHUN_AJARAN_ID", "ta.TAHUN_AJARAN_ID")
        .leftJoin("master_guru as g1", "a.INPUT_OLEH_ID", "g1.NIP")
        .leftJoin("master_guru as g2", "a.VERIFIKASI_BK_ID", "g2.NIP")
        .where("a.NIS", nis).orderBy("a.TANGGAL", "desc");
    return rows.map(formatRow);
};
