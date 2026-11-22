"use client";

import { useState } from "react";
import SellerNav from "@/components/SellerNav";
import { apiRequest } from "@/lib/api";
import { 
  Download, Upload, FileSpreadsheet, Check, 
  AlertCircle, AlertTriangle, ArrowRight, Trash2, Edit2, Save 
} from "lucide-react";

export default function SellerImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [editableRows, setEditableRows] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleDownloadTemplate = () => {
    window.location.href = "http://localhost:8000/api/excel/template";
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setError("");
    setSuccess("");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const data = await apiRequest<any>("/excel/preview", {
        method: "POST",
        body: formData,
      });
      setPreview(data);
      // Populate editable grid rows
      setEditableRows(data.rows.map((r: any) => ({ ...r.data, _isValid: r.is_valid, _errors: r.errors })));
    } catch (err: any) {
      setError(err.message || "Failed to parse workbook");
    } finally {
      setUploading(false);
    }
  };

  const handleCellChange = (index: number, field: string, value: any) => {
    const updated = [...editableRows];
    updated[index][field] = value;
    setEditableRows(updated);
  };

  const handleDeleteRow = (index: number) => {
    const updated = editableRows.filter((_, i) => i !== index);
    setEditableRows(updated);
  };

  const handleConfirmImport = async () => {
    setError("");
    setSuccess("");
    setImporting(true);

    try {
      const res = await apiRequest<any>("/excel/confirm", {
        method: "POST",
        body: JSON.stringify({ valid_rows: editableRows }),
      });
      setSuccess(res.message);
      setPreview(null);
      setEditableRows([]);
      setFile(null);
    } catch (err: any) {
      setError(err.message || "Import execution failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SellerNav />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Excel Workbook Import & Spreadsheet Editor</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Bulk import menu catalogues, historical sales, and inventory batches. Every row is strictly validated with row-level error reporting.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Step 1 & Step 2 Containers */}
      {!preview && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Download Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-[#1b4332] font-semibold text-sm">
                <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                <span>Step 1: Download Standard Workbook</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Download the official multi-sheet FOODLOOP Excel template containing <strong>Instructions</strong>, <strong>Products</strong>, <strong>Daily Sales</strong>, <strong>Inventory</strong>, and reference examples.
              </p>
              <ul className="text-[11px] text-gray-500 space-y-1 list-disc pl-4 pt-1">
                <li>Compatible with Microsoft Excel, LibreOffice, and Google Sheets.</li>
                <li>Preserves dates and numerical formats without macro risks.</li>
              </ul>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="py-2.5 px-4 rounded-lg bg-[#1b4332] hover:bg-[#2d6a4f] text-white text-xs font-semibold transition flex items-center justify-center space-x-2 shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download Official .xlsx Template</span>
            </button>
          </div>

          {/* Upload Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-emerald-800 font-semibold text-sm">
                <Upload className="w-5 h-5 text-emerald-700" />
                <span>Step 2: Upload Filled Workbook</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Select your completed workbook (.xlsx). The backend streaming validator parses sheets, validates units, and detects duplicate dates.
              </p>
            </div>

            <form onSubmit={handleFileUpload} className="space-y-3">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-[#1b4332] hover:file:bg-emerald-100"
              />
              <button
                type="submit"
                disabled={!file || uploading}
                className="w-full py-2.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold transition flex items-center justify-center space-x-2 shadow-xs"
              >
                <ArrowRight className="w-4 h-4" />
                <span>{uploading ? "Parsing & Validating Workbook..." : "Upload & Preview Rows"}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Editable Spreadsheet Preview Grid */}
      {preview && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                <span>Spreadsheet Editor: {preview.filename}</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Total Rows: {preview.total_rows} • Valid: <span className="font-semibold text-emerald-700">{preview.valid_rows}</span> • Flagged: <span className="font-semibold text-red-600">{preview.invalid_rows}</span> • Duplicates: <span className="font-semibold text-amber-600">{preview.duplicate_rows}</span>
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPreview(null)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={importing || editableRows.length === 0}
                className="px-4 py-2 rounded-lg bg-[#1b4332] hover:bg-[#2d6a4f] text-white text-xs font-semibold transition flex items-center space-x-1.5 shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>{importing ? "Saving to Database..." : `Confirm & Save (${editableRows.length} rows)`}</span>
              </button>
            </div>
          </div>

          <p className="text-[11px] text-gray-500 italic">
            Tip: You can edit values directly in the cells below before confirming. Discrepancies and expected closing are recalculated on save.
          </p>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Date (YYYY-MM-DD)</th>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">Opening</th>
                  <th className="py-2.5 px-3">Received</th>
                  <th className="py-2.5 px-3">Sold</th>
                  <th className="py-2.5 px-3">Waste</th>
                  <th className="py-2.5 px-3">Closing</th>
                  <th className="py-2.5 px-3">Unit</th>
                  <th className="py-2.5 px-3">Price (₹)</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono">
                {editableRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/70">
                    <td className="p-1">
                      <input
                        type="text"
                        value={row.business_date || ""}
                        onChange={(e) => handleCellChange(idx, "business_date", e.target.value)}
                        className="w-28 px-2 py-1 text-xs border border-gray-200 rounded bg-white"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="text"
                        value={row.product_name || ""}
                        onChange={(e) => handleCellChange(idx, "product_name", e.target.value)}
                        className="w-44 px-2 py-1 text-xs border border-gray-200 rounded bg-white font-sans font-semibold text-gray-900"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="number"
                        value={row.opening_stock ?? 0}
                        onChange={(e) => handleCellChange(idx, "opening_stock", parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 text-xs border border-gray-200 rounded bg-white text-right"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="number"
                        value={row.stock_received ?? 0}
                        onChange={(e) => handleCellChange(idx, "stock_received", parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 text-xs border border-gray-200 rounded bg-white text-right"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="number"
                        value={row.units_sold ?? 0}
                        onChange={(e) => handleCellChange(idx, "units_sold", parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 text-xs border border-gray-200 rounded bg-white text-right font-bold text-[#1b4332]"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="number"
                        value={row.recorded_waste ?? 0}
                        onChange={(e) => handleCellChange(idx, "recorded_waste", parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 text-xs border border-gray-200 rounded bg-white text-right text-red-600"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="number"
                        value={row.closing_stock ?? 0}
                        onChange={(e) => handleCellChange(idx, "closing_stock", parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 text-xs border border-gray-200 rounded bg-white text-right font-bold text-gray-900"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="text"
                        value={row.unit || "Portions"}
                        onChange={(e) => handleCellChange(idx, "unit", e.target.value)}
                        className="w-20 px-2 py-1 text-xs border border-gray-200 rounded bg-white text-center font-sans"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="number"
                        value={row.selling_price ?? 0}
                        onChange={(e) => handleCellChange(idx, "selling_price", parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 text-xs border border-gray-200 rounded bg-white text-right"
                      />
                    </td>
                    <td className="p-1 text-center">
                      <button
                        onClick={() => handleDeleteRow(idx)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded transition"
                        title="Delete row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
