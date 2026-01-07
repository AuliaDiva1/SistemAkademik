/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { DataView } from 'primereact/dataview';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Dialog } from 'primereact/dialog';
import { SplitButton } from 'primereact/splitbutton';
import { Carousel } from 'primereact/carousel';
import { useRouter } from 'next/navigation';

// --- INTERFACE DATA ---
interface InfoSekolah {
    ID: number;
    TANGGAL: string;
    KATEGORI: string;
    JUDUL: string;
    DESKRIPSI: string;
}

interface Prestasi {
    status: string;
    nama: string;
    tahun: string;
    icon: string;
    color: string;
}

const Dashboard = () => {
    const [informasi, setInformasi] = useState<InfoSekolah[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDetail, setSelectedDetail] = useState<InfoSekolah | null>(null);
    const router = useRouter();

    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const prestasiSekolah: Prestasi[] = [
        { status: 'JUARA 1', nama: 'INOVASI TEKNOLOGI', tahun: '2024', icon: 'pi-trophy', color: 'text-yellow-500' },
        { status: 'AKREDITASI A+', nama: 'UNGGUL NASIONAL', tahun: '2025', icon: 'pi-verified', color: 'text-blue-700' },
        { status: 'JUARA UMUM', nama: 'OLIMPIADE SAINS', tahun: '2024', icon: 'pi-star-fill', color: 'text-orange-500' },
    ];

    const registerItems = [
        { label: 'Siswa', icon: 'pi pi-user', command: () => router.push('/auth/register/siswa') },
        { label: 'Guru', icon: 'pi pi-briefcase', command: () => router.push('/auth/register/guru') }
    ];

    useEffect(() => {
        fetchInformasi();
    }, []);

    const fetchInformasi = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/master-infosekolah`);
            const json = await res.json();
            setInformasi(json.data || []);
        } catch (err) { 
            console.error(err); 
        } finally { 
            setLoading(false); 
        }
    };

    const prestasiTemplate = (data: Prestasi) => (
        <div className="surface-card border-1 border-200 border-round-xl p-3 m-1 text-center shadow-1">
            <i className={`pi ${data.icon} ${data.color} text-2xl mb-2`}></i>
            <div className="text-sm text-900 mb-1 uppercase" style={{ fontWeight: 400 }}>{data.status}</div>
            <div className="text-xs text-600 mb-2 uppercase" style={{ fontWeight: 400 }}>{data.nama}</div>
            <Tag severity="info" value={data.tahun} className="text-xs px-2" style={{ fontWeight: 400 }}></Tag>
        </div>
    );

    const infoItemTemplate = (item: InfoSekolah) => (
        <div className="col-12 p-1" key={item.ID}>
            <div className="flex align-items-center bg-white border-round-lg p-2 cursor-pointer hover:surface-100 transition-all border-1 border-100 shadow-sm" onClick={() => setSelectedDetail(item)}>
                <div className="flex flex-column align-items-center justify-content-center border-right-1 border-200 pr-2 mr-3 text-center" style={{ width: '50px' }}>
                    <span className="text-xl text-blue-800" style={{ fontWeight: 400 }}>{new Date(item.TANGGAL).getDate()}</span>
                    <span className="text-xs uppercase text-500" style={{ fontWeight: 400 }}>{new Date(item.TANGGAL).toLocaleDateString("id-ID", { month: 'short' })}</span>
                </div>
                <div className="flex-grow-1 overflow-hidden">
                    <h4 className="m-0 text-900 white-space-nowrap overflow-hidden text-overflow-ellipsis text-xs uppercase" style={{ fontWeight: 400 }}>{item.JUDUL}</h4>
                    <span className="text-xs text-blue-600 tracking-tighter uppercase" style={{ fontWeight: 400 }}>{item.KATEGORI}</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="grid p-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');
                body { 
                    font-family: 'Poppins', sans-serif !important; 
                    font-weight: 400;
                }
                /* Reset weight untuk elemen umum */
                h1, h2, h3, h4, h5, h6, span, p, div, button {
                    font-weight: 400;
                }
                /* Khusus class bold */
                .font-bold-special {
                    font-weight: 700 !important;
                }
            `}</style>

            {/* --- SEKSI HEADER --- */}
            <div className="col-12">
                <div className="card flex flex-column md:flex-row align-items-center justify-content-between p-4 shadow-2" 
                     style={{ 
                        borderRadius: '1rem', 
                        background: 'linear-gradient(90deg, #bbdefb 0%, #bbdefb 50%, #ffffff 100%)',
                        border: '1px solid #90caf9'
                     }}>
                    <div className="p-3">
                        <h2 className="text-blue-900 mb-2 uppercase tracking-tighter font-bold-special" style={{ fontSize: '2.5rem', lineHeight: '1.1' }}>
                            Selamat Datang di <br/> SIAKAD Digital
                        </h2>
                        <p className="text-700 m-0 uppercase text-sm max-w-30rem">
                            Portal Akademik Terpadu  - Pantau nilai dan kehadiran lebih mudah.
                        </p>
                    </div>
                    <div className="p-3 flex flex-wrap gap-2">
                         <Button label="LOGIN SISWA / GURU" icon="pi pi-sign-in" 
                                className="p-button-raised bg-blue-800 border-blue-800 px-4 py-3 border-round-lg shadow-4 font-bold-special" 
                                onClick={() => router.push('/auth/login')} />
                         <SplitButton label="DAFTAR" icon="pi pi-user-plus" model={registerItems} 
                                className="p-button-outlined text-blue-800 border-round-lg font-bold-special" />
                    </div>
                </div>
            </div>

            {/* --- INFO CARDS (NORMAL WEIGHT) --- */}
            <div className="col-12 lg:col-4">
                <div className="card h-full border-none shadow-2 p-4">
                    <div className="flex align-items-center mb-2">
                        <i className="pi pi-compass text-blue-800 text-2xl mr-3"></i>
                        <h6 className="m-0 text-900 uppercase text-xs tracking-widest">VISI UTAMA</h6>
                    </div>
                    <p className="line-height-3 text-700 m-0 text-xs uppercase">Mencetak karakter unggul dan siap bersaing global.</p>
                </div>
            </div>

            <div className="col-12 lg:col-4">
                <div className="card h-full border-none shadow-2 p-4">
                    <div className="flex align-items-center mb-2">
                        <i className="pi pi-verified text-green-700 text-2xl mr-3"></i>
                        <h6 className="m-0 text-900 uppercase text-xs tracking-widest">AKREDITASI</h6>
                    </div>
                    <div className="p-2 border-round-lg bg-blue-50 border-left-3 border-blue-800">
                        <span className="text-sm text-blue-900 block uppercase">PERINGKAT A+ UNGGUL</span>
                    </div>
                </div>
            </div>

            <div className="col-12 lg:col-4">
                <div className="card h-full border-none shadow-2 p-4">
                    <div className="flex align-items-center mb-2">
                        <i className="pi pi-clock text-orange-700 text-2xl mr-3"></i>
                        <h6 className="m-0 text-900 uppercase text-xs tracking-widest">LAYANAN</h6>
                    </div>
                    <p className="text-700 m-0 text-xs uppercase tracking-tighter">SENIN - JUMAT (07:30 - 15:30 WIB)</p>
                </div>
            </div>

            {/* --- COMPACT PRESTASI --- */}
            <div className="col-12 lg:col-7">
                <div className="card shadow-2 border-none p-4">
                    <div className="flex justify-content-between align-items-center mb-4">
                        <h6 className="m-0 text-blue-900 uppercase text-sm tracking-widest">GALERI PRESTASI</h6>
                        <i className="pi pi-trophy text-yellow-500 text-3xl"></i>
                    </div>
                    <Carousel 
                        value={prestasiSekolah} 
                        numVisible={3} 
                        numScroll={1} 
                        circular 
                        autoplayInterval={4000} 
                        itemTemplate={prestasiTemplate} 
                        responsiveOptions={[
                            { breakpoint: '1024px', numVisible: 2, numScroll: 1 },
                            { breakpoint: '768px', numVisible: 1, numScroll: 1 }
                        ]}
                    />
                </div>
            </div>

            {/* --- COMPACT MADING --- */}
            <div className="col-12 lg:col-5">
                <div className="card shadow-2 h-full p-4">
                    <h6 className="m-0 text-blue-900 uppercase text-sm tracking-widest mb-4">MADING DIGITAL</h6>
                    {loading ? (
                        <div className="flex justify-content-center py-4"><ProgressSpinner style={{width: '20px', height: '20px'}} /></div>
                    ) : (
                        <div className="overflow-auto" style={{ maxHeight: '280px' }}>
                            <DataView value={informasi.slice(0, 4)} itemTemplate={infoItemTemplate} />
                        </div>
                    )}
                    <Button label="LIHAT SEMUA INFORMASI" icon="pi pi-arrow-right" iconPos="right" className="p-button-text w-full mt-3 p-button-sm text-xs uppercase" onClick={() => router.push('/informasi')} />
                </div>
            </div>

            {/* --- DETAIL DIALOG --- */}
            <Dialog visible={!!selectedDetail} onHide={() => setSelectedDetail(null)} style={{ width: '90vw', maxWidth: '480px' }} modal dismissableMask showHeader={false} contentStyle={{ padding: '0', borderRadius: '20px' }}>
                {selectedDetail && (
                    <div className="p-5">
                        <div className="flex justify-content-between mb-4">
                            <Tag value={selectedDetail.KATEGORI} severity="info" className="px-3" />
                            <Button icon="pi pi-times" rounded text onClick={() => setSelectedDetail(null)} />
                        </div>
                        <h2 className="text-900 text-xl mt-0 uppercase mb-4 line-height-2 font-bold-special">{selectedDetail.JUDUL}</h2>
                        <div className="surface-100 p-4 border-round-xl text-800 text-sm line-height-4">
                            {selectedDetail.DESKRIPSI}
                        </div>
                    </div>
                )}
            </Dialog>
        </div>
    );
};

export default Dashboard;
