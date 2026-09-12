'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Property {
  id: string
  title: string
  town_name: string
  village_name: string
  rent_amount: number
  currency: string
  status: string
  images: string[]
}

interface PropertyListProps {
  initialProperties: Property[]
}

export default function PropertyList({ initialProperties }: PropertyListProps) {
  const [selectedTown, setSelectedTown] = useState<string>('ALL')
  const [maxRent, setMaxRent] = useState<number>(1500000)

  // Extract unique towns for filter pills
  const towns = ['ALL', ...Array.from(new Set(initialProperties.map(p => p.town_name)))]

  // Optional filter evaluation
  const filteredProperties = initialProperties.filter(property => {
    const matchesTown = selectedTown === 'ALL' || property.town_name === selectedTown
    const matchesRent = property.rent_amount <= maxRent
    return matchesTown && matchesRent
  })

  return (
    <div className="space-y-8">
      {/* Optional Filters Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Location Pills */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Filter by Location
            </label>
            <div className="flex flex-wrap gap-2">
              {towns.map((town) => (
                <button
                  key={town}
                  onClick={() => setSelectedTown(town)}
                  className={`text-xs font-semibold px-4 py-2 rounded-xl transition ${
                    selectedTown === town
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {town === 'ALL' ? 'All Locations' : town}
                </button>
              ))}
            </div>
          </div>

          {/* Max Rent Slider */}
          <div className="min-w-[220px]">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Max Budget
              </label>
              <span className="text-xs font-bold text-emerald-700">
                {maxRent.toLocaleString()} UGX
              </span>
            </div>
            <input
              type="range"
              min={400000}
              max={2000000}
              step={50000}
              value={maxRent}
              onChange={(e) => setMaxRent(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Reset Action (only shows when filters are active) */}
        {(selectedTown !== 'ALL' || maxRent < 1500000) && (
          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => {
                setSelectedTown('ALL')
                setMaxRent(1500000)
              }}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Property Cards Grid */}
      {filteredProperties.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">No matching properties</h3>
          <p className="text-slate-500 mt-1">Try expanding your location selection or increasing your max budget.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <Link 
              key={property.id} 
              href={`/properties/${property.id}`}
              className="group bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition block"
            >
              <div className="h-48 bg-slate-200 relative overflow-hidden">
                {property.images && property.images[0] ? (
                  <img 
                    src={property.images[0]} 
                    alt={property.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">
                    No Photo Available
                  </div>
                )}
                <span className="absolute top-3 left-3 bg-emerald-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                  {property.town_name}
                </span>
              </div>
              
              <div className="p-5">
                <h2 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-emerald-700 transition">
                  {property.title}
                </h2>
                <p className="text-xs text-slate-500 mb-4">
                  {property.village_name ? `${property.village_name}, ` : ''}{property.town_name}
                </p>
                
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-xs text-slate-400 block">Monthly Rent</span>
                    <span className="text-lg font-extrabold text-emerald-700">
                      {Number(property.rent_amount).toLocaleString()} {property.currency}
                    </span>
                  </div>
                  
                  <span className="bg-slate-900 text-white text-xs px-4 py-2 rounded-lg font-medium group-hover:bg-slate-800 transition">
                    View Details
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
