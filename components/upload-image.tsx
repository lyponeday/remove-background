"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, Download, Loader2, AlertCircle } from "lucide-react"
import { useLocale } from "./providers"
import Image from "next/image"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface UploadImageProps {
  user?: {
    subscription_status: string
  } | null
}

export function UploadImage({ user }: UploadImageProps) {
  const { t } = useLocale()
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      setError(null)

      // Check if user has permission
      if (!user) {
        setError(t.tool.loginRequired)
        return
      }

      if (user.subscription_status === "free") {
        setError(t.tool.subscriptionRequired)
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB")
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        setOriginalImage(reader.result as string)
      }
      reader.readAsDataURL(file)

      setIsProcessing(true)

      try {
        const formData = new FormData()
        formData.append("image", file)

        const response = await fetch("/api/remove-background", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to process image")
        }

        const blob = await response.blob()
        const processedUrl = URL.createObjectURL(blob)
        setProcessedImage(processedUrl)
      } catch (error) {
        console.error("Error processing image:", error)
        
        // More specific error handling
        let errorMessage = "Failed to process image. Please try again."
        
        if (error instanceof Error) {
          if (error.message.includes("AI service not configured")) {
            errorMessage = "AI service is not configured. Please contact support."
          } else if (error.message.includes("authentication failed")) {
            errorMessage = "AI service authentication failed. Please contact support."
          } else if (error.message.includes("temporarily unavailable")) {
            errorMessage = "Service is temporarily busy. Please try again in a few moments."
          } else if (error.message.includes("rate limit")) {
            errorMessage = "Too many requests. Please wait and try again."
          } else {
            errorMessage = error.message
          }
        }
        
        setError(errorMessage)
      } finally {
        setIsProcessing(false)
      }
    },
    [user, t],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg"],
    },
    maxFiles: 1,
    disabled: isProcessing,
  })

  const downloadImage = () => {
    if (!processedImage) return

    const link = document.createElement("a")
    link.href = processedImage
    link.download = "background-removed.png"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const resetUpload = () => {
    setOriginalImage(null)
    setProcessedImage(null)
    setError(null)
    if (processedImage) {
      URL.revokeObjectURL(processedImage)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">{t.tool.title}</h1>
        <p className="text-muted-foreground mb-4">
          Upload an image and our AI will automatically remove the background for you.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!originalImage ? (
        <Card className="p-8">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg mb-2">{t.tool.dragDrop}</p>
            <p className="text-sm text-muted-foreground">{t.tool.supportedFormats}</p>
            <p className="text-xs text-muted-foreground mt-2">Max file size: 10MB</p>
          </div>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Original</h3>
            <div className="relative aspect-square">
              <Image
                src={originalImage || "/placeholder.svg"}
                alt="Original"
                fill
                className="object-contain rounded-lg"
              />
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-4">Processed</h3>
            <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg">
              {isProcessing ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>{t.tool.processing}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      This may take 10-30 seconds...
                    </p>
                  </div>
                </div>
              ) : processedImage ? (
                <Image
                  src={processedImage || "/placeholder.svg"}
                  alt="Processed"
                  fill
                  className="object-contain rounded-lg"
                />
              ) : null}
            </div>
            {processedImage && (
              <Button onClick={downloadImage} className="w-full mt-4">
                <Download className="h-4 w-4 mr-2" />
                {t.tool.download}
              </Button>
            )}
          </Card>
        </div>
      )}

      {originalImage && (
        <div className="text-center">
          <Button variant="outline" onClick={resetUpload} disabled={isProcessing}>
            Upload New Image
          </Button>
        </div>
      )}
    </div>
  )
}
