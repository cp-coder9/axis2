import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { 
  RotateCw, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  CheckCircle, 
  X,
  Crop,
  RefreshCw
} from 'lucide-react'

interface ImageCropperModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  onCropComplete: (croppedImageBlob: Blob) => void
  aspectRatio?: number // width/height ratio, default 1 for square
  outputSize?: { width: number; height: number }
}

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

interface Transform {
  scale: number
  rotation: number
  translateX: number
  translateY: number
}

export function ImageCropperModal({
  isOpen,
  onClose,
  imageUrl,
  onCropComplete,
  aspectRatio = 1,
  outputSize = { width: 400, height: 400 }
}: ImageCropperModalProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [transform, setTransform] = useState<Transform>({
    scale: 1,
    rotation: 0,
    translateX: 0,
    translateY: 0
  })
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 0,
    y: 0,
    width: 200,
    height: 200
  })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isProcessing, setIsProcessing] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load image when URL changes
  useEffect(() => {
    if (!imageUrl) return

    const img = new Image()
    img.onload = () => {
      setImage(img)
      // Initialize crop area to center of image
      const size = Math.min(img.width, img.height) * 0.8
      setCropArea({
        x: (img.width - size) / 2,
        y: (img.height - size) / 2,
        width: size,
        height: size / aspectRatio
      })
    }
    img.crossOrigin = 'anonymous'
    img.src = imageUrl
  }, [imageUrl, aspectRatio])

  // Draw image with transformations
  const drawImage = useCallback(() => {
    if (!image || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to container size
    const container = containerRef.current
    if (!container) return

    const containerRect = container.getBoundingClientRect()
    canvas.width = containerRect.width
    canvas.height = containerRect.height

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Calculate image display size
    const scale = Math.min(
      canvas.width / image.width,
      canvas.height / image.height
    ) * transform.scale

    const displayWidth = image.width * scale
    const displayHeight = image.height * scale

    // Center image in canvas
    const centerX = canvas.width / 2 + transform.translateX
    const centerY = canvas.height / 2 + transform.translateY

    // Apply transformations
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate((transform.rotation * Math.PI) / 180)
    ctx.drawImage(
      image,
      -displayWidth / 2,
      -displayHeight / 2,
      displayWidth,
      displayHeight
    )
    ctx.restore()

    // Draw crop overlay
    drawCropOverlay(ctx, canvas.width, canvas.height, scale)
  }, [image, transform, cropArea])

  // Draw crop overlay
  const drawCropOverlay = useCallback((
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    scale: number
  ) => {
    // Calculate crop area position on canvas
    const cropX = (canvasWidth - cropArea.width * scale) / 2
    const cropY = (canvasHeight - cropArea.height * scale) / 2
    const cropWidth = cropArea.width * scale
    const cropHeight = cropArea.height * scale

    // Draw dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // Clear crop area
    ctx.clearRect(cropX, cropY, cropWidth, cropHeight)

    // Draw crop border
    ctx.strokeStyle = '#0ea5e9'
    ctx.lineWidth = 2
    ctx.strokeRect(cropX, cropY, cropWidth, cropHeight)

    // Draw corner handles
    const handleSize = 8
    ctx.fillStyle = '#0ea5e9'
    
    // Top-left
    ctx.fillRect(cropX - handleSize/2, cropY - handleSize/2, handleSize, handleSize)
    // Top-right
    ctx.fillRect(cropX + cropWidth - handleSize/2, cropY - handleSize/2, handleSize, handleSize)
    // Bottom-left
    ctx.fillRect(cropX - handleSize/2, cropY + cropHeight - handleSize/2, handleSize, handleSize)
    // Bottom-right
    ctx.fillRect(cropX + cropWidth - handleSize/2, cropY + cropHeight - handleSize/2, handleSize, handleSize)
  }, [cropArea])

  // Redraw when dependencies change
  useEffect(() => {
    drawImage()
  }, [drawImage])

  // Handle mouse events for dragging
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: event.clientX, y: event.clientY })
  }, [])

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isDragging) return

    const deltaX = event.clientX - dragStart.x
    const deltaY = event.clientY - dragStart.y

    setTransform(prev => ({
      ...prev,
      translateX: prev.translateX + deltaX,
      translateY: prev.translateY + deltaY
    }))

    setDragStart({ x: event.clientX, y: event.clientY })
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Transform controls
  const handleScaleChange = useCallback((value: number[]) => {
    setTransform(prev => ({ ...prev, scale: value[0] }))
  }, [])

  const handleRotationChange = useCallback((value: number[]) => {
    setTransform(prev => ({ ...prev, rotation: value[0] }))
  }, [])

  const handleRotateLeft = useCallback(() => {
    setTransform(prev => ({ ...prev, rotation: prev.rotation - 90 }))
  }, [])

  const handleRotateRight = useCallback(() => {
    setTransform(prev => ({ ...prev, rotation: prev.rotation + 90 }))
  }, [])

  const handleZoomIn = useCallback(() => {
    setTransform(prev => ({ ...prev, scale: Math.min(prev.scale + 0.1, 3) }))
  }, [])

  const handleZoomOut = useCallback(() => {
    setTransform(prev => ({ ...prev, scale: Math.max(prev.scale - 0.1, 0.1) }))
  }, [])

  const handleReset = useCallback(() => {
    setTransform({
      scale: 1,
      rotation: 0,
      translateX: 0,
      translateY: 0
    })
  }, [])

  // Generate cropped image
  const handleCrop = useCallback(async () => {
    if (!image || !previewCanvasRef.current) return

    setIsProcessing(true)

    try {
      const canvas = previewCanvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas context not available')

      // Set output size
      canvas.width = outputSize.width
      canvas.height = outputSize.height

      // Calculate source crop area
      const sourceScale = Math.min(image.width / 400, image.height / 400) // Adjust based on display
      const sourceCropArea = {
        x: cropArea.x * sourceScale,
        y: cropArea.y * sourceScale,
        width: cropArea.width * sourceScale,
        height: cropArea.height * sourceScale
      }

      // Apply transformations and crop
      ctx.save()
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((transform.rotation * Math.PI) / 180)
      ctx.scale(transform.scale, transform.scale)

      // Draw cropped portion
      ctx.drawImage(
        image,
        sourceCropArea.x,
        sourceCropArea.y,
        sourceCropArea.width,
        sourceCropArea.height,
        -canvas.width / 2,
        -canvas.height / 2,
        canvas.width,
        canvas.height
      )
      ctx.restore()

      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          onCropComplete(blob)
        }
      }, 'image/jpeg', 0.9)

    } catch (error) {
      console.error('Error cropping image:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [image, cropArea, transform, outputSize, onCropComplete])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5" />
            Crop Avatar Image
          </DialogTitle>
          <DialogDescription>
            Adjust the image position, scale, and rotation, then select the crop area
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[600px]">
          {/* Main Canvas Area */}
          <div className="lg:col-span-3 space-y-4">
            <div 
              ref={containerRef}
              role="img"
              aria-label="Image cropping canvas"
              tabIndex={0}
              className="relative border rounded-lg overflow-hidden bg-gray-100 h-[400px] cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
              />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRotateLeft}
                className="flex items-center gap-1"
              >
                <RotateCcw className="h-4 w-4" />
                Rotate Left
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRotateRight}
                className="flex items-center gap-1"
              >
                <RotateCw className="h-4 w-4" />
                Rotate Right
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                className="flex items-center gap-1"
              >
                <ZoomIn className="h-4 w-4" />
                Zoom In
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                className="flex items-center gap-1"
              >
                <ZoomOut className="h-4 w-4" />
                Zoom Out
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label className="text-sm font-medium">Scale</Label>
                  <div className="mt-2">
                    <Slider
                      value={[transform.scale]}
                      onValueChange={handleScaleChange}
                      min={0.1}
                      max={3}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0.1x</span>
                      <span>{transform.scale.toFixed(1)}x</span>
                      <span>3x</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Rotation</Label>
                  <div className="mt-2">
                    <Slider
                      value={[transform.rotation]}
                      onValueChange={handleRotationChange}
                      min={-180}
                      max={180}
                      step={15}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>-180°</span>
                      <span>{transform.rotation}°</span>
                      <span>180°</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <Label className="text-sm font-medium">Instructions</Label>
                  <div className="mt-2 text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <Move className="h-3 w-3" />
                      <span>Drag to move image</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Crop className="h-3 w-3" />
                      <span>Blue area will be cropped</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                onClick={handleCrop}
                disabled={isProcessing}
                className="w-full flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                {isProcessing ? 'Processing...' : 'Apply Crop'}
              </Button>
              
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        </div>

        {/* Hidden canvas for processing */}
        <canvas ref={previewCanvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  )
}