import multer from "multer";
import path from "path";
import fs from "fs";

const getUploadFolder = (req) => {
  const url = req.originalUrl.toLowerCase();
  if (url.includes("absensi")) return "./uploads/absensi";
  if (url.includes("siswa")) return "./uploads/foto_siswa";
  if (url.includes("guru")) return "./uploads/foto_guru";
  return "./uploads/foto_lainnya";
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // PROTEKSI TOTAL UNTUK VERCEL
    // Jika terdeteksi di Vercel atau production, paksa ke /tmp dan langsung RETURN
    if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
      return cb(null, "/tmp");
    }

    // LOGIKA LOKAL (Hanya jalan di laptop kamu)
    const dir = getUploadFolder(req);
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    } catch (err) {
      cb(err, null);
    }
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
  limits: { fileSize: 2 * 1024 * 1024 } 
});

export default upload;
export const uploadAbsensi = upload;
export const uploadSiswa = upload;
export const uploadGuru = upload;
