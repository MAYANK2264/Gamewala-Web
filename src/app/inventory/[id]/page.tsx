import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getInventoryItems } from '@/lib/sheets'
import { generateQRDataUrl, buildQRPayload } from '@/lib/qr'
import AppHeader from '@/components/layout/AppHeader'
import BottomNav from '@/components/layout/BottomNav'
import RepairStatusUpdater from './RepairStatusUpdater'
import { Phone, MapPin, Calendar, Tag, AlertCircle, CheckCircle, Download } from 'lucide-react'

export const dynamic = 'force-dynamic'

function Row({ label, value }: { label: string; value?: string | number }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex justify-between gap-4 py-2.5 border-b border-brand-border last:border-0">
      <span className="text-xs text-brand-text-dim font-display uppercase tracking-wider shrink-0">{label}</span>
      <span className="text-sm text-brand-text text-right">{value}</span>
    </div>
  )
}

export default async function ItemDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession().catch(() => null)
  if (!session) redirect('/login')

  const { newProducts, secondHand, repairs } = await getInventoryItems().catch(() => ({
    newProducts: [], secondHand: [], repairs: []
  }))

  const item =
    newProducts.find(p => p.id === params.id) ||
    secondHand.find(p => p.id === params.id) ||
    repairs.find(r => r.id === params.id)

  if (!item) notFound()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
  const qrPayload = (item as { qr_code?: string; qrCode?: string }).qr_code ||
    (item as { qr_code?: string; qrCode?: string }).qrCode ||
    buildQRPayload(item.id, appUrl)
  const qrDataUrl = await generateQRDataUrl(qrPayload)

  const itemType = newProducts.find(p => p.id === params.id) ? 'new'
    : secondHand.find(p => p.id === params.id) ? 'secondhand'
    : 'repair'

  return (
    <div className="min-h-screen bg-brand-black">
      <AppHeader
        title={itemType === 'new' ? 'New Product' : itemType === 'secondhand' ? 'Second-hand' : 'Repair Job'}
        back
      />

      <div className="page-content px-4 space-y-4">
        {/* Badge + name */}
        <div>
          {itemType === 'new' && <span className="badge-new">New</span>}
          {itemType === 'secondhand' && <span className="badge-used">Second-hand</span>}
          {itemType === 'repair' && <span className="badge-repair">Repair</span>}
          <h1 className="font-display font-bold text-xl text-brand-text mt-3 leading-tight">
            {(item as { name?: string }).name ||
             (item as { product_name?: string }).product_name ||
             (item as { productName?: string }).productName || 'Product'}
          </h1>
          <p className="font-mono text-xs text-brand-muted mt-1">{item.id}</p>
        </div>
        
        {/* Photo display */}
        {((item as any).image_url || (item as any).imageUrl) && (
          <div className="card w-full aspect-video p-1 flex items-center justify-center overflow-hidden bg-brand-deep">
            <img 
              src={(item as any).image_url || (item as any).imageUrl} 
              alt="Product Photo" 
              className="w-full h-full object-cover rounded-[20px]" 
            />
          </div>
        )}

        {/* QR code */}
        <div className="card p-5 flex flex-col items-center gap-4">
          <div className="bg-white rounded-2xl p-3">
            <img src={qrDataUrl} alt="QR" className="w-44 h-44" />
          </div>
          <div className="text-center">
            <p className="text-xs text-brand-text-dim mb-1">Scan to open this product</p>
            <p className="font-mono text-xs text-brand-muted">{item.id}</p>
          </div>
          <a href={qrDataUrl} download={`QR-${item.id}.png`}
            className="btn-secondary text-sm py-2 px-5 flex items-center gap-2">
            <Download size={15} /> Download QR
          </a>
        </div>

        {/* New product details */}
        {itemType === 'new' && (() => {
          const p = item as any
          return (
            <div className="card p-5">
              <Row label="Category" value={p.category} />
              <Row label="Platform" value={p.platform} />
              <Row label="Price" value={p.price ? `₹${Number(p.price).toLocaleString('en-IN')}` : ''} />
              <Row label="Mfg. Date" value={p.mfg_date || p.mfgDate} />
              <Row label="Description" value={p.description} />
              <Row label="In Stock" value={String(p.in_stock || p.inStock) !== 'FALSE' ? 'Yes' : 'Sold'} />
              <Row label="Added By" value={p.added_by || p.addedBy} />
              <Row label="Added At" value={p.added_at ? new Date(p.added_at).toLocaleDateString('en-IN') : ''} />
            </div>
          )
        })()}

        {/* Second-hand details */}
        {itemType === 'secondhand' && (() => {
          const p = item as any
          return (
            <>
              <div className="card p-5">
                <p className="font-display font-semibold text-brand-text text-sm mb-3">Product</p>
                <Row label="Category" value={p.category} />
                <Row label="Platform" value={p.platform} />
                <Row label="Condition" value={p.condition} />
                <Row label="Known Issues" value={p.known_issues || p.knownIssues} />
                <Row label="Selling Price" value={p.selling_price || p.sellingPrice ? `₹${Number(p.selling_price || p.sellingPrice).toLocaleString('en-IN')}` : ''} />
                <Row label="Bought At" value={p.buying_price || p.buyingPrice ? `₹${Number(p.buying_price || p.buyingPrice).toLocaleString('en-IN')}` : ''} />
                <Row label="Original MRP" value={p.original_price || p.originalPrice ? `₹${Number(p.original_price || p.originalPrice).toLocaleString('en-IN')}` : ''} />
                <Row label="Purchase Date" value={p.purchase_date || p.purchaseDate} />
              </div>
              <div className="card p-5">
                <p className="font-display font-semibold text-brand-text text-sm mb-3">Seller</p>
                <Row label="Name" value={p.seller_name || p.sellerName} />
                <Row label="Phone" value={p.seller_phone || p.sellerPhone} />
                <Row label="Address" value={p.seller_address || p.sellerAddress} />
                <Row label="Processed By" value={p.processed_by || p.processedBy} />
              </div>
              {(p.receipt_image_url || p.receiptImageUrl) && (
                <a href={p.receipt_image_url || p.receiptImageUrl} target="_blank" rel="noopener noreferrer"
                  className="btn-secondary w-full text-center text-sm">
                  View Original Receipt →
                </a>
              )}
            </>
          )
        })()}

        {/* Repair details */}
        {itemType === 'repair' && (() => {
          const r = item as any
          const status = r.status || 'pending'
          return (
            <>
              <div className="card p-5">
                <p className="font-display font-semibold text-brand-text text-sm mb-3">Job Details</p>
                <div className="mb-3">
                  <span className={`text-sm border rounded-full px-3 py-1 font-display font-semibold status-${status}`}>
                    Status: {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </div>
                <Row label="Platform" value={r.platform} />
                <Row label="Problem" value={r.problem_description || r.problemDescription} />
                <Row label="Received" value={r.received_date || r.receivedDate} />
                <Row label="Estimate" value={r.estimate_cost || r.estimateCost ? `₹${Number(r.estimate_cost || r.estimateCost).toLocaleString('en-IN')}` : 'Pending'} />
                <Row label="Actual Cost" value={r.actual_cost || r.actualCost ? `₹${Number(r.actual_cost || r.actualCost).toLocaleString('en-IN')}` : ''} />
                <Row label="Received By" value={r.received_by || r.receivedBy} />
                <Row label="Assigned To" value={r.assigned_to || r.assignedTo} />
              </div>
              <div className="card p-5">
                <p className="font-display font-semibold text-brand-text text-sm mb-3">Owner</p>
                <Row label="Name" value={r.owner_name || r.ownerName} />
                <Row label="Phone" value={r.owner_phone || r.ownerPhone} />
                <Row label="Address" value={r.owner_address || r.ownerAddress} />
              </div>
              {(r.owner_phone || r.ownerPhone) && (
                <a href={`tel:${r.owner_phone || r.ownerPhone}`}
                  className="btn-secondary w-full text-center flex items-center justify-center gap-2 text-sm">
                  <Phone size={15} /> Call Owner
                </a>
              )}
              {/* Status updater (client component) */}
              <RepairStatusUpdater repairId={item.id} currentStatus={status} isAdmin={session.role === 'admin'} />
            </>
          )
        })()}
      </div>

      <BottomNav isAdmin={session.role === 'admin'} />
    </div>
  )
}
