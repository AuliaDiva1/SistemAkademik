/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from 'primereact/button';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import ToastNotifier from '@/app/components/ToastNotifier';
import CustomDataTable from '@/app/components/DataTable';
import { Skeleton } from 'primereact/skeleton';
import FormAgendaMengajar from '@/app/(main)/guru/menu/agenda/components/FormAgenda';
import AdjustPrintMarginAbsensi from './print/AdjustPrintMarginAbsensi';
import AdjustPrintMarginJadwal from './print/AdjustPrintMarginJadwal';
import dynamic from 'next/dynamic';

const PDFViewer = dynamic(() => import('./print/PDFViewer'), {
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="4" />
    </div>
  ),
  ssr: false,
});

export default function AgendaMengajarPage() {
  const toastRef = useRef(null);

  const statusOptions = ['Belum Dimulai', 'Selesai', 'Dibatalkan'];
    
  const emptyAgenda = { 
    id: null, 
    tanggal: null, 
    jadwalId: null,
    kelas: '', 
    mataPelajaran: '', 
    materi: '', 
    status: 'Belum Dimulai' 
  };

  // State untuk data dari BE
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [jadwalGuru, setJadwalGuru] = useState([]); // Jadwal milik guru
  const [agendaList, setAgendaList] = useState([]);
  const [selectedAgenda, setSelectedAgenda] = useState(emptyAgenda);
  const [dialogMode, setDialogMode] = useState(null); // 'add' | 'edit'
  const [globalFilter, setGlobalFilter] = useState('');
  const [filterHari, setFilterHari] = useState(null);

  // State untuk Print
  const [adjustAbsensiDialog, setAdjustAbsensiDialog] = useState(false);
  const [adjustJadwalDialog, setAdjustJadwalDialog] = useState(false);
  const [selectedAgendaForPrint, setSelectedAgendaForPrint] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [jsPdfPreviewOpen, setJsPdfPreviewOpen] = useState(false);

  // Dropdown options untuk hari
  const hariOptions = [
    { label: 'Semua Hari', value: null },
    { label: 'Senin', value: 'Senin' },
    { label: 'Selasa', value: 'Selasa' },
    { label: 'Rabu', value: 'Rabu' },
    { label: 'Kamis', value: 'Kamis' },
    { label: 'Jumat', value: 'Jumat' },
    { label: 'Sabtu', value: 'Sabtu' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      const token = getToken();
      
      if (!token) {
        toastRef.current?.showToast('01', 'Sesi login tidak ditemukan. Silakan login kembali.');
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }, 2000);
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // 1. Fetch profile user
      const resProfile = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
        headers
      });

      if (!resProfile.ok) {
        throw new Error('Gagal mengambil profil user');
      }

      const profileData = await resProfile.json();
      
      if (profileData.status !== "00" || profileData.user.role !== 'GURU') {
        throw new Error('Akses ditolak. Hanya guru yang dapat mengakses halaman ini.');
      }

      setUserProfile(profileData.user);
      
      const nipGuru = profileData.user.guru?.NIP;

      if (!nipGuru) {
        throw new Error('Data guru tidak lengkap. NIP tidak ditemukan.');
      }

      // 2. Fetch jadwal
      const resJadwal = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jadwal`, {
        headers
      });
      
      if (!resJadwal.ok) {
        throw new Error('Gagal mengambil jadwal');
      }

      const dataJadwal = await resJadwal.json();
      
      // Filter jadwal untuk guru ini saja
      const myJadwal = dataJadwal.data?.filter(j => j.guru?.NIP === nipGuru) || [];
      setJadwalGuru(myJadwal);

      // 3. TODO: Fetch agenda (jika ada endpoint untuk menyimpan agenda)
      // Untuk sementara menggunakan data dummy
      setAgendaList([]);

    } catch (error) {
      console.error('Error fetching data:', error);
      toastRef.current?.showToast('01', `Gagal memuat data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (data) => {
    let updatedList = [...agendaList];

    if (dialogMode === 'edit') {
      const index = updatedList.findIndex(a => a.id === selectedAgenda.id);
      updatedList[index] = { ...selectedAgenda, ...data };
      toastRef.current?.showToast('00', 'Agenda berhasil diperbarui!');
    } else {
      const newAgenda = { id: Date.now(), ...data };
      updatedList.push(newAgenda);
      toastRef.current?.showToast('00', 'Agenda berhasil ditambahkan!');
    }

    setAgendaList(updatedList);
    setSelectedAgenda(emptyAgenda);
    setDialogMode(null);
  };

  const handleDelete = (row) => {
    confirmDialog({
      message: `Yakin ingin menghapus agenda "${row.mataPelajaran}"?`,
      header: 'Konfirmasi Hapus',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Hapus',
      rejectLabel: 'Batal',
      acceptClassName: 'p-button-danger',
      accept: () => {
        setAgendaList(prev => prev.filter(a => a.id !== row.id));
        toastRef.current?.showToast('00', 'Agenda berhasil dihapus!');
      }
    });
  };

  const handlePrintAbsensiJadwal = (row) => {
    setSelectedAgendaForPrint(row);
    setAdjustAbsensiDialog(true);
  };

  const handlePrintAbsensi = (row) => {
    setSelectedAgendaForPrint(row);
    setAdjustAbsensiDialog(true);
  };

  const handlePrintJadwal = () => {
    console.log('Data Jadwal Guru:', jadwalGuru);
    console.log('Sample jadwal:', jadwalGuru[0]);
    if (jadwalGuru.length > 0) {
      console.log('Struktur hari:', jadwalGuru[0].hari);
      console.log('Nilai HARI:', jadwalGuru[0].hari?.HARI);
    }
    setAdjustJadwalDialog(true);
  };

  const handleClosePdfPreview = () => {
    setJsPdfPreviewOpen(false);
    setTimeout(() => {
      setPdfUrl('');
    }, 300);
  };

  const actionBodyTemplate = (row) => (
    <div className="flex gap-2">
      <Button 
        icon="pi pi-print" 
        size="small" 
        severity="success" 
        tooltip="Print Daftar Hadir"
        tooltipOptions={{ position: 'top' }}
        onClick={() => handlePrintAbsensi(row)} 
      />
      <Button 
        icon="pi pi-pencil" 
        size="small" 
        severity="warning" 
        tooltip="Edit Agenda"
        tooltipOptions={{ position: 'top' }}
        onClick={() => { 
          setSelectedAgenda(row); 
          setDialogMode('edit'); 
        }} 
      />
      <Button 
        icon="pi pi-trash" 
        size="small" 
        severity="danger" 
        tooltip="Hapus Agenda"
        tooltipOptions={{ position: 'top' }}
        onClick={() => handleDelete(row)} 
      />
    </div>
  );

  const columns = [
    { 
      field: 'tanggal', 
      header: 'Tanggal', 
      body: row => new Date(row.tanggal).toLocaleDateString('id-ID'), 
      style: { width: '120px' } 
    },
    { 
      field: 'hari', 
      header: 'Hari',
      style: { width: '100px' }
    },
    { 
      field: 'kelas', 
      header: 'Kelas' 
    },
    { 
      field: 'mataPelajaran', 
      header: 'Mata Pelajaran' 
    },
    { 
      field: 'materi', 
      header: 'Materi' 
    },
    { 
      field: 'status', 
      header: 'Status',
      body: (row) => (
        <span className={`px-2 py-1 border-round text-xs font-bold ${
          row.status === 'Selesai' ? 'bg-green-100 text-green-700' :
          row.status === 'Dibatalkan' ? 'bg-red-100 text-red-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {row.status}
        </span>
      ),
      style: { width: '140px' }
    },
    { 
      header: 'Aksi', 
      body: actionBodyTemplate, 
      style: { width: '180px' } 
    },
  ];

  // Filter agenda
  const filteredAgenda = agendaList.filter(a => {
    const matchesSearch = a.kelas.toLowerCase().includes(globalFilter.toLowerCase()) ||
      a.mataPelajaran.toLowerCase().includes(globalFilter.toLowerCase()) ||
      a.materi.toLowerCase().includes(globalFilter.toLowerCase());
    
    const matchesHari = !filterHari || a.hari === filterHari;

    return matchesSearch && matchesHari;
  });

  // Filter jadwal for print based on filterHari
  const filteredJadwalForPrint = filterHari 
    ? jadwalGuru.filter(j => j.hari?.HARI === filterHari)
    : jadwalGuru;

  if (loading) {
    return (
      <div className="card p-4">
        <Skeleton height="2rem" width="200px" className="mb-4" />
        <div className="flex justify-content-end gap-3 mb-3">
          <Skeleton height="40px" width="300px" />
          <Skeleton height="40px" width="150px" />
        </div>
        <Skeleton height="400px" />
      </div>
    );
  }

  return (
    <div className="card p-4">
      <div className="flex justify-content-between align-items-center mb-4">
        <h3 className="text-xl font-semibold m-0">Agenda Mengajar</h3>
        <span className="text-500">
          Guru: <span className="font-semibold text-900">{userProfile?.name || '-'}</span>
        </span>
      </div>

      <div className="flex justify-content-between gap-3 mb-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText
              placeholder="Cari kelas, mata pelajaran, atau materi..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </span>
          <Dropdown
            value={filterHari}
            options={hariOptions}
            onChange={(e) => setFilterHari(e.value)}
            placeholder="Filter Hari"
            style={{ width: '150px' }}
          />
        </div>
        <div className="flex gap-2">
          <Button
            icon="pi pi-print"
            className="p-button-warning"
            tooltip="Cetak Jadwal Mengajar"
            tooltipOptions={{ position: 'top' }}
            onClick={handlePrintJadwal}
            disabled={jadwalGuru.length === 0}
          />
          <Button
            label="Tambah Agenda"
            icon="pi pi-plus"
            onClick={() => { 
              setSelectedAgenda(emptyAgenda); 
              setDialogMode('add'); 
            }}
          />
        </div>
      </div>

      {/* Tabel Jadwal Guru */}
      <div className="mb-4">
        <div className="flex justify-content-between align-items-center mb-3">
          <h5 className="m-0">Jadwal Mengajar Anda</h5>
          <Button 
            label="Refresh" 
            icon="pi pi-refresh" 
            outlined 
            size="small"
            onClick={fetchData}
          />
        </div>
        
        {jadwalGuru.length > 0 ? (
          <CustomDataTable 
            data={jadwalGuru} 
            columns={[
              { 
                field: 'hari.HARI', 
                header: 'Hari',
                body: (row) => row.hari?.HARI || '-',
                style: { width: '100px' }
              },
              { 
                field: 'jam_pelajaran.JP_KE', 
                header: 'JP',
                body: (row) => `JP ${row.jam_pelajaran?.JP_KE || '-'}`,
                style: { width: '80px' }
              },
              { 
                field: 'jam_pelajaran.WAKTU_MULAI', 
                header: 'Waktu',
                body: (row) => `${row.jam_pelajaran?.WAKTU_MULAI || '00:00'} - ${row.jam_pelajaran?.WAKTU_SELESAI || '00:00'}`,
                style: { width: '140px' }
              },
              { 
                field: 'kelas', 
                header: 'Kelas',
                body: (row) => {
                  const tingkat = row.tingkatan?.TINGKATAN || '';
                  const jurusan = row.jurusan?.NAMA_JURUSAN || '';
                  const ruang = row.kelas?.NAMA_RUANG || '';
                  return `${tingkat} ${jurusan} | ${ruang}`;
                }
              },
              { 
                field: 'mata_pelajaran.NAMA_MAPEL', 
                header: 'Mata Pelajaran',
                body: (row) => row.mata_pelajaran?.NAMA_MAPEL || '-'
              },
              { 
                header: 'Aksi', 
                body: (row) => (
                  <div className="flex gap-2">
                    <Button 
                      icon="pi pi-print" 
                      size="small" 
                      severity="success" 
                      tooltip="Print Daftar Hadir"
                      tooltipOptions={{ position: 'top' }}
                      onClick={() => handlePrintAbsensiJadwal(row)} 
                    />
                  </div>
                ),
                style: { width: '100px' }
              },
            ]} 
            paginator 
            rows={10} 
            rowsPerPageOptions={[10, 20, 50]}
          />
        ) : (
          <div className="text-center p-5 surface-100 border-round">
            <i className="pi pi-calendar-times text-6xl text-400 mb-3"></i>
            <p className="text-500 text-xl">Tidak ada jadwal mengajar</p>
          </div>
        )}
      </div>

      {/* Tabel Agenda */}
      <div className="mt-5">
        <h5 className="mb-3">Daftar Agenda & Materi Pembelajaran</h5>
        
        {filteredAgenda.length > 0 ? (
          <CustomDataTable 
            data={filteredAgenda} 
            columns={columns} 
            paginator 
            rows={10} 
            rowsPerPageOptions={[10, 20, 50]} 
          />
        ) : (
        <div className="text-center p-5 surface-100 border-round">
                    <i className="pi pi-book text-6xl text-400 mb-3"></i>
                    <p className="text-500 text-xl">Belum ada agenda pembelajaran</p>
                    {/* Perbaikan di bawah ini: menggunakan &quot; */}
                    <p className="text-400">Klik tombol &quot;Tambah Agenda&quot; untuk membuat agenda baru</p>
                  </div>
                )}
              </div>

      <FormAgendaMengajar
        isOpen={dialogMode !== null}
        onClose={() => { 
          setDialogMode(null); 
          setSelectedAgenda(emptyAgenda); 
        }}
        onSubmit={handleSubmit}
        initialData={selectedAgenda}
        jadwalGuru={jadwalGuru}
        mode={dialogMode}
        statusOptions={statusOptions}
      />

      {/* Dialog Print Absensi (per agenda) */}
      <AdjustPrintMarginAbsensi
        adjustDialog={adjustAbsensiDialog}
        setAdjustDialog={setAdjustAbsensiDialog}
        jadwalData={selectedAgendaForPrint}
        token={getToken()}
        setPdfUrl={setPdfUrl}
        setFileName={setFileName}
        setJsPdfPreviewOpen={setJsPdfPreviewOpen}
      />

      {/* Dialog Print Jadwal (Semua Jadwal) */}
      <AdjustPrintMarginJadwal
        adjustDialog={adjustJadwalDialog}
        setAdjustDialog={setAdjustJadwalDialog}
        jadwalToPrint={filteredJadwalForPrint}
        setPdfUrl={setPdfUrl}
        setFileName={setFileName}
        setJsPdfPreviewOpen={setJsPdfPreviewOpen}
        namaKurikulum={userProfile?.name || ''}
        nipKurikulum={userProfile?.guru?.NIP || ''}
      />

      {/* Dialog PDF Preview */}
      <Dialog
        visible={jsPdfPreviewOpen}
        onHide={handleClosePdfPreview}
        modal
        maximizable
        style={{ width: '90vw', height: '90vh' }}
        header={
          <div className="flex items-center gap-2">
            <i className="pi pi-file-pdf text-red-500"></i>
            <span>Preview - {fileName}</span>
          </div>
        }
        contentStyle={{ height: 'calc(90vh - 60px)', padding: 0 }}
      >
        {pdfUrl && <PDFViewer pdfUrl={pdfUrl} fileName={fileName} paperSize="A4" />}
      </Dialog>

      <ConfirmDialog />
      <ToastNotifier ref={toastRef} />
    </div>
  );
}
