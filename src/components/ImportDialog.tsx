import React, { useRef, useState } from 'react';
import { parseExcelFile } from '../utils/excelImport';
import { CocomoInputs } from '../model/cocomo';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: CocomoInputs) => void;
}

export function ImportDialog({ isOpen, onClose, onImport }: ImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const data = await parseExcelFile(file);
      onImport(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import file');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={overlayStyle}>
      <div style={dialogStyle}>
        <div style={headerStyle}>
          <h2>Import Data from Excel</h2>
          <button
            onClick={onClose}
            style={closeButtonStyle}
            title="Close"
          >
            ✕
          </button>
        </div>

        <div style={contentStyle}>
          <p>Select an Excel file (XLSX) to import COCOMO estimates.</p>
          <p style={{ fontSize: 13, color: '#666' }}>
            Expected file: <strong>*.xlsx</strong>
          </p>

          <div style={fileInputWrapperStyle}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button
              onClick={handleBrowseClick}
              disabled={loading}
              style={{
                ...buttonStyle,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Importing...' : 'Select File'}
            </button>
          </div>

          {error && (
            <div style={errorStyle}>
              <strong>Error:</strong> {error}
            </div>
          )}

          <div style={infoStyle}>
            <h4>Supported Columns:</h4>
            <ul style={{ fontSize: 12, margin: '8px 0', paddingLeft: 20 }}>
              <li><strong>Step 1:</strong> Total LOC, Schedule (months), R&D Allocation (%), FTE Rate Low/High, Contractor Rate Low/High</li>
              <li><strong>Step 2:</strong> DM, CM, IM, AA, SU, UNFM</li>
              <li><strong>Step 3:</strong> PREC, FLEX, RESL, TEAM, PMAT</li>
              <li><strong>Step 4:</strong> RELY, DATA, CPLX, RUSE, DOCU, TIME, STOR, PVOL, ACAP, PCAP, PCON, TOOL, SITE, SCED</li>
              <li><strong>Step 5:</strong> A (Calibration Constant)</li>
            </ul>
          </div>
        </div>

        <div style={footerStyle}>
          <button
            onClick={onClose}
            style={cancelButtonStyle}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const dialogStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '8px',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
  maxWidth: '500px',
  width: '90%',
  maxHeight: '80vh',
  overflow: 'auto',
  display: 'flex',
  flexDirection: 'column',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px',
  borderBottom: '1px solid #e0e0e0',
};

const closeButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '24px',
  cursor: 'pointer',
  color: '#666',
  padding: 0,
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const contentStyle: React.CSSProperties = {
  padding: '20px',
  flex: 1,
};

const fileInputWrapperStyle: React.CSSProperties = {
  margin: '20px 0',
};

const buttonStyle: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
};

const errorStyle: React.CSSProperties = {
  padding: '12px',
  backgroundColor: '#ffebee',
  color: '#c62828',
  borderRadius: '4px',
  marginTop: '10px',
  fontSize: '13px',
};

const infoStyle: React.CSSProperties = {
  marginTop: '20px',
  padding: '12px',
  backgroundColor: '#f5f5f5',
  borderRadius: '4px',
  fontSize: '12px',
};

const footerStyle: React.CSSProperties = {
  padding: '15px 20px',
  borderTop: '1px solid #e0e0e0',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '10px',
};

const cancelButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#f0f0f0',
  color: '#333',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '14px',
  cursor: 'pointer',
};
