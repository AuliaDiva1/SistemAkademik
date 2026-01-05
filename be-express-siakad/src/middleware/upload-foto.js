import multer from "multer";
import path from "path";
import fs from "fs";

// Tentukan folder penyimpanan (Hanya berlaku di lokal)
const getUploadFolder = (req) => {
  const url = req.originalUrl.toLowerCase();
  if (url.includes("absensi") || url.includes("absen")) return "./uploads/absensi";
  if (url.includes("register-siswa") || url.includes("siswa")) return "./uploads/foto_siswa";
  if (url.includes("register-guru") || url.includes("master-guru") || url.includes("guru")) return "./uploads/foto_guru";
  return "./uploads/foto_lainnya";
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // JIKA DI VERCEL (PRODUCTION)
    if (process.env.NODE_ENV === "production") {
      return cb(null, "/tmp"); // Vercel hanya izinkan folder /tmp
    }

    // JIKA DI LOKAL (LAPTOP)
    const dir = getUploadFolder(req);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Hanya file gambar yang diizinkan (jpg, jpeg, png, gif)"), false);
  }
};

const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // Batas 2MB
});

export default upload;
export const uploadAbsensi = upload;
export const uploadSiswa = upload;
export const uploadGuru = upload;
