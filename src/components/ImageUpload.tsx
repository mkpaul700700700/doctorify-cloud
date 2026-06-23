"use client"

import { useState, useRef } from "react"
import { Camera, Upload, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface ImageUploadProps {
  currentImageUrl?: string | null
  onUploadSuccess: (url: string) => Promise<void>
  label?: string
  isAvatar?: boolean
}

export default function ImageUpload({ currentImageUrl, onUploadSuccess, label = "Upload Image", isAvatar = false }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size (e.g., max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Maximum size is 5MB.")
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", "trdzwtsw") // Unsigned preset

      const resourceType = file.type === "application/pdf" ? "raw" : "auto"
      const res = await fetch(`https://api.cloudinary.com/v1_1/dsj8cr1ol/${resourceType}/upload`, {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (res.ok && data.secure_url) {
        await onUploadSuccess(data.secure_url)
        router.refresh()
      } else {
        alert("Upload failed: " + (data.error?.message || "Unknown error"))
      }
    } catch (err) {
      console.error(err)
      alert("An error occurred during upload.")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = "" // reset
      }
    }
  }

  if (isAvatar) {
    return (
      <div style={{ position: "relative", width: "100px", height: "100px", borderRadius: "50%", backgroundColor: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "2px solid var(--border)", cursor: "pointer", flexShrink: 0 }} onClick={() => !isUploading && fileInputRef.current?.click()}>
        {currentImageUrl ? (
          <img src={currentImageUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Camera size={32} color="var(--text-muted)" />
        )}
        
        {/* Overlay */}
        <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }} className="avatar-overlay">
           {isUploading ? <Loader2 className="spin" color="white" /> : <Camera color="white" />}
        </div>
        
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" style={{ display: "none" }} />
        
        <style>{`
          .avatar-overlay:hover { opacity: 1 !important; }
        `}</style>
      </div>
    )
  }

  // Signature or generic upload
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-color)" }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {currentImageUrl ? (
          <div style={{ height: "60px", padding: "0.25rem", border: "1px solid var(--border)", borderRadius: "4px", backgroundColor: "white" }}>
            <img src={currentImageUrl} alt="Signature" style={{ height: "100%", objectFit: "contain" }} />
          </div>
        ) : null}
        
        <button 
          type="button" 
          className="btn btn-outline" 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          {isUploading ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
          {currentImageUrl ? "Change Signature" : "Upload Signature"}
        </button>
      </div>
      
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/svg+xml" style={{ display: "none" }} />
    </div>
  )
}
