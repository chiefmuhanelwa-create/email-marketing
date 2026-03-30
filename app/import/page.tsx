'use client'

import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'

interface ImportResult {
  batchId: string
  imported: number
  skipped: number
  duplicates: number
  errors: string[]
}

export default function ImportPage() {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [source, setSource] = useState('pdf_download')
  const [tags, setTags] = useState('')
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<ImportResult[]>([])
  const [progress, setProgress] = useState(0)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.csv'))
    setFiles(prev => [...prev, ...dropped])
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files)
      setFiles(prev => [...prev, ...selected])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const importFiles = async () => {
    if (!files.length) return
    setImporting(true)
    setResults([])
    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setProgress(Math.round((i / files.length) * 100))

      const formData = new FormData()
      formData.append('file', file)
      formData.append('source', source)
      formData.append('tags', JSON.stringify(tagList))

      try {
        const res = await fetch('/api/import', { method: 'POST', body: formData })
        const result = await res.json()
        setResults(prev => [...prev, result])
      } catch (err) {
        setResults(prev => [...prev, {
          batchId: 'error',
          imported: 0,
          skipped: 0,
          duplicates: 0,
          errors: [String(err)]
        }])
      }
    }

    setProgress(100)
    setImporting(false)
    setFiles([])
  }

  const totalImported = results.reduce((sum, r) => sum + r.imported, 0)

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ marginLeft: 220, flex: 1, padding: '32px 40px', background: 'var(--bg)' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 className="display-font" style={{ fontSize: 32, letterSpacing: 1 }}>IMPORT CONTACTS</h1>
          <p style={{ color: 'var(--text-muted)' }}>Upload CSV files to add contacts to your list</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, maxWidth: 900 }}>
          {/* Upload zone */}
          <div>
            <div
              className={`drop-zone${isDragging ? ' active' : ''}`}
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>📥</div>
              <div style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 4 }}>
                Drop CSV files here or click to browse
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                Supports: email, first_name, last_name, phone columns
              </div>
              <input
                id="file-input"
                type="file"
                accept=".csv"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileInput}
              />
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div style={{ marginTop: 16 }}>
                {files.map((file, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'var(--bg-elevated)',
                    borderRadius: 6,
                    marginBottom: 8
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>📄</span>
                      <span style={{ fontSize: 13 }}>{file.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(i)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}
                    >×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Progress */}
            {importing && (
              <div style={{ marginTop: 16 }}>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                  Importing... {progress}%
                </div>
              </div>
            )}

            {/* Results */}
            {results.length > 0 && (
              <div style={{ marginTop: 16 }} className="animate-fade-in">
                <div className="nc-card" style={{ background: 'rgba(34,197,94,0.05)', borderColor: 'var(--green)' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)', marginBottom: 8 }}>
                    ✓ Import Complete
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    <div>
                      <div className="stat-number" style={{ fontSize: 32, color: 'var(--green)' }}>{totalImported.toLocaleString()}</div>
                      <div className="stat-label">Imported</div>
                    </div>
                    <div>
                      <div className="stat-number" style={{ fontSize: 32, color: 'var(--text-muted)' }}>
                        {results.reduce((s, r) => s + r.duplicates, 0).toLocaleString()}
                      </div>
                      <div className="stat-label">Duplicates</div>
                    </div>
                    <div>
                      <div className="stat-number" style={{ fontSize: 32, color: 'var(--text-muted)' }}>
                        {results.reduce((s, r) => s + r.skipped, 0).toLocaleString()}
                      </div>
                      <div className="stat-label">Skipped</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Settings panel */}
          <div>
            <div className="nc-card">
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Import Settings</h2>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                  Contact Source
                </label>
                <select className="nc-select" value={source} onChange={e => setSource(e.target.value)}>
                  <option value="pdf_download">PDF Download</option>
                  <option value="survey">Survey</option>
                  <option value="website_subscription">Website Subscription</option>
                  <option value="social_media">Social Media</option>
                  <option value="manual">Manual Entry</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                  Tags (comma-separated)
                </label>
                <input
                  className="nc-input"
                  placeholder="cold, reactivate, 2024"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Tags help with segmentation and targeting
                </div>
              </div>

              <button
                className="nc-btn-primary"
                onClick={importFiles}
                disabled={!files.length || importing}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {importing ? 'Importing...' : `Import ${files.length} File${files.length !== 1 ? 's' : ''}`}
              </button>
            </div>

            {/* CSV format guide */}
            <div className="nc-card" style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>CSV Column Names</h3>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.8 }}>
                <div><span style={{ color: 'var(--accent)' }}>Email:</span> email, Email, email_address</div>
                <div><span style={{ color: 'var(--accent)' }}>First name:</span> first_name, firstname, name</div>
                <div><span style={{ color: 'var(--accent)' }}>Last name:</span> last_name, lastname, surname</div>
                <div><span style={{ color: 'var(--accent)' }}>Phone:</span> phone, mobile, cell</div>
                <div style={{ marginTop: 8, color: 'var(--text-dim)' }}>
                  Extra columns → saved as custom fields automatically
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
