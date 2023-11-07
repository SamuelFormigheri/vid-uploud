export class Canvas {
    private static draw(
        frame: VideoFrame | null,
        canvas: OffscreenCanvas,
        ctx: OffscreenCanvasRenderingContext2D | null
    ) {
        if (frame === null || ctx === null)
            return

        const { displayHeight, displayWidth } = frame

        canvas.width = displayWidth
        canvas.height = displayHeight
        ctx.drawImage(
            frame,
            0,
            0,
            displayWidth,
            displayHeight
        )
        frame.close()
    }

    static renderFrame(canvas: OffscreenCanvas) {
        const ctx = canvas.getContext('2d')
        let pendingFrame: VideoFrame | null = null

        return (frame: VideoFrame) => {
            const renderAnimationFrame = () => {
                this.draw(pendingFrame, canvas, ctx)
                pendingFrame = null
            }

            if (!pendingFrame)
                requestAnimationFrame(renderAnimationFrame)
            else
                pendingFrame.close()

            pendingFrame = frame
        }
    }
}