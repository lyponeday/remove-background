"use client"

import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, Download, Loader2, AlertCircle, User, Zap, Settings } from "lucide-react"
import { useLocale } from "./providers"
import Image from "next/image"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface UploadImageProps {
  user?: {
    subscription_status: string
  } | null
}

interface UserStatus {
  isLoggedIn: boolean
  user?: {
    id: number
    email: string
    name?: string
    subscription_status: string
    is_verified: boolean
  }
  usage?: {
    current_month: number
    max_usage: number
    remaining: number
    month: string
  }
}

export function UploadImage({ user }: UploadImageProps) {
  const { t } = useLocale()
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null)
  const [isLoadingStatus, setIsLoadingStatus] = useState(true)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  
  // AI参数状态
  const [format, setFormat] = useState<'png' | 'jpg'>('png')
  const [reverse, setReverse] = useState(false)
  const [threshold, setThreshold] = useState([0])
  const [backgroundType, setBackgroundType] = useState<'rgba' | 'map' | 'green' | 'white' | 'blur' | 'overlay'>('rgba')

  // 查询用户状态
  const fetchUserStatus = async () => {
    try {
      setIsLoadingStatus(true)
      const response = await fetch("/api/user-status")
      const data = await response.json()
      
      if (response.ok) {
        setUserStatus(data)
        console.log("User status:", data) // 调试信息
      } else {
        setUserStatus({ isLoggedIn: false })
        console.log("User not logged in:", data) // 调试信息
      }
    } catch (error) {
      console.error("Failed to fetch user status:", error)
      setUserStatus({ isLoggedIn: false })
    } finally {
      setIsLoadingStatus(false)
    }
  }

  useEffect(() => {
    fetchUserStatus()
  }, [])

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      setError(null)

      // 重新检查用户状态
      await fetchUserStatus()

      // Check if user has permission
      if (!userStatus?.isLoggedIn) {
        setError(t.tool.loginRequired)
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
        formData.append("format", format)
        formData.append("reverse", reverse.toString())
        formData.append("threshold", threshold[0].toString())
        formData.append("background_type", backgroundType)

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
        
        // 处理成功后刷新用户状态
        await fetchUserStatus()
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
    [userStatus, t, fetchUserStatus, format, reverse, threshold, backgroundType],
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
    link.download = `background-removed.${format}`
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
    // 重置参数到默认值
    setFormat('png')
    setReverse(false)
    setThreshold([0])
    setBackgroundType('rgba')
    setShowAdvancedOptions(false)
  }

  const renderStatusCard = () => {
    if (isLoadingStatus) {
      return (
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>正在加载用户状态...</span>
          </div>
        </Card>
      )
    }

    if (!userStatus?.isLoggedIn) {
      return (
        <Card className="p-4 mb-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
            <User className="h-4 w-4" />
            <span>Please <a href="/login" className="underline font-medium">login</a> to use the background remover</span>
          </div>
        </Card>
      )
    }

    const user = userStatus.user!
    const usage = userStatus.usage!

    return (
      <Card className="p-4 mb-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="font-medium">{user.name || user.email}</span>
              <Badge variant={user.subscription_status === "free" ? "secondary" : "default"}>
                {user.subscription_status.toUpperCase()}
              </Badge>
              {!user.is_verified && (
                <Badge variant="destructive">Email Not Verified</Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span>
              {usage.max_usage === -1 ? (
                "Unlimited usage"
              ) : (
                <>
                  <span className="font-medium">{usage.remaining}</span> of {usage.max_usage} remaining this month
                  <span className="text-sm text-muted-foreground ml-2">
                    (Used: {usage.current_month})
                  </span>
                </>
              )}
            </span>
          </div>

          {user.subscription_status === "free" && usage.remaining <= 1 && (
            <div className="text-sm text-orange-600 dark:text-orange-400">
              💡 <a href="/pricing" className="underline">Upgrade to Premium</a> for 100 images/month
            </div>
          )}
        </div>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">{t.tool.title}</h1>
        <p className="text-muted-foreground mb-4">
          上传图片，我们的AI将自动为您移除背景。
        </p>
        <p className="text-sm text-muted-foreground">
          使用<strong>高级选项</strong>来自定义输出格式、背景类型和微调处理参数。
        </p>
      </div>

      {renderStatusCard()}

      {/* 高级选项 */}
      <Card className="p-4">
        <Collapsible open={showAdvancedOptions} onOpenChange={setShowAdvancedOptions}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>高级选项</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {showAdvancedOptions ? "隐藏" : "显示"}
              </span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 输出格式 */}
              <div className="space-y-2">
                <Label htmlFor="format">输出格式</Label>
                <Select value={format} onValueChange={(value: 'png' | 'jpg') => setFormat(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG (透明背景)</SelectItem>
                    <SelectItem value="jpg">JPG (实心背景)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 背景类型 */}
              <div className="space-y-2">
                <Label htmlFor="background_type">背景类型</Label>
                <Select value={backgroundType} onValueChange={(value: typeof backgroundType) => setBackgroundType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rgba">透明 (RGBA)</SelectItem>
                    <SelectItem value="white">白色背景</SelectItem>
                    <SelectItem value="green">绿屏背景</SelectItem>
                    <SelectItem value="blur">模糊背景</SelectItem>
                    <SelectItem value="map">深度图</SelectItem>
                    <SelectItem value="overlay">叠加效果</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 反转选项 */}
              <div className="space-y-2">
                <Label htmlFor="reverse">处理模式</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="reverse"
                    checked={reverse}
                    onCheckedChange={setReverse}
                  />
                  <Label htmlFor="reverse" className="text-sm">
                    {reverse ? "移除前景" : "移除背景"}
                  </Label>
                </div>
              </div>

              {/* 阈值 */}
              <div className="space-y-2">
                <Label htmlFor="threshold">
                  分割阈值: {threshold[0].toFixed(2)}
                </Label>
                <Slider
                  id="threshold"
                  min={0}
                  max={1}
                  step={0.01}
                  value={threshold}
                  onValueChange={setThreshold}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  {threshold[0] === 0 ? "软边缘混合" : "硬边缘分割"}
                </p>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              💡 <strong>使用技巧：</strong> 
              <ul className="mt-1 space-y-1 list-disc list-inside">
                <li>使用PNG格式获得透明背景</li>
                <li>调整阈值以获得更好的边缘检测</li>
                <li>尝试不同的背景类型来创建创意效果</li>
                <li>使用反转模式来移除主体对象</li>
              </ul>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

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
            <h3 className="font-semibold mb-4">原图</h3>
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">处理结果</h3>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                 <Badge variant="secondary">{format.toUpperCase()}</Badge>
                 {reverse && <Badge variant="outline">反转</Badge>}
                 {threshold[0] > 0 && <Badge variant="outline">阈值: {threshold[0].toFixed(2)}</Badge>}
                 {backgroundType !== 'rgba' && <Badge variant="outline">{backgroundType}</Badge>}
               </div>
            </div>
            <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg">
              {isProcessing ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>{t.tool.processing}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      This may take 10-30 seconds...
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <Badge variant="secondary">{format.toUpperCase()}</Badge>
                      {reverse && <Badge variant="outline">反转</Badge>}
                      {threshold[0] > 0 && <Badge variant="outline">阈值: {threshold[0].toFixed(2)}</Badge>}
                      {backgroundType !== 'rgba' && <Badge variant="outline">{backgroundType}</Badge>}
                    </div>
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
            上传新图片
          </Button>
        </div>
      )}
    </div>
  )
}
