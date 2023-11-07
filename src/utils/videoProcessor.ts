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

    private encode144p(encoderConfig: VideoEncoderConfig) {
        let _encoder: VideoEncoder;
        const readable = new ReadableStream({
            start: async (controller) => {
                const { supported } = await VideoEncoder.isConfigSupported(encoderConfig)
                if (!supported) {
                    console.error('encode144p VideoEncoder config not supported!', encoderConfig)
                    controller.error('encode144p VideoEncoder config not supported!')
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

    private upload(onDownload: (chunks: Uint8Array[]) => void) {
        const chunks: Uint8Array[] = []
        let byteCount = 0


        return new WritableStream({
            async write({ data }: { data: Uint8Array }) {
                chunks.push(data)
                byteCount += data.byteLength
            },
            async close() {
                if (!chunks.length) return;
                onDownload(chunks)
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
        onDownload: (fileName: string, chunks: Uint8Array[]) => void;
    }) {
        const stream = file.stream()
        const fileName = file.name.split('/').pop()?.replace('.mp4', '')

        await this.mp4Decoder(stream)
            .pipeThrough(this.encode144p(encoderConfig))
            .pipeThrough(this.renderDecodedFramesAndGetEncodedChunks(renderFrame))
            .pipeThrough(this.transformIntoWebM())
            .pipeTo(this.upload((chunks) => onDownload(fileName ?? "", chunks)))

        onCallback()
    }
}