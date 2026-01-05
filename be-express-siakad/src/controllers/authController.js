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
 * HELPER: Menyesuaikan path foto untuk Vercel vs Lokal
 */
const getFotoPath = (file, folderName) => {
  if (!file) return null;
  // Di Vercel (Production), kita tidak bisa akses folder ./uploads secara persisten
  // Kita hanya simpan nama filenya saja yang ada di /tmp
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
    return file.filename;
  }
  // Di Lokal, simpan path lengkap untuk akses static file
  return `/uploads/${folderName}/${file.filename}`;
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
        status: status.BAD_REQUEST || "01",
        message: "Validasi gagal",
        datetime: datetime(),
        errors: validation.error.errors.map((err) => ({
          field: err.path[0],
          message: err.message,
        })),
      });
    }

    const parsed = validation.data;
    const fotoPath = getFotoPath(file, "foto_guru");

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
      status: status.SUKSES || "00",
      message: "Registrasi guru berhasil",
      datetime: datetime(),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      guru,
    });
  } catch (err) {
    console.error("Error registerGuru:", err);
    return res.status(500).json({
      status: status.GAGAL || "01",
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
    const fotoFile = getFotoPath(req.file, "foto_siswa");

    if (await checkEmailExists(data.email)) {
      return res.status(400).json({ status: status.BAD_REQUEST, message: "Email sudah terdaftar", datetime: datetime() });
    }

    // Mapping orang tua/wali logic
    let ortuFields = {};
    if (Array.isArray(data.orang_tua)) {
      data.orang_tua.forEach((ortu) => {
        const type = ortu.jenis.toUpperCase(); // AYAH, IBU, WALI
        ortuFields[`NAMA_${type}`] = ortu.nama;
        ortuFields[`PEKERJAAN_${type}`] = ortu.pekerjaan || null;
        ortuFields[`PENDIDIKAN_${type}`] = ortu.pendidikan || null;
        ortuFields[`ALAMAT_${type}`] = ortu.alamat || null;
        ortuFields[`NO_TELP_${type}`] = ortu.no_hp || null;
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
        ...ortuFields
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
 * REGISTER UMUM
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
 * GET PROFILE (PENTING: Sudah di-export)
 */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ status: "01", message: "Token tidak valid", datetime: datetime() });
    }

    const user = await getUserProfileById(userId);
    if (!user) {
      return res.status(404).json({ status: "01", message: "User tidak ditemukan", datetime: datetime() });
    }

    return res.status(200).json({ status: "00", message: "Berhasil mengambil profil", datetime: datetime(), user });
  } catch (error) {
    return res.status(500).json({ status: "01", message: error.message, datetime: datetime() });
  }
};

/**
 * LOGIN
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
    return res.status(500).json({ status: status.GAGAL, message: error.message, datetime: datetime() });
  }
};

/**
 * LOGOUT
 */
export const logout = async (req, res) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    const userId = req.user?.userId;

    if (!token || !userId) {
      return res.status(401).json({ status: status.TIDAK_ADA_TOKEN, message: "Token tidak ditemukan", datetime: datetime() });
    }

    await blacklistToken(token, new Date(req.user.exp * 1000));
    await addLoginHistory({ userId, action: "LOGOUT", ip: req.ip, userAgent: req.headers["user-agent"] || "unknown" });

    return res.status(200).json({ status: status.SUKSES, message: "Logout berhasil", datetime: datetime() });
  } catch (error) {
    return res.status(500).json({ status: status.GAGAL, message: error.message, datetime: datetime() });
  }
};
