// src/components/UploadModal.jsx
import React, { useState } from 'react';
import { X, Upload, CheckCircle2, FileSpreadsheet, Film, Bookmark, Info } from 'lucide-react';
import { processLetterboxdFiles } from '../services/csvParser';

export default function UploadModal({ isOpen, onClose, onDataLoaded }) {
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const [importedSummary, setImportedSummary] = useState(null);

  if (!isOpen) return null;

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    setStatusMsg('Parsing Letterboxd export CSVs...');
    setImportedSummary(null);

    try {
      const { diary, watchlist } = await processLetterboxdFiles(files, (pct) => {
        setProgress(pct);
      });

      if (diary.length > 0 || watchlist.length > 0) {
        onDataLoaded(diary, watchlist);
        setImportedSummary({ diaryCount: diary.length, watchlistCount: watchlist.length });
        setStatusMsg(`Successfully imported ${diary.length} diary screenings and ${watchlist.length} watchlist films!`);
        setTimeout(() => {
          setIsProcessing(false);
        }, 600);
      } else {
        setStatusMsg('No valid movie rows found in the selected CSV files.');
        setIsProcessing(false);
      }
    } catch (err) {
      console.error(err);
      setStatusMsg('Error reading files. Please select valid Letterboxd export CSVs.');
      setIsProcessing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '540px' }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-ruby-subtle)',
              color: 'var(--accent-ruby)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileSpreadsheet size={16} />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>Import Letterboxd Data</h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px', lineHeight: 1.5 }}>
          Drop your exported Letterboxd CSV files here to instantly load your diary, ratings, and watchlist.
        </p>

        {/* Drag & Drop Area */}
        <div
          style={{
            border: `2px dashed ${dragActive ? 'var(--accent-ruby)' : 'var(--border-hover)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '36px 20px',
            textAlign: 'center',
            background: dragActive ? 'rgba(251, 54, 64, 0.08)' : '#0e141e',
            transition: 'all var(--transition-fast)',
            cursor: 'pointer',
            marginBottom: '18px'
          }}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload-input').click()}
        >
          <input
            id="file-upload-input"
            type="file"
            multiple
            accept=".csv"
            style={{ display: 'none' }}
            onChange={(e) => handleFiles(Array.from(e.target.files))}
          />

          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(251, 54, 64, 0.12)',
            color: 'var(--accent-ruby)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px'
          }}>
            <Upload size={22} />
          </div>

          <div style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', marginBottom: '4px' }}>
            Click or drag & drop Letterboxd CSVs
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Select <b>diary.csv</b>, <b>ratings.csv</b>, or <b>watchlist.csv</b>
          </div>
        </div>

        {/* Progress Bar */}
        {isProcessing && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <span>{statusMsg}</span>
              {progress > 0 && <span>{progress}%</span>}
            </div>
            <div style={{ width: '100%', height: '5px', background: '#1e2838', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: progress > 0 ? `${progress}%` : '100%', height: '100%', background: 'var(--accent-ruby)', transition: 'width 0.15s ease' }} />
            </div>
          </div>
        )}

        {/* Success / Status Banner */}
        {importedSummary && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0 }} />
            <div style={{ fontSize: '13px', color: '#ffffff' }}>
              Imported <b>{importedSummary.diaryCount}</b> logged films and <b>{importedSummary.watchlistCount}</b> watchlist entries!
            </div>
          </div>
        )}

        {/* Helpful instructions note */}
        <div style={{
          background: '#101622',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 14px',
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-start'
        }}>
          <Info size={15} style={{ color: 'var(--accent-ruby)', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: '700' }}>Where to get your Letterboxd data:</span> Go to <b>letterboxd.com &gt; Settings &gt; Data &gt; Export Your Data</b>. Unzip the download file and drop the CSVs here.
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
