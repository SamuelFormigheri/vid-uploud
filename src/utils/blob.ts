export function downloadBlobAsFile(buffers: BlobPart[], filename: string) {
    const blob = new Blob(buffers, { type: 'video/webm' })
    const blobUrl = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = blobUrl
    a.download = filename

    a.click()

    URL.revokeObjectURL(blobUrl)
}