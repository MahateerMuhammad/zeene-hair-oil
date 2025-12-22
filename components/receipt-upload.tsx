"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, CheckCircle, AlertCircle, Trash2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"

interface ReceiptUploadProps {
    onUploadComplete: (url: string) => void
    orderId?: string
}

export function ReceiptUpload({ onUploadComplete, orderId }: ReceiptUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const { toast } = useToast()

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast({
                title: "Invalid file type",
                description: "Please upload an image (PNG, JPG, etc.)",
                variant: "destructive"
            })
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "File too large",
                description: "Maximum file size is 5MB",
                variant: "destructive"
            })
            return
        }

        try {
            setUploading(true)
            setProgress(10)

            // Create a local preview
            const objectUrl = URL.createObjectURL(file)
            setPreviewUrl(objectUrl)

            // Generate unique filename
            const fileExt = file.name.split('.').pop()
            const fileName = `${orderId || 'temp'}-${Math.random().toString(36).substring(2)}.${fileExt}`
            const filePath = `receipts/${fileName}`

            setProgress(30)

            const { data, error } = await supabase.storage
                .from('order_receipts')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (error) throw error

            setProgress(90)

            const { data: { publicUrl } } = supabase.storage
                .from('order_receipts')
                .getPublicUrl(filePath)

            onUploadComplete(publicUrl)
            setProgress(100)

            toast({
                title: "Receipt Uploaded",
                description: "Your payment receipt has been successfully uploaded.",
            })

        } catch (error: any) {
            console.error('Error uploading receipt:', error)
            toast({
                title: "Upload failed",
                description: error.message || "Failed to upload receipt. Please try again.",
                variant: "destructive"
            })
            setPreviewUrl(null)
        } finally {
            setUploading(false)
        }
    }

    const clearPreview = () => {
        setPreviewUrl(null)
        setProgress(0)
    }

    return (
        <div className="space-y-4">
            <Label htmlFor="receipt" className="text-sm font-medium text-gray-700">
                Upload Payment Screenshot
            </Label>

            {!previewUrl ? (
                <div className="relative group">
                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 transition-all hover:border-[#1F8D9D] hover:bg-gray-50 flex flex-col items-center justify-center space-y-3 cursor-pointer">
                        <div className="w-12 h-12 bg-[#F0F8FF] rounded-full flex items-center justify-center text-[#1F8D9D]">
                            <Upload className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-900">Click to upload or drag and drop</p>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG or PDF (MAX. 5MB)</p>
                        </div>
                        <Input
                            id="receipt"
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleFileChange}
                            accept="image/*"
                            disabled={uploading}
                        />
                    </div>
                </div>
            ) : (
                <div className="relative rounded-2xl border border-gray-100 overflow-hidden bg-white shadow-sm">
                    <div className="aspect-[4/3] relative">
                        <img
                            src={previewUrl}
                            alt="Receipt Preview"
                            className="w-full h-full object-cover"
                        />
                        {uploading && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center">
                                <Loader2 className="w-8 h-8 animate-spin text-[#1F8D9D] mb-4" />
                                <Progress value={progress} className="w-full max-w-[200px]" />
                                <p className="text-sm font-medium text-[#1F8D9D] mt-2">Uploading receipt...</p>
                            </div>
                        )}
                        {!uploading && progress === 100 && (
                            <div className="absolute top-2 right-2 bg-green-500 text-white p-1.5 rounded-full shadow-lg">
                                <CheckCircle className="w-4 h-4" />
                            </div>
                        )}
                    </div>

                    {!uploading && (
                        <div className="p-3 bg-gray-50 flex items-center justify-between">
                            <div className="flex items-center text-sm text-gray-600">
                                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                Receipt ready
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-2"
                                onClick={clearPreview}
                            >
                                <Trash2 className="w-4 h-4 mr-1.5" />
                                Change
                            </Button>
                        </div>
                    )}
                </div>
            )}

            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed">
                    Please ensure the transaction ID, date, and amount are visible in the screenshot for faster verification.
                </p>
            </div>
        </div>
    )
}
