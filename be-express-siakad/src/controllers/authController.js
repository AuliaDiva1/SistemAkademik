import { getUserByEmail, addUser } from "../models/userModel.js";
import { addLoginHistory } from "../models/loginHistoryModel.js";
import {
  createGuru,
  createSiswa,
  checkEmailExists,
  checkNisExists,
  checkNisnExists,
  countSuperAdmin,
  getUserProfileById,
  blacklistToken,
} from "../models/authModel.js";
import {
  registerSchema,
  registerSiswaSchema,
  loginSchema,
  registerGuruSchema,
} from "../scemas/authSchema.js";
import { comparePassword, hashPassword } from "../utils/hash.js";
import { generateToken } from "../utils/jwt.js";
import { datetime, status } from "../utils/general.js";

/**
 * HELPER: Mengatur Path Foto agar aman di Vercel
 */
const getFilePath = (file, subfolder) => {
  if (!file) return null;
  // Jika di Vercel, kita hanya simpan nama filenya saja karena folder /tmp bersifat sementara
  if (process.env.NODE_ENV === "production") {
    return file.filename; 
  }
  // Jika di Lokal, simpan path lengkapnya
  return `/uploads/${subfolder}/${file.filename}`;
};

/**
 * REGISTER GURU
 */
export const registerGuru = async (req, res) => {
  try {
    const body = req.body;
    const file = req.file;

    const validation = registerGuruSchema.safeParse(body);
    if (!validation.success) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Validasi gagal",
        datetime: datetime(),
        errors: validation.error.errors.map((err) => ({
          field: err.path[0],
          message: err.message,
        })),
      });
    }

    const parsed = validation.data;
    // PERBAIKAN: Gunakan helper path
    const fotoPath = getFilePath(file, "foto_guru");

    const { user, guru } = await createGuru(
      {
        EMAIL: parsed.email,
        NIP: parsed.nip,
        NAMA: parsed.nama,
        PANGKAT: parsed.pangkat || null,
        KODE_JABATAN: parsed.kode_jabatan || null,
        STATUS_KEPEGAWAIAN: parsed.status_kepegawaian || "Aktif",
        GENDER: parsed.gender,
        TGL_LAHIR: parsed.tgl_lahir || null,
        TEMPAT_LAHIR: parsed.tempat_lahir || null,
        NO_TELP: parsed.no_telp || null,
        ALAMAT: parsed.alamat || null,
        FOTO: fotoPath,
        PENDIDIKAN_TERAKHIR: parsed.pendidikan_terakhir || null,
        TAHUN_LULUS: parsed.tahun_lulus || null,
        UNIVERSITAS: parsed.universitas || null,
        NO_SERTIFIKAT_PENDIDIK: parsed.no_sertifikat_pendidik || null,
        TAHUN_SERTIFIKAT: parsed.tahun_sertifikat || null,
        KEAHLIAN: parsed.keahlian || null,
      },
      {
        name: parsed.nama,
        email: parsed.email,
        password: parsed.password,
      }
    );

    return res.status(201).json({
      status: status.SUKSES,
      message: "Registrasi guru berhasil",
      datetime: datetime(),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      guru,
    });
  } catch (err) {
    console.error("Error registerGuru:", err);
    return res.status(500).json({
      status: status.GAGAL,
      message: `Terjadi kesalahan server: ${err.message}`,
      datetime: datetime(),
    });
  }
};

/**
 * REGISTER SISWA
 */
