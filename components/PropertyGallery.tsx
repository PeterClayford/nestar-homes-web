'use client'

import { useState } from 'react'

interface PropertyGalleryProps {
  images: string[]
  title: string
  town: string
}

export default function PropertyGallery({ images, title, town }: PropertyGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string>(images[0] || '')

  return (
    <div className="space-y-3">
      {/* Main Selected Cover Image */}
      <div className="h-80 md:h-96 bg-slate-200 relative overflow-hidden">
        {selectedImage ? (
          <img 
            src={selectedImage} 
            alt={title} 
            className="w-full h-full object-cover transition duration-200" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            No Photos Available
          </div>
        )}
        <span className="absolute top-4 left-4 bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
          {town}
        </span>
      </div>

      {/* Thumbnail Gallery Navigation (Only shown if multiple photos exist) */}
      {images.length > 1 && (
        <div className="px-6 md:px-10 flex items-center gap-3 overflow-x-auto pb-2">
          {images.map((imgUrl, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(imgUrl)}
              className={`relative h-16 w-20 shrink-0 rounded-lg overflow-hidden border-2 transition ${
                selectedImage === imgUrl ? 'border-emerald-600 scale-95' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={imgUrl} alt={`${title} photo ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
