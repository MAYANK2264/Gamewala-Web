'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { QrCode, Search, X, Loader2, FlipHorizontal } from 'lucide-react'
import toast from 'react-hot-toast'
import AppHeader from '@/components/layout/AppHeader'
import BottomNav from '@/components/layout/BottomNav'
import clsx from 'clsx'

import { Suspense } from 'react'

function ScanPageContent() {
  const [mode, setMode] = useState<'camera' | 'manual'>('camera')
  const [scanning, setScanning] = useState(false)
  const [manualId, setManualId] = useState('')
  const [loading, setLoading] = useState(false)
  const scannerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  // If opened with ?id= (from QR scan by phone camera), go straight to product
  useEffect(() => {
    const id = searchParams.get('id')
    if (id) {
      router.push(`/inventory/${id}`)
    }
  }, [searchParams, router])

  // Start html5-qrcode scanner
  useEffect(() => {
    if (mode !== 'camera' || !scanning) return
    let scanner: InstanceType<typeof import('html5-qrcode').Html5Qrcode> | null = null

    const start = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        scanner = new Html5Qrcode('qr-reader')
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            // Parse URL or raw ID
            let id = decodedText
            try {
              const url = new URL(decodedText)
              id = url.searchParams.get('id') || decodedText
            } catch { /* raw ID */ }
            scanner?.stop().catch(() => {})
            setScanning(false)
            toast.success('QR scanned!')
            router.push(`/inventory/${id}`)
          },
          () => { /* scanning */ }
        )
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Camera error'
        toast.error(`Camera error: ${message}`)
        setScanning(false)
      }
    }

    start()
    return () => { scanner?.stop().catch(() => {}) }
  }, [scanning, mode, router])

  const lookupManual = async () => {
    if (!manualId.trim()) return
    setLoading(true)
    const id = manualId.trim().toUpperCase()
    // Check if product exists
    const res = await fetch(`/api/inventory/${id}`)
    setLoading(false)
    if (res.ok) {
      router.push(`/inventory/${id}`)
    } else {
      toast.error('Product not found. Check the ID and try again.')
    }
  }

  return (
    <div className="min-h-screen bg-brand-black">
      <AppHeader title="Scan QR Code" back />

      <div className="page-content px-4">
        {/* Mode tabs */}
        <div className="flex bg-brand-card border border-brand-border rounded-xl p-1 mb-6">
          {(['camera', 'manual'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setScanning(false) }}
              className={clsx(
                'flex-1 py-2.5 rounded-lg font-display font-semibold text-sm transition-all capitalize',
                mode === m ? 'bg-brand-red text-white' : 'text-brand-text-dim'
              )}>
              {m === 'camera' ? '📷 Camera Scan' : '⌨️ Manual Entry'}
            </button>
          ))}
        </div>

        {/* Camera scan */}
        {mode === 'camera' && (
          <div className="space-y-4">
            {!scanning ? (
              <div className="card p-8 text-center space-y-4">
                <QrCode size={60} className="text-brand-red mx-auto" />
                <div>
                  <p className="font-display font-semibold text-brand-text mb-1">Ready to scan</p>
                  <p className="text-sm text-brand-text-dim">Point your camera at a product QR code</p>
                </div>
                <button onClick={() => setScanning(true)} className="btn-primary w-full">
                  Start Camera
                </button>
                <p className="text-xs text-brand-muted">
                  Or use your phone&apos;s default camera app — scan the QR and it will open the product automatically
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden bg-brand-dark aspect-square qr-scanner-box">
                  <div id="qr-reader" className="w-full h-full" />
                  {/* Scan line */}
                  <div className="absolute inset-0 flex items-start pt-8 px-8 pointer-events-none">
                    <div className="scan-line w-full" />
                  </div>
                </div>
                <button onClick={() => setScanning(false)} className="btn-secondary w-full flex items-center justify-center gap-2">
                  <X size={16} /> Stop Scanning
                </button>
              </div>
            )}
          </div>
        )}

        {/* Manual ID entry */}
        {mode === 'manual' && (
          <div className="card p-6 space-y-4">
            <p className="text-sm text-brand-text-dim">Enter the product ID printed below the QR code</p>
            <div>
              <label className="label">Product ID</label>
              <input
                value={manualId}
                onChange={e => setManualId(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && lookupManual()}
                placeholder="e.g. NEW-A1B2C3D4"
                className="input-field font-mono text-base tracking-wider"
                autoCapitalize="characters"
                autoCorrect="off"
              />
            </div>
            <button onClick={lookupManual} disabled={loading || !manualId.trim()} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              {loading ? 'Looking up...' : 'Find Product'}
            </button>

            <div className="border-t border-brand-border pt-4">
              <p className="text-xs text-brand-text-dim font-display font-medium mb-2">ID formats:</p>
              <div className="space-y-1 text-xs font-mono text-brand-muted">
                <div>NEW-XXXXXXXX — New product</div>
                <div>SH-XXXXXXXX — Second-hand</div>
                <div>REP-XXXXXXXX — Repair job</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent scans hint */}
        <div className="mt-6 card p-4">
          <p className="text-xs text-brand-text-dim font-display font-medium mb-3">Quick Tips</p>
          <div className="space-y-2 text-xs text-brand-muted">
            <p>• Every product has a printed QR label on it</p>
            <p>• You can also use your phone&apos;s default camera to scan</p>
            <p>• Manual ID is on the same label, below the QR code</p>
          </div>
        </div>
      </div>

      <BottomNav isAdmin={false} />
    </div>
  )
}

export default function ScanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
      </div>
    }>
      <ScanPageContent />
    </Suspense>
  )
}
