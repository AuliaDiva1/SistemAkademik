import multer from "multer";
import path from "path";
import fs from "fs";

// Tentukan folder penyimpanan berdasarkan URL endpoint
const getUploadFolder = (req) => {
  // Jika di Vercel (Production), WAJIB gunakan /tmp
  if (process.env.NODE_ENV === "production") {
    return "/tmp";
  }

  const url = req.originalUrl.toLowerCase();

  // Lokal: Tetap gunakan folder uploads
  if (url.includes("absensi") || url.includes("absen")) return "./uploads/absensi";
  if (url.includes("register-siswa") || url.includes("siswa")) return "./uploads/foto_siswa";
  if (url.includes("register-guru") || url.includes("master-guru") || url.includes("guru")) return "./uploads/foto_guru";

  return "./uploads/foto_lainnya";
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = getUploadFolder(req);
    
    // Hanya buat folder jika TIDAK di production (Vercel)
    if (process.env.NODE_ENV !== "production") {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
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
    cb(new Error("Hanya file gambar yang diizinkan (jpg, jpeg, png, gif)"));
  }
};

const upload = multer({ storage, fileFilter });

export default upload;
export const uploadAbsensi = upload;
export const uploadSiswa = upload;
export const uploadGuru = upload;