export const registerSiswa = async (req, res) => {
  try {
    let parsedBody = {};
    for (const key in req.body) {
      try {
        parsedBody[key] = JSON.parse(req.body[key]);
      } catch {
        parsedBody[key] = req.body[key];
      }
    }

    const validation = registerSiswaSchema.safeParse(parsedBody);
    if (!validation.success) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Validasi gagal",
        datetime: datetime(),
        errors: validation.error.errors.map((err) => ({
          field: err.path[0],
          message: err.message,
        })),
      });
    }

    const data = validation.data;
    // PERBAIKAN: Gunakan helper path
    const fotoFile = getFilePath(req.file, "foto_siswa");

    // Cek duplikasi
    if (await checkEmailExists(data.email)) {
      return res.status(400).json({ status: status.BAD_REQUEST, message: "Email sudah terdaftar", datetime: datetime() });
    }
    if (await checkNisExists(data.nis)) {
      return res.status(400).json({ status: status.BAD_REQUEST, message: "NIS sudah terdaftar", datetime: datetime() });
    }
    if (await checkNisnExists(data.nisn)) {
      return res.status(400).json({ status: status.BAD_REQUEST, message: "NISN sudah terdaftar", datetime: datetime() });
    }

    // Mapping orang tua (Logic tetap sama)
    let ortuData = {};
    if (Array.isArray(data.orang_tua)) {
      data.orang_tua.forEach(ortu => {
        const prefix = ortu.jenis.toUpperCase();
        ortuData[`NAMA_${prefix}`] = ortu.nama;
        ortuData[`PEKERJAAN_${prefix}`] = ortu.pekerjaan || null;
        ortuData[`PENDIDIKAN_${prefix}`] = ortu.pendidikan || null;
        ortuData[`ALAMAT_${prefix}`] = ortu.alamat || null;
        ortuData[`NO_TELP_${prefix}`] = ortu.no_hp || null;
      });
    }

    const { userId, siswaId } = await createSiswa(
      {
        EMAIL: data.email,
        NIS: data.nis,
        NISN: data.nisn,
        NAMA: data.nama,
        GENDER: data.gender,
        TEMPAT_LAHIR: data.tempat_lahir || null,
        TGL_LAHIR: data.tgl_lahir,
        AGAMA: data.agama || null,
        ALAMAT: data.alamat || null,
        NO_TELP: data.no_telp || null,
        STATUS: data.status,
        GOL_DARAH: data.gol_darah || null,
        TINGGI: data.tinggi || null,
        BERAT: data.berat || null,
        KEBUTUHAN_KHUSUS: data.kebutuhan_khusus || null,
        FOTO: fotoFile,
        ...ortuData
      },
      { name: data.nama, email: data.email, password: data.password }
    );

    return res.status(201).json({
      status: status.SUKSES,
      message: "Siswa berhasil didaftarkan",
      datetime: datetime(),
      siswa_id: siswaId,
      user: { id: userId, name: data.nama, email: data.email, role: "SISWA" },
    });
  } catch (error) {
    console.error("Error registerSiswa:", error);
    return res.status(500).json({ status: status.GAGAL, message: `Terjadi kesalahan server: ${error.message}`, datetime: datetime() });
  }
};

/**
 * REGISTER (UMUM)
 */
export const register = async (req, res) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Validasi gagal",
        datetime: datetime(),
        errors: validation.error.errors.map((err) => ({ field: err.path[0], message: err.message })),
      });
    }

    const { name, email, password, role } = validation.data;

    if (role === "SUPER_ADMIN" && (await countSuperAdmin()) >= 3) {
      return res.status(400).json({ status: status.BAD_REQUEST, message: "Maksimal 3 Super Admin sudah terdaftar.", datetime: datetime() });
    }

    if (await getUserByEmail(email)) {
      return res.status(400).json({ status: status.BAD_REQUEST, message: "Email sudah terdaftar", datetime: datetime() });
    }

    const hashedPassword = await hashPassword(password);
    const user = await addUser({ name, email, password: hashedPassword, role });

    return res.status(201).json({
      status: status.SUKSES,
      message: "User berhasil didaftarkan",
      datetime: datetime(),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return res.status(500).json({ status: status.GAGAL, message: `Terjadi kesalahan server: ${error.message}`, datetime: datetime() });
  }
};

/**
 * LOGIN (Logic tetap sama, pastikan utils/hash.js sudah pakai bcryptjs)
 */
export const login = async (req, res) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ status: status.BAD_REQUEST, message: "Validasi gagal", datetime: datetime() });
    }

    const { email, password } = validation.data;
    const existingUser = await getUserByEmail(email);

    if (!existingUser || !(await comparePassword(password, existingUser.password))) {
      return res.status(400).json({ status: status.BAD_REQUEST, message: "Email atau password salah", datetime: datetime() });
    }

    const token = await generateToken({ userId: existingUser.id, role: existingUser.role });

    await addLoginHistory({
      userId: existingUser.id,
      action: "LOGIN",
      ip: req.ip,
      userAgent: req.headers["user-agent"] || "unknown",
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Login berhasil",
      datetime: datetime(),
      token,
      user: { id: existingUser.id, name: existingUser.name, email: existingUser.email, role: existingUser.role },
    });
  } catch (error) {
    return res.status(500).json({ status: status.GAGAL, message: `Terjadi kesalahan server: ${error.message}`, datetime: datetime() });
  }
};

// ... (Sisanya getProfile dan logout tetap sama)
