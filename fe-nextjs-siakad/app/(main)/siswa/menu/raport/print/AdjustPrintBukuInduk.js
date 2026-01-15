import React, { useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

export default function AdjustPrintBukuInduk({ visible, onHide, dataRaport }) {
    const printRef = useRef();

    if (!dataRaport) return null;

    const { biodata, akademik, tanda_tangan } = dataRaport;
    const nilaiRaport = akademik?.nilai_raport || {};

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        try {
            const loadingEl = document.createElement('div');
            loadingEl.id = 'pdf-loading';
            loadingEl.innerHTML = `
                <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;">
                    <div style="background:white;padding:30px;border-radius:10px;text-align:center;">
                        <div style="font-size:18px;font-weight:bold;margin-bottom:10px;">Generating PDF...</div>
                        <div style="font-size:14px;color:#666;">Mohon tunggu sebentar</div>
                    </div>
                </div>
            `;
            document.body.appendChild(loadingEl);

            const jsPDF = (await import('jspdf')).default;
            const html2canvas = (await import('html2canvas')).default;
            
            const sheets = document.querySelectorAll('.sheet');
            
            if (sheets.length === 0) {
                alert('Tidak ada halaman untuk dicetak!');
                return;
            }

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: false
            });

            const pageWidth = 210;

            for (let i = 0; i < sheets.length; i++) {
                const sheet = sheets[i];
                
                const canvas = await html2canvas(sheet, {
                    scale: 3,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    windowWidth: 794,
                    windowHeight: 1123,
                });

                const imgData = canvas.toDataURL('image/jpeg', 1.0);
                const imgWidth = pageWidth;
                const imgHeight = (canvas.height * pageWidth) / canvas.width;
                
                if (i > 0) {
                    pdf.addPage();
                }
                
                pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
            }

            pdf.save(`Buku_Induk_${biodata?.NAMA || 'Siswa'}.pdf`);
            document.body.removeChild(loadingEl);
            
        } catch (error) {
            console.error('Error:', error);
            const loadingEl = document.getElementById('pdf-loading');
            if (loadingEl) document.body.removeChild(loadingEl);
            
            if (error.message?.includes('Cannot find module')) {
                alert('Library belum terinstall!\n\nJalankan: npm install jspdf html2canvas');
            } else {
                alert('Gagal mengunduh PDF: ' + error.message);
            }
        }
    };

    return (
        <Dialog 
            header="Preview Buku Induk Siswa" 
            visible={visible} 
            style={{ width: '95vw', maxHeight: '90vh' }} 
            onHide={onHide}
            maximizable
            footer={
                <div className="flex justify-content-end gap-2">
                    <Button label="Tutup" icon="pi pi-times" className="p-button-text" onClick={onHide} />
                    <Button label="Download PDF" icon="pi pi-download" severity="info" onClick={handleDownloadPDF} />
                    <Button label="Cetak Sekarang" icon="pi pi-print" severity="success" onClick={handlePrint} />
                </div>
            }
        >
            <div className="preview-wrapper" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div id="print-area" className="print-container" ref={printRef}>
                    
                    {/* ================= HALAMAN 1: BUKU INDUK ================= */}
                    <div className="sheet">
                        {/* Header */}
                        <table style={{ width: '100%', marginBottom: '15px', borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr>
                                    <td style={{ width: '15%', verticalAlign: 'middle', textAlign: 'center' }}>
                                        <div style={{ 
                                            width: '80px', 
                                            height: '80px', 
                                            border: '2px solid #000', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            margin: '0 auto',
                                            fontSize: '10pt'
                                        }}>LOGO</div>
                                    </td>
                                    <td style={{ width: '70%', textAlign: 'center', verticalAlign: 'middle' }}>
                                        <div style={{ fontSize: '11pt', fontWeight: 'normal', marginBottom: '2px' }}>PEMERINTAH PROVINSI JAWA TIMUR</div>
                                        <div style={{ fontSize: '11pt', fontWeight: 'normal', marginBottom: '2px' }}>DINAS PENDIDIKAN</div>
                                        <div style={{ fontSize: '18pt', fontWeight: 'bold', marginTop: '5px', marginBottom: '5px' }}>SMA NEGERI 1 MADIUN</div>
                                        <div style={{ fontSize: '9pt', marginTop: '5px' }}>
                                            Jl. Pendidikan No. 123, Madiun 63137<br/>
                                            Telp. (0351) 123456 | Email: sman1madiun@gmail.com
                                        </div>
                                    </td>
                                    <td style={{ width: '15%' }}></td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <div style={{ borderTop: '3px solid #000', marginBottom: '2px' }}></div>
                        <div style={{ borderTop: '1px solid #000', marginBottom: '20px' }}></div>

                        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                            <div style={{ fontSize: '14pt', fontWeight: 'bold', textDecoration: 'underline', marginBottom: '5px' }}>BUKU INDUK SISWA</div>
                            <div style={{ fontSize: '10pt' }}>SMA NEGERI 1 MADIUN</div>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr>
                                    <td style={{ width: '70%', verticalAlign: 'top', paddingRight: '20px' }}>
                                        {/* Section A */}
                                        <div style={{ 
                                            fontSize: '11pt', 
                                            fontWeight: 'bold', 
                                            marginBottom: '10px',
                                            paddingBottom: '5px',
                                            borderBottom: '2px solid #000'
                                        }}>A. KETERANGAN TENTANG DIRI SISWA</div>
                                        
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt', marginBottom: '20px' }}>
                                            <tbody>
                                                <tr>
                                                    <td style={{ width: '30px', padding: '4px 0', verticalAlign: 'top' }}>1.</td>
                                                    <td style={{ width: '220px', padding: '4px 0' }}>Nomor Induk Siswa (NIS)</td>
                                                    <td style={{ padding: '4px 0' }}>: <strong>{biodata?.NIS}</strong></td>
                                                </tr>
                                                <tr>
                                                    <td style={{ padding: '4px 0', verticalAlign: 'top' }}>2.</td>
                                                    <td style={{ padding: '4px 0' }}>Nomor Induk Siswa Nasional (NISN)</td>
                                                    <td style={{ padding: '4px 0' }}>: <strong>{biodata?.NISN}</strong></td>
                                                </tr>
                                                <tr>
                                                    <td style={{ padding: '4px 0', verticalAlign: 'top' }}>3.</td>
                                                    <td style={{ padding: '4px 0' }}>Nama Lengkap Siswa</td>
                                                    <td style={{ padding: '4px 0' }}>: <strong>{biodata?.NAMA}</strong></td>
                                                </tr>
                                                <tr>
                                                    <td style={{ padding: '4px 0', verticalAlign: 'top' }}>4.</td>
                                                    <td style={{ padding: '4px 0' }}>Jenis Kelamin</td>
                                                    <td style={{ padding: '4px 0' }}>: {biodata?.GENDER === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
                                                </tr>
                                                <tr>
                                                    <td style={{ padding: '4px 0', verticalAlign: 'top' }}>5.</td>
                                                    <td style={{ padding: '4px 0' }}>Tempat Lahir</td>
                                                    <td style={{ padding: '4px 0' }}>: {biodata?.TEMPAT_LAHIR}</td>
                                                </tr>
                                                <tr>
                                                    <td style={{ padding: '4px 0', verticalAlign: 'top' }}>6.</td>
                                                    <td style={{ padding: '4px 0' }}>Tanggal Lahir</td>
                                                    <td style={{ padding: '4px 0' }}>: {biodata?.TGL_LAHIR || '-'}</td>
                                                </tr>
                                                <tr>
                                                    <td style={{ padding: '4px 0', verticalAlign: 'top' }}>7.</td>
                                                    <td style={{ padding: '4px 0' }}>Agama</td>
                                                    <td style={{ padding: '4px 0' }}>: {biodata?.AGAMA}</td>
                                                </tr>
                                                <tr>
                                                    <td style={{ padding: '4px 0', verticalAlign: 'top' }}>8.</td>
                                                    <td style={{ padding: '4px 0' }}>Alamat Lengkap</td>
                                                    <td style={{ padding: '4px 0' }}>: {biodata?.ALAMAT}</td>
                                                </tr>
                                                <tr>
                                                    <td style={{ padding: '4px 0', verticalAlign: 'top' }}>9.</td>
                                                    <td style={{ padding: '4px 0' }}>Nomor Telepon/HP</td>
                                                    <td style={{ padding: '4px 0' }}>: {biodata?.NO_TELP || '-'}</td>
                                                </tr>
                                                <tr>
                                                    <td style={{ padding: '4px 0', verticalAlign: 'top' }}>10.</td>
                                                    <td style={{ padding: '4px 0' }}>Tahun Masuk</td>
                                                    <td style={{ padding: '4px 0' }}>: <strong>{biodata?.TAHUN_MASUK || '2022'}</strong></td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        {/* Section B */}
                                        <div style={{ 
                                            fontSize: '11pt', 
                                            fontWeight: 'bold', 
                                            marginBottom: '10px',
                                            paddingBottom: '5px',
                                            borderBottom: '2px solid #000'
                                        }}>B. KETERANGAN TENTANG ORANG TUA/WALI</div>
                                        
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                                            <tbody>
                                                <tr>
                                                    <td style={{ width: '30px', padding: '4px 0', verticalAlign: 'top' }}>1.</td>
                                                    <td style={{ width: '220px', padding: '4px 0' }}>Nama Ayah Kandung</td>
                                                    <td style={{ padding: '4px 0' }}>: {biodata?.NAMA_AYAH}</td>
                                                </tr>
                                                <tr>
                                                    <td style={{ padding: '4px 0', verticalAlign: 'top' }}>2.</td>
                                                    <td style={{ padding: '4px 0' }}>Pekerjaan Ayah</td>
                                                    <td style={{ padding: '4px 0' }}>: {biodata?.PEKERJAAN_AYAH}</td>
                                                </tr>
                                                <tr>
                                                    <td style={{ padding: '4px 0', verticalAlign: 'top' }}>3.</td>
                                                    <td style={{ padding: '4px 0' }}>Nama Ibu Kandung</td>
                                                    <td style={{ padding: '4px 0' }}>: {biodata?.NAMA_IBU}</td>
                                                </tr>
                                                <tr>
                                                    <td style={{ padding: '4px 0', verticalAlign: 'top' }}>4.</td>
                                                    <td style={{ padding: '4px 0' }}>Pekerjaan Ibu</td>
                                                    <td style={{ padding: '4px 0' }}>: {biodata?.PEKERJAAN_IBU}</td>
                                                </tr>
                                                <tr>
                                                    <td style={{ padding: '4px 0', verticalAlign: 'top' }}>5.</td>
                                                    <td style={{ padding: '4px 0' }}>Alamat Orang Tua</td>
                                                    <td style={{ padding: '4px 0' }}>: {biodata?.ALAMAT_ORTU || biodata?.ALAMAT}</td>
                                                </tr>
                                                <tr>
                                                    <td style={{ padding: '4px 0', verticalAlign: 'top' }}>6.</td>
                                                    <td style={{ padding: '4px 0' }}>Nama Wali (jika ada)</td>
                                                    <td style={{ padding: '4px 0' }}>: {biodata?.NAMA_WALI || '-'}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                    
                                    <td style={{ width: '30%', verticalAlign: 'top', textAlign: 'center' }}>
                                        <div style={{ 
                                            width: '113px', 
                                            height: '151px', 
                                            border: '2px solid #000',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto',
                                            fontSize: '9pt',
                                            color: '#999',
                                            backgroundColor: '#fafafa',
                                            lineHeight: '1.5'
                                        }}>
                                            PAS FOTO<br/>3 x 4 cm<br/>Berwarna
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Tanda Tangan */}
                        <div style={{ marginTop: '80px' }}>
                            <table style={{ width: '100%', fontSize: '10pt' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ width: '50%' }}></td>
                                        <td style={{ width: '50%', textAlign: 'center' }}>
                                            <div>{tanda_tangan?.titimangsa || 'Madiun, -'}</div>
                                            <div style={{ fontWeight: 'bold', marginTop: '5px' }}>Kepala Sekolah,</div>
                                            <div style={{ height: '70px' }}></div>
                                            <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>
                                                {tanda_tangan?.kepala_sekolah?.nama || '-'}
                                            </div>
                                            <div>NIP. {tanda_tangan?.kepala_sekolah?.nip || '-'}</div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* PAGE BREAK */}
                    <div className="page-break"></div>

                    {/* ================= HALAMAN 2: RAPOR ================= */}
                    <div className="sheet">
                        {/* Header */}
                        <table style={{ width: '100%', marginBottom: '15px', borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr>
                                    <td style={{ width: '15%', verticalAlign: 'middle', textAlign: 'center' }}>
                                        <div style={{ 
                                            width: '80px', 
                                            height: '80px', 
                                            border: '2px solid #000', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            margin: '0 auto',
                                            fontSize: '10pt'
                                        }}>LOGO</div>
                                    </td>
                                    <td style={{ width: '70%', textAlign: 'center', verticalAlign: 'middle' }}>
                                        <div style={{ fontSize: '11pt', fontWeight: 'normal', marginBottom: '2px' }}>PEMERINTAH PROVINSI JAWA TIMUR</div>
                                        <div style={{ fontSize: '11pt', fontWeight: 'normal', marginBottom: '2px' }}>DINAS PENDIDIKAN</div>
                                        <div style={{ fontSize: '18pt', fontWeight: 'bold', marginTop: '5px', marginBottom: '5px' }}>SMA NEGERI 1 MADIUN</div>
                                        <div style={{ fontSize: '9pt', marginTop: '5px' }}>
                                            Jl. Pendidikan No. 123, Madiun 63137<br/>
                                            Telp. (0351) 123456 | Email: sman1madiun@gmail.com
                                        </div>
                                    </td>
                                    <td style={{ width: '15%' }}></td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <div style={{ borderTop: '3px solid #000', marginBottom: '2px' }}></div>
                        <div style={{ borderTop: '1px solid #000', marginBottom: '20px' }}></div>

                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <div style={{ fontSize: '13pt', fontWeight: 'bold', textDecoration: 'underline' }}>LAPORAN HASIL BELAJAR SISWA</div>
                        </div>

                        {/* Identitas */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt', marginBottom: '15px' }}>
                            <tbody>
                                <tr>
                                    <td style={{ width: '22%', padding: '3px 0' }}>Nama Siswa</td>
                                    <td style={{ width: '2%', padding: '3px 0' }}>:</td>
                                    <td style={{ width: '38%', padding: '3px 0' }}><strong>{biodata?.NAMA}</strong></td>
                                    <td style={{ width: '18%', padding: '3px 0' }}>Kelas</td>
                                    <td style={{ width: '2%', padding: '3px 0' }}>:</td>
                                    <td style={{ padding: '3px 0' }}><strong>{biodata?.KELAS_AKTIF}</strong></td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '3px 0' }}>Nomor Induk / NISN</td>
                                    <td style={{ padding: '3px 0' }}>:</td>
                                    <td style={{ padding: '3px 0' }}>{biodata?.NIS} / {biodata?.NISN}</td>
                                    <td style={{ padding: '3px 0' }}>Semester</td>
                                    <td style={{ padding: '3px 0' }}>:</td>
                                    <td style={{ padding: '3px 0' }}><strong>{akademik?.semester}</strong></td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '3px 0' }}>Nama Sekolah</td>
                                    <td style={{ padding: '3px 0' }}>:</td>
                                    <td style={{ padding: '3px 0' }}>SMA NEGERI 1 MADIUN</td>
                                    <td style={{ padding: '3px 0' }}>Tahun Pelajaran</td>
                                    <td style={{ padding: '3px 0' }}>:</td>
                                    <td style={{ padding: '3px 0' }}><strong>{akademik?.tahun_ajaran}</strong></td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '3px 0' }}>Alamat Sekolah</td>
                                    <td style={{ padding: '3px 0' }}>:</td>
                                    <td colSpan="4" style={{ padding: '3px 0' }}>Jl. Pendidikan No. 123, Madiun</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Tabel Nilai */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '10pt' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#e0e0e0' }}>
                                    <th rowSpan="2" style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '5%' }}>No</th>
                                    <th rowSpan="2" style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', width: '30%' }}>Mata Pelajaran</th>
                                    <th colSpan="2" style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '10%' }}>Nilai</th>
                                    <th rowSpan="2" style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', width: '55%' }}>Capaian Kompetensi</th>
                                </tr>
                                <tr style={{ backgroundColor: '#e0e0e0' }}>
                                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontSize: '9pt' }}>P</th>
                                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontSize: '9pt' }}>K</th>
                                </tr>
                            </thead>
                          <tbody>
                                {Object.entries(nilaiRaport)
                                    .filter(([kategori]) => {
                                        // Ambil nama jurusan dari data biodata siswa
                                        const jurusanSiswa = biodata?.NAMA_JURUSAN || ""; 
                                        const kategoriUpper = kategori.toUpperCase();
                            
                                        // 1. Jika kategori mengandung kata MIPA atau IPA
                                        if (kategoriUpper.includes("MIPA") || kategoriUpper.includes("IPA")) {
                                            // Hanya tampilkan jika siswa berasal dari jurusan IPA (mengandung kata 'Alam')
                                            return jurusanSiswa.toLowerCase().includes("alam");
                                        }
                            
                                        // 2. Jika kategori mengandung kata IPS, SOSIAL, atau IIS
                                        if (kategoriUpper.includes("IPS") || kategoriUpper.includes("SOSIAL") || kategoriUpper.includes("IIS")) {
                                            // Hanya tampilkan jika siswa berasal dari jurusan IPS (mengandung kata 'Sosial')
                                            return jurusanSiswa.toLowerCase().includes("sosial");
                                        }
                            
                                        // 3. Untuk kategori lainnya (Umum/Wajib), tampilkan semua
                                        return true;
                                    })
                                    .map(([kategori, mapels]) => (
                                        <React.Fragment key={kategori}>
                                            <tr style={{ backgroundColor: '#f5f5f5' }}>
                                                <td colSpan="5" style={{ border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>
                                                    {kategori}
                                                </td>
                                            </tr>
                                            {mapels.map((m, idx) => (
                                                <tr key={idx}>
                                                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{idx + 1}</td>
                                                    <td style={{ border: '1px solid #000', padding: '6px' }}>{m.NAMA_MAPEL}</td>
                                                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>{m.NILAI_P || '-'}</td>
                                                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>{m.NILAI_K || '-'}</td>
                                                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'justify', fontSize: '9pt', lineHeight: '1.3' }}>
                                                        {m.DESKRIPSI_P || `Menunjukkan pemahaman yang baik dalam ${m.NAMA_MAPEL}.`}
                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))}
                            </tbody>
                                                    </table>

                        <div style={{ fontSize: '9pt', fontStyle: 'italic', marginTop: '8px' }}>
                            <em>Keterangan: P = Pengetahuan | K = Keterampilan</em>
                        </div>

                        {/* Ketidakhadiran */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '10pt', marginTop: '15px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#e0e0e0' }}>
                                    <th colSpan="2" style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>KETIDAKHADIRAN</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ border: '1px solid #000', padding: '8px', width: '70%' }}>Sakit</td>
                                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{akademik?.kehadiran?.sakit || 0} hari</td>
                                </tr>
                                <tr>
                                    <td style={{ border: '1px solid #000', padding: '8px' }}>Izin</td>
                                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{akademik?.kehadiran?.izin || 0} hari</td>
                                </tr>
                                <tr>
                                    <td style={{ border: '1px solid #000', padding: '8px' }}>Tanpa Keterangan</td>
                                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{akademik?.kehadiran?.alpa || 0} hari</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Tanda Tangan */}
                        <table style={{ width: '100%', fontSize: '10pt', marginTop: '40px' }}>
                            <tbody>
                                <tr>
                                    <td style={{ width: '33%', textAlign: 'center', verticalAlign: 'top' }}>
                                        <div>Mengetahui,</div>
                                        <div style={{ fontWeight: 'bold' }}>Orang Tua/Wali</div>
                                        <div style={{ height: '70px' }}></div>
                                        <div style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: '150px', paddingBottom: '2px' }}>
                                            &nbsp;
                                        </div>
                                    </td>
                                    <td style={{ width: '34%', textAlign: 'center', verticalAlign: 'top' }}>
                                        <div>{tanda_tangan?.titimangsa || 'Madiun, -'}</div>
                                        <div style={{ fontWeight: 'bold' }}>Wali Kelas</div>
                                        <div style={{ height: '70px' }}></div>
                                        <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>
                                            {tanda_tangan?.wali_kelas?.nama || 'Muhadi'}
                                        </div>
                                        <div>NIP. {tanda_tangan?.wali_kelas?.nip || '1234567891234567891'}</div>
                                    </td>
                                    <td style={{ width: '33%', textAlign: 'center', verticalAlign: 'top' }}>
                                        <div>Mengetahui,</div>
                                        <div style={{ fontWeight: 'bold' }}>Kepala Sekolah</div>
                                        <div style={{ height: '70px' }}></div>
                                        <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>
                                            {tanda_tangan?.kepala_sekolah?.nama || '-'}
                                        </div>
                                        <div>NIP. {tanda_tangan?.kepala_sekolah?.nip || '-'}</div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                * {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                
                .print-container { 
                    background: #e5e5e5; 
                    padding: 20px 0; 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    gap: 20px;
                    font-family: 'Times New Roman', Times, serif;
                    width: 100%;
                    max-width: 210mm;
                    margin: 0 auto;
                }
                
                .sheet { 
                    background: white; 
                    width: 210mm; 
                    min-height: 297mm; 
                    padding: 20mm; 
                    box-shadow: 0 4px 10px rgba(0,0,0,0.15); 
                    box-sizing: border-box;
                    position: relative;
                    page-break-after: always;
                    page-break-inside: avoid;
                }
                
                .page-break {
                    display: block;
                    height: 20px;
                    page-break-before: always;
                    page-break-after: always;
                    background: transparent;
                }

                @media print {
                    @page { 
                        size: A4 portrait; 
                        margin: 0; 
                    }
                    
                    body * { 
                        visibility: hidden; 
                    }
                    
                    .print-container, .print-container * { 
                        visibility: visible; 
                    }
                    
                    .print-container { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%; 
                        background: white; 
                        padding: 0; 
                        gap: 0; 
                    }
                    
                    .sheet { 
                        box-shadow: none; 
                        border: none; 
                        margin: 0; 
                        padding: 20mm; 
                        page-break-after: always !important; 
                        page-break-inside: avoid;
                    }
                    
                    .p-dialog-header, 
                    .p-dialog-footer, 
                    .p-dialog-mask,
                    .preview-wrapper { 
                        display: none !important; 
                    }
                    
                    .page-break { 
                        display: block; 
                        page-break-before: always; 
                        page-break-after: always;
                    }
                }
            `}</style>
        </Dialog>
    );
}
