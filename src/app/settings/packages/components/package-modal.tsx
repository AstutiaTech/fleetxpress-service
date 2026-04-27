"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload } from "lucide-react"
import { CreatePackagingPayload, Packaging } from "@/types/packagingType"
import { ApiService } from "@/lib/api"
import { toastUtils } from "@/utils/toast-utils"
import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"

interface PackageModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: Packaging | null
    onSuccess?: () => void
}

export function PackageModal({ open, onOpenChange, item, onSuccess }: PackageModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [imageUrl, setImageUrl] = useState("")
    const { control, handleSubmit, reset, formState: { errors }, watch } = useForm<CreatePackagingPayload>({
        defaultValues: {
            name: "",
            price: 0,
            status: 1,
            image: "",
        },
    })

    const watchedImage = watch("image")

    useEffect(() => {
        if (item && open) {
            reset({
                name: item.name,
                price: item.price,
                status: item.status,
                image: item.image,
            })
            setImageUrl(item.image)
        } else if (open) {
            reset({
                name: "",
                price: 0,
                status: 1,
                image: "",
            })
            setImageUrl("")
        }
    }, [item, open, reset])

    const handleImageUpload = async (file: File) => {
        setIsUploading(true)
        setUploadProgress(0)
        try {
            const response = await ApiService.uploadFile(file, (progress) => {
                setUploadProgress(progress)
            })
            if (response.status && response.data) {
                setImageUrl(response.data.url)
                reset({ ...watch(), image: response.data.url })
                toastUtils.success("Uploaded", "Image uploaded successfully.")
            } else {
                toastUtils.error("Upload Failed", response.message || "Failed to upload image.")
            }
        } catch (error) {
            toastUtils.error("Upload Failed", "An error occurred while uploading the image.")
        } finally {
            setIsUploading(false)
            setUploadProgress(0)
        }
    }

    const onSubmit = async (values: CreatePackagingPayload) => {
        setIsSubmitting(true)
        try {
            let response
            if (item) {
                response = await ApiService.updatePackage(item.id, values)
            } else {
                response = await ApiService.createPackage(values)
            }
            if (response.status && response.data) {
                toastUtils.success(item ? "Updated" : "Created", `Package ${item ? "updated" : "created"} successfully.`)
                onSuccess?.()
            } else {
                toastUtils.error(item ? "Update Failed" : "Creation Failed", response.message || `Failed to ${item ? "update" : "create"} package.`)
            }
        } catch (error) {
            toastUtils.error(item ? "Update Failed" : "Creation Failed", `An error occurred while ${item ? "updating" : "creating"} the package.`)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{item ? "Edit Package" : "Add Package"}</DialogTitle>
                    <DialogDescription>
                        {item ? "Update the package settings." : "Create a new package."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Name *</Label>
                            <Controller
                                control={control}
                                name="name"
                                rules={{ required: "Name is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input {...field} placeholder="e.g., Standard Box" />
                                        {errors.name && (
                                            <p className="text-sm text-destructive">{errors.name.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Price (₦) *</Label>
                            <Controller
                                control={control}
                                name="price"
                                rules={{ required: "Price is required", min: { value: 0, message: "Price must be 0 or greater" } }}
                                render={({ field }) => (
                                    <>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min={0}
                                            {...field}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                        />
                                        {errors.price && (
                                            <p className="text-sm text-destructive">{errors.price.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Status *</Label>
                            <Controller
                                control={control}
                                name="status"
                                rules={{ required: "Status is required" }}
                                render={({ field }) => (
                                    <>
                                        <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value.toString()}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">Active</SelectItem>
                                                <SelectItem value="0">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.status && (
                                            <p className="text-sm text-destructive">{errors.status.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Image URL *</Label>
                            <div className="space-y-2">
                                <Controller
                                    control={control}
                                    name="image"
                                    rules={{ required: "Image is required" }}
                                    render={({ field }) => (
                                        <>
                                            <Input {...field} placeholder="Image URL" />
                                            {errors.image && (
                                                <p className="text-sm text-destructive">{errors.image.message}</p>
                                            )}
                                        </>
                                    )}
                                />
                                <div className="relative">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) {
                                                handleImageUpload(file)
                                            }
                                        }}
                                        className="hidden"
                                        id="image-upload"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => document.getElementById("image-upload")?.click()}
                                        disabled={isUploading}
                                        className="w-full"
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        {isUploading ? "Uploading..." : "Upload Image"}
                                    </Button>
                                    {isUploading && (
                                        <Progress value={uploadProgress} className="mt-2" />
                                    )}
                                </div>
                                {(imageUrl || watchedImage) && (
                                    <div className="mt-2">
                                        <img
                                            src={imageUrl || watchedImage}
                                            alt="Package preview"
                                            className="h-20 w-20 object-cover rounded border"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {item ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

