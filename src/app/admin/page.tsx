import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { getUsers, getTasks, getInventoryItems } from '@/lib/sheets'
import BottomNav from '@/components/layout/BottomNav'
import AppHeader from '@/components/layout/AppHeader'
import { Users, ClipboardList, Settings, ExternalLink, Package, Wrench, RefreshCw, BarChart2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await getSession().catch(() => null)
  if (!session) redirect('/login')
  if (session.role !== 'admin') redirect('/dashboard')

  const [users, tasks, { newProducts, secondHand, repairs }] = await Promise.all([
    getUsers().catch(() => []),
    getTasks().catch(() => []),
    getInventoryItems().catch(() => ({ newProducts: [], secondHand: [], repairs: [] })),
  ])

  const activeEmployees = users.filter(u => u.role === 'employee')
  const openTasks = tasks.filter(t => t.status !== 'done')
  const pendingRepairs = repairs.filter(r => r.status === 'pending').length
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SHEET_ID}/edit`

  return (
    <div className="min-h-screen bg-brand-black">
      <AppHeader title="Admin Panel" />

      <div className="page-content px-4 space-y-5">

        {/* Stats overview */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'New in stock', value: newProducts.filter(p => String(p.inStock) !== 'FALSE').length, icon: Package, color: 'text-brand-red' },
            { label: 'Second-hand', value: secondHand.filter(p => String(p.inStock) !== 'FALSE').length, icon: RefreshCw, color: 'text-brand-yellow' },
            { label: 'Pending repairs', value: pendingRepairs, icon: Wrench, color: 'text-indigo-400' },
            { label: 'Active employees', value: activeEmployees.length, icon: Users, color: 'text-green-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card p-4 flex items-center gap-3">
              <Icon size={20} className={color} />
              <div>
                <div className="font-display font-bold text-xl text-brand-text">{value}</div>
                <div className="text-xs text-brand-text-dim">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="space-y-2">
          <p className="text-xs font-display uppercase tracking-wider text-brand-text-dim">Manage</p>

          <Link href="/admin/analytics" className="card p-4 flex items-center gap-3 active:scale-95 transition-all hover:border-brand-border-light shadow-[0_0_15px_rgba(232,32,42,0.1)] border-brand-red/20">
            <div className="w-10 h-10 bg-brand-red/10 rounded-xl flex items-center justify-center">
              <BarChart2 size={18} className="text-brand-red" />
            </div>
            <div className="flex-1">
              <div className="font-display font-semibold text-brand-text">Business Analytics</div>
              <div className="text-xs text-brand-text-dim">Track sales, profit margins, and generate reports</div>
            </div>
            <span className="text-brand-muted">→</span>
          </Link>

          <Link href="/admin/employees" className="card p-4 flex items-center gap-3 active:scale-95 transition-all hover:border-brand-border-light">
            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
              <Users size={18} className="text-green-400" />
            </div>
            <div className="flex-1">
              <div className="font-display font-semibold text-brand-text">Employees</div>
              <div className="text-xs text-brand-text-dim">{activeEmployees.length} active · Manage PINs and access</div>
            </div>
            <span className="text-brand-muted">→</span>
          </Link>

          <Link href="/admin/tasks" className="card p-4 flex items-center gap-3 active:scale-95 transition-all hover:border-brand-border-light">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <ClipboardList size={18} className="text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="font-display font-semibold text-brand-text">Tasks</div>
              <div className="text-xs text-brand-text-dim">{openTasks.length} open tasks · Assign work to employees</div>
            </div>
            <span className="text-brand-muted">→</span>
          </Link>
        </div>

        {/* Google Sheets links */}
        <div className="space-y-2">
          <p className="text-xs font-display uppercase tracking-wider text-brand-text-dim">Google Sheets</p>
          {[
            { label: 'New Products Sheet', tab: 'NewProducts' },
            { label: 'Second-hand Sheet', tab: 'SecondHand' },
            { label: 'Repairs Sheet', tab: 'Repairs' },
            { label: 'Users / Employees Sheet', tab: 'Users' },
            { label: 'Tasks Sheet', tab: 'Tasks' },
          ].map(({ label, tab }) => (
            <a key={tab} href={`${sheetUrl}#gid=0`} target="_blank" rel="noopener noreferrer"
              className="card p-4 flex items-center gap-3 active:scale-95 transition-all hover:border-brand-border-light">
              <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center text-sm">📊</div>
              <span className="flex-1 text-sm font-display text-brand-text">{label}</span>
              <ExternalLink size={14} className="text-brand-muted" />
            </a>
          ))}
        </div>

        {/* Employees list */}
        {activeEmployees.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-display uppercase tracking-wider text-brand-text-dim">Employees</p>
              <Link href="/admin/employees" className="text-xs text-brand-red">Manage →</Link>
            </div>
            <div className="space-y-2">
              {activeEmployees.map((emp, i) => (
                <div key={i} className="card p-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-brand-red/20 rounded-full flex items-center justify-center font-display font-bold text-brand-red">
                    {emp.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-display font-semibold text-brand-text text-sm">{emp.name}</div>
                    <div className="text-xs text-brand-text-dim">{emp.phone} · PIN: {emp.pin}</div>
                  </div>
                  <span className="text-xs text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-2 py-0.5">Active</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Open tasks */}
        {openTasks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-display uppercase tracking-wider text-brand-text-dim">Open Tasks</p>
              <Link href="/admin/tasks" className="text-xs text-brand-red">View all →</Link>
            </div>
            <div className="space-y-2">
              {openTasks.slice(0, 4).map((task, i) => (
                <div key={i} className="card p-4 flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    task.priority === 'high' ? 'bg-red-400' :
                    task.priority === 'medium' ? 'bg-amber-400' : 'bg-green-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-display font-medium text-brand-text truncate">{task.title}</p>
                    <p className="text-xs text-brand-text-dim mt-1">Assigned to: {(task as any).assigned_to || task.assignedTo}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav isAdmin />
    </div>
  )
}
