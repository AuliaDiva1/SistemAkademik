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
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            for (let i = 0; i < sheets.length; i++) {
                const canvas = await html2canvas(sheets[i], { scale: 3, useCORS: true });
                const imgData = canvas.toDataURL('image/jpeg', 1.0);
                if (i > 0) pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
            }

            pdf.save(`Raport_${biodata?.NAMA || 'Siswa'}.pdf`);
            document.body.removeChild(loadingEl);
        } catch (error) {
            console.error(error);
            const loadingEl = document.getElementById('pdf-loading');
            if (loadingEl) document.body.removeChild(loadingEl);
            alert('Gagal mengunduh PDF');
        }
    };

    return (
        <Dialog 
            header="Preview Buku Induk & Raport" 
            visible={visible} 
            style={{ width: '95vw' }} 
            onHide={onHide}
            footer={
                <div className="flex justify-content-end gap-2">
                    <Button label="Tutup" icon="pi pi-times" className="p-button-text" onClick={onHide} />
                    <Button label="Download PDF" icon="pi pi-download" severity="info" onClick={handleDownloadPDF} />
                    <Button label="Cetak" icon="pi pi-print" severity="success" onClick={handlePrint} />
                </div>
            }
        >
            <div id="print-area" ref={printRef} style={{ backgroundColor: '#ccc', padding: '20px' }}>
                <style>
                    {`
                        .sheet {
                            background: white;
                            width: 210mm;
                            min-height: 296mm;
                            padding: 20mm;
                            margin: 10px auto;
                            box-shadow: 0 0 10px rgba(0,0,0,0.5);
                            box-sizing: border-box;
                        }
                        @media print {
                            body * { visibility: hidden; }
                            #print-area, #print-area * { visibility: visible; }
                            #print-area { position: absolute; left: 0; top: 0; width: 100%; background: none; padding: 0; }
                            .sheet { box-shadow: none; margin: 0; page-break-after: always; }
                        }
                    `}
                </style>

                {/* HALAMAN 1: BUKU INDUK */}
                <div className="sheet">
                    <HeaderSekolah />
                    <h3 style={{ textAlign: 'center', textDecoration: 'underline' }}>BUKU INDUK SISWA</h3>
                    <div style={{ display: 'flex', marginTop: '20px' }}>
                        <div style={{ flex: 1 }}>
                            <SectionTitle title="A. KETERANGAN DIRI SISWA" />
                            <InfoRow label="1. Nama Lengkap" value={biodata?.NAMA} />
                            <InfoRow label="2. NIS / NISN" value={`${biodata?.NIS} / ${biodata?.NISN}`} />
                            <InfoRow label="3. Tempat, Tgl Lahir" value={`${biodata?.TEMPAT_LAHIR}, ${biodata?.TGL_LAHIR}`} />
                            <InfoRow label="4. Jenis Kelamin" value={biodata?.GENDER === 'L' ? 'Laki-laki' : 'Perempuan'} />
                            <InfoRow label="5. Alamat" value={biodata?.ALAMAT} />
                            
                            <SectionTitle title="B. KETERANGAN ORANG TUA" />
                            <InfoRow label="1. Nama Ayah" value={biodata?.NAMA_AYAH} />
                            <InfoRow label="2. Nama Ibu" value={biodata?.NAMA_IBU} />
                        </div>
                        <div style={{ width: '150px', textAlign: 'center' }}>
                            <div style={{ width: '3cm', height: '4cm', border: '1px solid black', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10pt' }}>FOTO 3x4</div>
                        </div>
                    </div>
                    <TandaTangan position="right" ttd={tanda_tangan} role="Kepala Sekolah" />
                </div>

                {/* HALAMAN 2: RAPORT */}
                <div className="sheet">
                    <HeaderSekolah />
                    <h3 style={{ textAlign: 'center' }}>LAPORAN HASIL BELAJAR (RAPORT)</h3>
                    
                    <table style={{ width: '100%', marginBottom: '10px', fontSize: '10pt' }}>
                        <tbody>
                            <tr>
                                <td>Nama: <strong>{biodata?.NAMA}</strong></td>
                                <td>Kelas: <strong>{biodata?.KELAS_AKTIF}</strong></td>
                            </tr>
                            <tr>
                                <td>NIS: {biodata?.NIS}</td>
                                <td>Semester: {akademik?.semester}</td>
                            </tr>
                        </tbody>
                    </table>

                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black', fontSize: '9pt' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f0f0f0' }}>
                                <th style={borderStyle}>No</th>
                                <th style={borderStyle}>Mata Pelajaran</th>
                                <th style={borderStyle}>P</th>
                                <th style={borderStyle}>K</th>
                                <th style={borderStyle}>Capaian Kompetensi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(nilaiRaport)
                                // FILTER LOGIC: Hanya tampilkan kategori yang sesuai dengan jurusan
                                .filter(([kategori]) => {
                                    const kelas = biodata?.KELAS_AKTIF?.toUpperCase() || "";
                                    if (kelas.includes("IPA") && kategori.toUpperCase().includes("IPS")) return false;
                                    if (kelas.includes("IPS") && kategori.toUpperCase().includes("IPA")) return false;
                                    return true;
                                })
                                .map(([kategori, mapels]) => (
                                    <React.Fragment key={kategori}>
                                        <tr style={{ backgroundColor: '#f9f9f9', fontWeight: 'bold' }}>
                                            <td colSpan="5" style={borderStyle}>{kategori}</td>
                                        </tr>
                                        {mapels.map((m, idx) => (
                                            <tr key={idx}>
                                                <td style={{ ...borderStyle, textAlign: 'center' }}>{idx + 1}</td>
                                                <td style={borderStyle}>{m.NAMA_MAPEL}</td>
                                                <td style={{ ...borderStyle, textAlign: 'center' }}>{m.NILAI_P || '--'}</td>
                                                <td style={{ ...borderStyle, textAlign: 'center' }}>{m.NILAI_K || '--'}</td>
                                                <td style={borderStyle}>{m.DESKRIPSI_P || '-'}</td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Dialog>
    );
}

// Sub-Components untuk merapikan kode
const borderStyle = { border: '1px solid black', padding: '5px' };

const HeaderSekolah = () => (
    <div style={{ textAlign: 'center', borderBottom: '3px double black', paddingBottom: '10px', marginBottom: '20px' }}>
        <div style={{ fontSize: '12pt' }}>PEMERINTAH PROVINSI JAWA TIMUR</div>
        <div style={{ fontSize: '14pt', fontWeight: 'bold' }}>SMA NEGERI 1 MADIUN</div>
        <div style={{ fontSize: '9pt' }}>Jl. Pendidikan No. 123, Madiun | Telp: (0351) 123456</div>
    </div>
);

const SectionTitle = ({ title }) => (
    <div style={{ fontWeight: 'bold', borderBottom: '1px solid black', margin: '10px 0' }}>{title}</div>
);

const InfoRow = ({ label, value }) => (
    <div style={{ display: 'flex', fontSize: '10pt', marginBottom: '3px' }}>
        <div style={{ width: '150px' }}>{label}</div>
        <div style={{ width: '10px' }}>:</div>
        <div style={{ fontWeight: '500' }}>{value || '-'}</div>
    </div>
);

const TandaTangan = ({ position, ttd, role }) => (
    <div style={{ marginTop: '30px', display: 'flex', justifyContent: position === 'right' ? 'flex-end' : 'flex-start' }}>
        <div style={{ textAlign: 'center', width: '200px' }}>
            <div>Madiun, {new Date().toLocaleDateString('id-ID')}</div>
            <div style={{ fontWeight: 'bold' }}>{role},</div>
            <div style={{ height: '60px' }}></div>
            <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{ttd?.kepala_sekolah?.nama || '......................'}</div>
            <div>NIP. {ttd?.kepala_sekolah?.nip || '-'}</div>
        </div>
    </div>
);
