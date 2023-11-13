import { MP4Demuxer } from "./mp4Demuxer";

export class VideoProcessor {
    private mp4Demuxer: MP4Demuxer
    private webMWriter: any

    constructor({
        mp4Demuxer,
        webMWriter
    }: {
        mp4Demuxer: MP4Demuxer;
        webMWriter: any;
    }) {
        this.mp4Demuxer = mp4Demuxer
        this.webMWriter = webMWriter
    }

    private mp4Decoder(stream: ReadableStream<Uint8Array>) {
        return new ReadableStream({
            start: async (controller) => {
                const decoder = new VideoDecoder({
                    output(frame) {
                        controller.enqueue(frame)
                    },
                    error(e) {
                        console.error('error at mp4Decoder', e)
                        controller.error(e)
                    }
                })

                return this.mp4Demuxer.run(stream,
                    {
                        async onConfig(config: VideoDecoderConfig) {
                            decoder.configure(config)
                        },
                        onChunk(chunk: EncodedVideoChunk) {
                            decoder.decode(chunk)
                        },
                    }
                )
            },

        })
    }

    private encode(encoderConfig: VideoEncoderConfig) {
        let _encoder: VideoEncoder;
        const readable = new ReadableStream({
            start: async (controller) => {
                const { supported } = await VideoEncoder.isConfigSupported(encoderConfig)
                if (!supported) {
                    console.error('encode VideoEncoder config not supported!', encoderConfig)
                    controller.error('encode VideoEncoder config not supported!')
                    return
                }

                _encoder = new VideoEncoder({
                    output: (frame, config) => {
                        if (config?.decoderConfig) {
                            const decoderConfig = {
                                type: 'config',
                                config: config.decoderConfig
                            }
                            controller.enqueue(decoderConfig)
                        }

                        controller.enqueue(frame)
                    },
                    error: (err) => {
                        console.error('VideoEncoder 144p', err)
                        controller.error(err)
                    }
                })


                await _encoder.configure(encoderConfig)

            }
        })

        const writable = new WritableStream({
            async write(frame) {
                _encoder.encode(frame)
                frame.close()
            }
        })

        return {
            readable,
            writable
        }
    }

    private renderDecodedFramesAndGetEncodedChunks(renderFrame: (frame: VideoFrame) => void) {
        let _decoder: VideoDecoder;
        return new TransformStream({
            start: (controller: TransformStreamDefaultController) => {
                _decoder = new VideoDecoder({
                    output(frame) {
                        renderFrame(frame)
                    },
                    error(e) {
                        console.error('error at renderFrames', e)
                        controller.error(e)
                    }
                })
            },
            async transform(encodedChunk, controller: TransformStreamDefaultController) {
                if (encodedChunk.type === 'config') {
                    await _decoder.configure(encodedChunk.config)
                    return;
                }
                _decoder.decode(encodedChunk)

                // need the encoded version to use webM
                controller.enqueue(encodedChunk)
            }
        })
    }

    private transformIntoWebM() {
        const writable = new WritableStream({
            write: (frame: VideoFrame) => {
                this.webMWriter.addFrame(frame)
            }
        })
        return {
            readable: this.webMWriter.getStream(),
            writable
        }
    }

    private upload(onDownload: (blob: Blob) => void) {
        const webMWriter = this.webMWriter
        return new WritableStream({
            async close() {
                const blob = await webMWriter.complete()
                onDownload(blob)
            }
        })
    }

    async start({
        file,
        encoderConfig,
        renderFrame,
        onCallback,
        onDownload
    }: {
        file: File;
        renderFrame: (frame: VideoFrame) => void;
        encoderConfig: VideoEncoderConfig;
        onCallback: () => void;
        onDownload: (fileName: string, blob: Blob) => void;
    }) {
        const stream = file.stream()
        const fileName = file.name.split('/').pop()?.replace('.mp4', '')

        await this.mp4Decoder(stream)
            .pipeThrough(this.encode(encoderConfig))
            .pipeThrough(this.renderDecodedFramesAndGetEncodedChunks(renderFrame))
            .pipeThrough(this.transformIntoWebM())
            .pipeTo(this.upload((blob) => onDownload(fileName ?? "", blob)))

        onCallback()
    }
}