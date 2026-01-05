import * as MasterKelasModel from "../models/masterKelasModel.js";

/**
 * GET semua kelas
 */
export const getAllKelas = async (req, res) => {
  try {
    const kelas = await MasterKelasModel.getAllKelas();

    return res.status(200).json({
      status: "00",
      message:
        kelas.length > 0
          ? "Data kelas berhasil diambil"
          : "Belum ada data kelas",
      data: kelas.map((item) => ({
        ID: item.ID,
        KELAS_ID: item.KELAS_ID,
        GEDUNG_ID: item.GEDUNG_ID,
        NAMA_GEDUNG: item.NAMA_GEDUNG,
        RUANG_ID: item.RUANG_ID,
        NAMA_RUANG: item.NAMA_RUANG,
        STATUS: item.STATUS,
        created_at: item.created_at,
        updated_at: item.updated_at,
      })),
    });
  } catch (err) {
    return res.status(500).json({
      status: "99",
      message: "Terjadi kesalahan saat mengambil data kelas",
      error: err.message,
    });
  }
};

/**
 * GET kelas by ID
 */
export const getKelasById = async (req, res) => {
  try {
    const { id } = req.params;
    const kelas = await MasterKelasModel.getKelasById(id);

    if (!kelas) {
      return res.status(404).json({
        status: "04",
        message: "Kelas tidak ditemukan",
      });
    }

    return res.status(200).json({
      status: "00",
      message: "Data kelas berhasil diambil",
      data: kelas,
    });
  } catch (err) {
    return res.status(500).json({
      status: "99",
      message: "Terjadi kesalahan saat mengambil data kelas",
      error: err.message,
    });
  }
};

/**
 * CREATE kelas baru
 */
export const createKelas = async (req, res) => {
  try {
    let { KELAS_ID, GEDUNG_ID, RUANG_ID, STATUS } = req.body;

    if (!GEDUNG_ID || !RUANG_ID) {
      return res.status(400).json({
        status: "01",
        message: "GEDUNG_ID dan RUANG_ID wajib diisi",
      });
    }

    // Auto-generate KELAS_ID jika belum ada
    if (!KELAS_ID) {
      const lastKelas = await MasterKelasModel.getLastKelas();
      const nextNumber = lastKelas
        ? parseInt(lastKelas.KELAS_ID.replace("K", "")) + 1
        : 1;
      KELAS_ID = "K" + nextNumber.toString().padStart(4, "0");
    }

    // Cek duplikat
    const existing = await MasterKelasModel.getKelasByKode(KELAS_ID);
    if (existing) {
      return res.status(409).json({
        status: "02",
        message: `KELAS_ID ${KELAS_ID} sudah terdaftar`,
      });
    }

    // Buat kelas baru
    const newKelas = await MasterKelasModel.createKelas({
      KELAS_ID,
      GEDUNG_ID,
      RUANG_ID,
      STATUS,
    });

    return res.status(201).json({
      status: "00",
      message: "Kelas berhasil ditambahkan",
      data: newKelas,
    });
  } catch (err) {
    return res.status(500).json({
      status: "99",
      message: "Terjadi kesalahan saat menambahkan kelas",
      error: err.message,
    });
  }
};

/**
 * UPDATE kelas
 */
export const updateKelas = async (req, res) => {
  try {
    const { id } = req.params;
    const { KELAS_ID, GEDUNG_ID, RUANG_ID, STATUS } = req.body;

    const existing = await MasterKelasModel.getKelasById(id);
    if (!existing) {
      return res.status(404).json({
        status: "04",
        message: "Kelas tidak ditemukan untuk diperbarui",
      });
    }

    const updatedKelas = await MasterKelasModel.updateKelas(id, {
      KELAS_ID,
      GEDUNG_ID,
      RUANG_ID,
      STATUS,
    });

    return res.status(200).json({
      status: "00",
      message: "Kelas berhasil diperbarui",
      data: updatedKelas,
    });
  } catch (err) {
    return res.status(500).json({
      status: "99",
      message: "Terjadi kesalahan saat memperbarui kelas",
      error: err.message,
    });
  }
};

/**
 * DELETE kelas
 */
export const deleteKelas = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await MasterKelasModel.getKelasById(id);

    if (!existing) {
      return res.status(404).json({
        status: "04",
        message: "Kelas tidak ditemukan untuk dihapus",
      });
    }

    await MasterKelasModel.deleteKelas(id);

    return res.status(200).json({
      status: "00",
      message: "Kelas berhasil dihapus",
    });
  } catch (err) {
    return res.status(500).json({
      status: "99",
      message: "Terjadi kesalahan saat menghapus kelas",
      error: err.message,
    });
  }
};
