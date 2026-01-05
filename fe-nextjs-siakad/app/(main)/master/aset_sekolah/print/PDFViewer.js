"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";

export default function PDFViewer({ pdfUrl, fileName, paperSize = "A4" }) {
  const iframeRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (pdfUrl) {
      setLoading(true);
      setError(null);
    }
  }, [pdfUrl]);

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const handleIframeError = () => {
    setLoading(false);
    setError("Gagal memuat PDF");
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      
      // Metode 1: Download dengan fetch untuk file lokal/same-origin
      const response = await fetch(pdfUrl);
      
      if (!response.ok) {
        throw new Error('Gagal mengunduh file');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || "laporan.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      setLoading(false);
    } catch (err) {
      console.error('Download error:', err);
      
      // Fallback: Buka di tab baru (untuk CORS atau external URL)
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = fileName || "laporan.pdf";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setLoading(false);
    }
  };

  const handlePrint = () => {
    try {
      // Coba print dari iframe (untuk same-origin PDF)
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.print();
      } else {
        throw new Error('Cannot access iframe');
      }
    } catch (err) {
      // Jika iframe tidak bisa diakses (CORS), buka di tab baru
      console.warn("CORS restriction detected. Opening PDF in new window for printing...");
      
      const printWindow = window.open(pdfUrl, "_blank", "width=800,height=600");
      
      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 250);
        };
      } else {
        alert("Popup diblokir! Mohon izinkan popup untuk print.");
      }
    }
  };

  if (!pdfUrl) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Tidak ada PDF untuk ditampilkan</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex justify-between items-center p-3 bg-gray-100 border-b">
        <div className="flex items-center gap-2">
          <i className="pi pi-file-pdf text-red-500 text-xl"></i>
          <span className="font-semibold">{fileName || "Laporan.pdf"}</span>
        </div>
        <div className="flex gap-2">
          <Button
            label="Download"
            icon="pi pi-download"
            className="p-button-sm p-button-success"
            onClick={handleDownload}
          />
          <Button
            label="Print"
            icon="pi pi-print"
            className="p-button-sm p-button-warning"
            onClick={handlePrint}
          />
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 relative bg-gray-200">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <ProgressSpinner
              style={{ width: "50px", height: "50px" }}
              strokeWidth="4"
            />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="text-center">
              <i className="pi pi-exclamation-triangle text-red-500 text-4xl mb-3"></i>
              <p className="text-gray-700">{error}</p>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={pdfUrl}
          className="w-full h-full border-0"
          title="PDF Preview"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      </div>
    </div>
  );
}
