import { toPng } from "html-to-image"
import { toast } from "react-hot-toast"

/**
 * Downloads a DOM element as a PNG image
 * @param element - The DOM element to download
 * @param fileName - The name of the downloaded file
 * @param options - Configuration options for image generation
 * @param options.pixelRatio - The pixel ratio of the image, defaults to 5
 * @param options.cacheBust - Whether to disable caching, defaults to true
 * @param options.quality - Image quality between 0-1, defaults to 1.0
 * @param options.backgroundColor - Background color, defaults to transparent
 * @returns A promise that resolves to a boolean indicating download success
 */
export async function downloadElementAsPng(
  element: HTMLElement,
  fileName: string,
  options?: {
    pixelRatio?: number
    cacheBust?: boolean
    quality?: number
    backgroundColor?: string
  },
): Promise<boolean> {
  const defaultOptions = {
    pixelRatio: 5,
    cacheBust: true,
    quality: 1.0,
    backgroundColor: "transparent",
  }

  const mergedOptions = { ...defaultOptions, ...options }

  const loadingToast = toast.loading("Downloading...")
  let isSuccess = false

  try {
    const dataUrl = await toPng(element, mergedOptions)
    const blob = await fetch(dataUrl).then((res) => res.blob())
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = fileName
    link.click()
    window.URL.revokeObjectURL(url)

    toast.success("Download successful")
    isSuccess = true
  } catch (error: unknown) {
    console.error("Download failed:", error)
    toast.error("Download failed")
    isSuccess = false
  } finally {
    toast.dismiss(loadingToast)
  }

  return isSuccess
}
