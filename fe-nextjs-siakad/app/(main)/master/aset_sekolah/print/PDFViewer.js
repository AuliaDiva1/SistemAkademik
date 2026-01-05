'use client'

import React, { useState, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Button } from 'primereact/button'

// CSS wajib untuk react-pdf
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'

// SOLUSI BUILD VERCEL: Gunakan CDN untuk worker agar tidak diproses Webpack
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

function PDFViewer({ pdfUrl, paperSize, fileName }) {
    const [numPages, setNumPages] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageWidth, setPageWidth] = useState(0);
    const [scale, setScale] = useState(1);

    // Hitung ukuran kertas berdasarkan props
    useEffect(() => {
        const mmToPixel = 3.7795275591;
        let widthInMm = 210; // Default A4

        if (paperSize === 'Letter') widthInMm = 216;
        else if (paperSize === 'Legal') widthInMm = 216;
        
        setPageWidth(widthInMm * mmToPixel);
    }, [paperSize]);

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
        setCurrentPage(1);
    }

    const handleDownloadPDF = () => {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `${fileName || 'laporan'}.pdf`;
        link.click();
    };

    const handlePrint = () => {
        const printWindow = window.open(pdfUrl, '_blank');
        if (printWindow) printWindow.print();
    };

    return (
        <div className="flex flex-column align-items-center w-full bg-gray-100 border-round">
            {/* Toolbar */}
            <div className="flex flex-wrap justify-content-center gap-2 p-2 sticky top-0 z-5 bg-white shadow-2 w-full border-round-top">
                <Button icon="pi pi-angle-double-left" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-button-text" />
                <Button icon="pi pi-angle-left" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-button-text" />
                
                <span className="flex align-items-center font-bold px-2">
                    {currentPage} / {numPages || 0}
                </span>

                <Button icon="pi pi-angle-right" onClick={() => setCurrentPage(prev => Math.min(prev + 1, numPages))} disabled={currentPage === numPages} className="p-button-text" />
                <Button icon="pi pi-angle-double-right" onClick={() => setCurrentPage(numPages)} disabled={currentPage === numPages} className="p-button-text" />
                
                <div className="border-left-1 border-gray-300 mx-2"></div>

                <Button icon="pi pi-search-plus" onClick={() => setScale(s => Math.min(s + 0.1, 2.0))} disabled={scale >= 2.0} className="p-button-text" />
                <Button icon="pi pi-search-minus" onClick={() => setScale(s => Math.max(s - 0.1, 0.5))} disabled={scale <= 0.5} className="p-button-text" />
                <Button icon="pi pi-download" onClick={handleDownloadPDF} className="p-button-text p-button-success" />
                <Button icon="pi pi-print" onClick={handlePrint} className="p-button-text p-button-warning" />
            </div>

            {/* Area Preview */}
            <div className="w-full overflow-auto flex justify-content-center p-4" style={{ height: '70vh', backgroundColor: '#525659' }}>
                <div className="shadow-8 bg-white">
                    <Document 
                        file={pdfUrl} 
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={<ProgressSpinner />}
                    >
                        <Page 
                            pageNumber={currentPage} 
                            width={pageWidth} 
                            scale={scale}
                            renderAnnotationLayer={true}
                            renderTextLayer={true}
                        />
                    </Document>
                </div>
            </div>
        </div>
    );
}

export default PDFViewer;
