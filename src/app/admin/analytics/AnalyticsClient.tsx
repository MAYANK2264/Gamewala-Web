'use client'
import { useState, useMemo, useEffect } from 'react'
import { Settings, TrendingUp, DollarSign, Package, PieChart as PieChartIcon, BarChart2, Info, ChevronDown, ChevronUp } from 'lucide-react'
import clsx from 'clsx'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts'


interface Margins {
  global: number;
  [category: string]: number;
}

export default function AnalyticsClient({ 
  newProducts, 
  secondHand, 
  repairs 
}: { 
  newProducts: any[], 
  secondHand: any[], 
  repairs: any[] 
}) {
  const [margins, setMargins] = useState<Margins>({ global: 15 })
  const [showSettings, setShowSettings] = useState(false)
  
  // Custom explorer state
  const [compareMetric, setCompareMetric] = useState<'revenue' | 'profit' | 'volume'>('revenue')
  const [compareAxis, setCompareAxis] = useState<'category' | 'platform' | 'type'>('category')

  useEffect(() => {
    const saved = localStorage.getItem('gamewala_margins')
    if (saved) {
      try { setMargins(JSON.parse(saved)) } catch(e) {}
    }
  }, [])

  const saveMargins = (m: Margins) => {
    setMargins(m)
    localStorage.setItem('gamewala_margins', JSON.stringify(m))
  }

  // --- Aggregation Logic ---
  const data = useMemo(() => {
    let revenue = 0
    let profit = 0
    let inventoryValue = 0
    let soldCount = 0

    // Categorized aggregations for the explorer
    const map = new Map<string, { revenue: number, profit: number, volume: number }>()

    const track = (axisKey: string | undefined, itemRev: number, itemProf: number, isSold: boolean) => {
      const key = (axisKey || 'Other').trim()
      const current = map.get(key) || { revenue: 0, profit: 0, volume: 0 }
      if (isSold) {
        current.revenue += itemRev
        current.profit += itemProf
        current.volume += 1
      }
      map.set(key, current)
    }

    // New Products
    newProducts.forEach(p => {
      const price = Number(p.price || 0)
      const marginPct = margins[p.category || ''] ?? margins.global
      const itemProfit = price * (marginPct / 100)
      
      let isSold = String(p.in_stock || p.inStock) === 'FALSE'

      if (isSold) {
        revenue += price
        profit += itemProfit
        soldCount += 1
      } else {
        inventoryValue += price
      }
      track(compareAxis === 'type' ? 'New' : p[compareAxis], price, itemProfit, isSold)
    })

    // Second Hand
    secondHand.forEach(p => {
      const sell = Number(p.selling_price || p.sellingPrice || 0)
      const buy = Number(p.buying_price || p.buyingPrice || 0)
      const itemProfit = sell - buy
      
      let isSold = String(p.in_stock || p.inStock) === 'FALSE'

      if (isSold) {
        revenue += sell
        profit += itemProfit
        soldCount += 1
      } else {
        inventoryValue += sell
      }
      track(compareAxis === 'type' ? 'Used' : p[compareAxis], sell, itemProfit, isSold)
    })

    // Repairs
    repairs.forEach(r => {
      if (r.status === 'delivered') {
        const cost = Number(r.actual_cost || r.actualCost || r.estimate_cost || r.estimateCost || 0)
        // For repairs, assuming 100% of the actual cost received is revenue/profit (labor/fixed).
        revenue += cost
        profit += cost
        soldCount += 1
        track(compareAxis === 'type' ? 'Repair' : r.platform, cost, cost, true)
      }
    })

    // Sort charts data
    const chartData = Array.from(map.entries())
      .map(([label, metrics]) => ({ label, ...metrics }))
      .sort((a, b) => b[compareMetric] - a[compareMetric])

    return { revenue, profit, inventoryValue, soldCount, chartData }
  }, [newProducts, secondHand, repairs, margins, compareMetric, compareAxis])

  // Chart max value for scaling
  const maxChartVal = data.chartData.length ? Math.max(...data.chartData.map(d => d[compareMetric])) : 1

  return (
    <div className="space-y-6">
      
      {/* Hero Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 card p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl" />
          <div className="flex items-center gap-2 mb-1 text-green-400">
            <TrendingUp size={16} />
            <span className="text-xs font-display uppercase tracking-wider font-semibold">Total Revenue</span>
          </div>
          <p className="font-display font-bold text-4xl text-white">₹{data.revenue.toLocaleString('en-IN')}</p>
          <p className="text-xs text-brand-text-dim mt-2">From {data.soldCount} total sales/repairs</p>
        </div>

        <div className="card p-4 relative overflow-hidden bg-brand-dark shadow-[0_0_15px_rgba(232,32,42,0.1)] border-brand-red/10">
          <div className="absolute top-0 right-0 w-16 h-16 bg-brand-red/20 rounded-full blur-2xl" />
          <div className="flex items-center gap-1 mb-1 text-brand-red">
            <DollarSign size={14} />
            <span className="text-[10px] font-display uppercase tracking-wider font-semibold">Net Profit</span>
          </div>
          <p className="font-display font-bold text-xl text-white">₹{data.profit.toLocaleString('en-IN')}</p>
        </div>

        <div className="card p-4 relative overflow-hidden">
          <div className="flex items-center gap-1 mb-1 text-blue-400">
            <Package size={14} />
            <span className="text-[10px] font-display uppercase tracking-wider font-semibold">Inventory Value</span>
          </div>
          <p className="font-display font-bold text-xl text-white">₹{data.inventoryValue.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Dynamic Margin Settings */}
      <div className="card overflow-hidden">
        <button 
          onClick={() => setShowSettings(!showSettings)} 
          className="w-full p-4 flex items-center justify-between text-brand-text bg-brand-dark/50 hover:bg-brand-dark transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-brand-muted" />
            <span className="font-display font-semibold text-sm">Profit Calibration Panel</span>
          </div>
          {showSettings ? <ChevronUp size={18} className="text-brand-muted"/> : <ChevronDown size={18} className="text-brand-muted"/>}
        </button>

        {showSettings && (
          <div className="p-4 border-t border-brand-border space-y-4">
            <div className="flex items-start gap-2 bg-blue-500/10 text-blue-400 p-3 rounded-xl">
              <Info size={16} className="shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed">
                We track exact profit for Used goods and Repairs. For New Products, use these sliders to estimate your wholesale-to-retail margin so we can calculate total profit accurately.
              </p>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-brand-text-dim">Global Default Margin</label>
                  <span className="text-xs font-display text-brand-red">{margins.global}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" value={margins.global} 
                  onChange={(e) => saveMargins({...margins, global: Number(e.target.value)})}
                  className="w-full accent-brand-red"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {['Console', 'Game', 'Accessory'].map(cat => (
                  <div key={cat} className="bg-brand-dark p-3 rounded-xl border border-brand-border/50">
                    <div className="flex justify-between mb-1">
                      <label className="text-[10px] uppercase tracking-wider text-brand-text-dim">{cat}</label>
                      <span className="text-[10px] font-display text-brand-red">{margins[cat] ?? margins.global}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" value={margins[cat] ?? margins.global} 
                      onChange={(e) => saveMargins({...margins, [cat]: Number(e.target.value)})}
                      className="w-full accent-brand-red"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Comparison Explorer UI */}
      <div className="card p-5 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <PieChartIcon size={18} className="text-amber-400" />
          <h2 className="font-display font-semibold text-brand-text">Comparison Explorer</h2>
        </div>
        
        <div className="flex gap-2 bg-brand-dark p-1 rounded-xl">
          <select 
            value={compareMetric} 
            onChange={e => setCompareMetric(e.target.value as any)}
            className="flex-1 bg-transparent text-sm text-brand-text font-display py-2 px-3 outline-none"
          >
            <option value="revenue">By Revenue (₹)</option>
            <option value="profit">By Profit (₹)</option>
            <option value="volume">By Units Sold</option>
          </select>
          <div className="w-px bg-brand-border" />
          <select 
            value={compareAxis} 
            onChange={e => setCompareAxis(e.target.value as any)}
            className="flex-1 bg-transparent text-sm text-brand-text font-display py-2 px-3 outline-none"
          >
            <option value="category">Category</option>
            <option value="platform">Platform</option>
            <option value="type">Prod Type</option>
          </select>
        </div>

        {/* Chart render */}
        <div className="space-y-6 pt-4">
          {data.chartData.length === 0 ? (
            <p className="text-center text-sm text-brand-muted">No data available for these parameters.</p>
          ) : (
            <>
              {/* Bar Chart */}
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.chartData} margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                    <XAxis 
                      dataKey="label" 
                      tick={{ fill: '#888888', fontSize: 10, fontFamily: 'Rajdhani' }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <YAxis 
                      tick={{ fill: '#888888', fontSize: 10, fontFamily: 'Rajdhani' }} 
                      axisLine={false} 
                      tickLine={false} 
                      tickFormatter={(val) => compareMetric === 'volume' ? val : `₹${val/1000}k`}
                    />
                    <Tooltip 
                      cursor={{ fill: '#1A1A1F' }}
                      contentStyle={{ backgroundColor: '#111114', borderColor: '#22222A', borderRadius: '12px', color: '#fff', fontSize: '12px', fontFamily: 'Sora' }}
                      itemStyle={{ color: compareMetric === 'profit' ? '#FF3B46' : '#fff' }}
                      formatter={(val: any) => compareMetric === 'volume' ? [val, 'Units'] : [`₹${Number(val||0).toLocaleString('en-IN')}`, compareMetric === 'profit' ? 'Profit' : 'Revenue']}
                    />
                    <Bar dataKey={compareMetric} radius={[4, 4, 0, 0]}>
                      {data.chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={compareMetric === 'profit' ? '#FF3B46' : '#ffffff'} fillOpacity={index === 0 ? 1 : 0.7} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart */}
              <div className="h-48 w-full border-t border-brand-border/50 pt-4 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.chartData}
                      dataKey={compareMetric}
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      stroke="none"
                    >
                      {data.chartData.map((entry, index) => {
                        const colors = ['#FF3B46', '#FFFFFF', '#A1A1AA', '#3F3F46', '#27272A']
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      })}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111114', borderColor: '#22222A', borderRadius: '12px', color: '#fff', fontSize: '12px', fontFamily: 'Sora' }}
                      formatter={(val: any) => compareMetric === 'volume' ? [val, 'Units'] : [`₹${Number(val||0).toLocaleString('en-IN')}`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      </div>
      
    </div>
  )
}
