import { Router } from "express";
// Ubah cara import ini:
import { 
  login, 
  register, 
  registerSiswa, 
  registerGuru, 
  logout, 
  getProfile 
} from "../controllers/authController.js";

import { verifyToken } from "../middleware/jwt.js";
import upload from "../middleware/upload-foto.js";

const router = Router();

// Gunakan fungsi langsung tanpa awalan AuthController.
router.post("/login", login);
router.post("/register", register);

// PERHATIKAN: Nama field di upload.single() harus sesuai dengan yang dikirim Frontend
// Jika di frontend namanya "foto_siswa", maka ganti "foto" jadi "foto_siswa"
router.post("/register-siswa", upload.single("foto"), registerSiswa);
router.post("/register-guru", upload.single("foto"), registerGuru);

router.post("/logout", verifyToken, logout);
router.get("/profile", verifyToken, getProfile);

export default router;
