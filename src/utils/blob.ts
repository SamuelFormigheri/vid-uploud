export function downloadBlobAsFile(blob: Blob, filename: string) {
    const blobUrl = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = blobUrl
    a.download = filename

    a.click()

    URL.revokeObjectURL(blobUrl)
}