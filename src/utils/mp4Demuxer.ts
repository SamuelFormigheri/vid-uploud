import { createFile, DataStream, MP4Info, Sample } from 'mp4box'

export class MP4Demuxer {

    async run(stream: ReadableStream, { onConfig, onChunk }: {
        onConfig: (config: VideoDecoderConfig) => Promise<void>,
        onChunk: (chunk: EncodedVideoChunk) => void
    }) {
        const file = createFile()

        function description({ id }: { id: number }) {
            const track: any = file.getTrackById(id);
            if (!track)
                throw new Error("avcC, hvcC, vpcC, or av1C box not found")

            for (const entry of track.mdia.minf.stbl.stsd.entries) {
                const box = entry.avcC || entry.hvcC || entry.vpcC || entry.av1C
                if (box) {
                    const _stream = new DataStream(undefined, 0, DataStream.BIG_ENDIAN)
                    box.write(_stream)
                    return new Uint8Array(_stream.buffer, 8)  // Remove the box header.
                }
            }
            throw new Error("avcC, hvcC, vpcC, or av1C box not found")
        }

        function onReady(info: MP4Info) {
            const [track] = info.videoTracks
            onConfig({
                codec: track.codec,
                codedHeight: track.video.height,
                codedWidth: track.video.width,
                description: description(track),
                durationSecs: info.duration / info.timescale,
            } as VideoDecoderConfig)

            file.setExtractionOptions(track.id)
            file.start()
        }

        function onSamples(_trackId: any, _ref: any, samples: Sample[]) {
            for (const sample of samples) {
                onChunk(new EncodedVideoChunk({
                    type: sample.is_sync ? "key" : "delta",
                    timestamp: 1e6 * sample.cts / sample.timescale,
                    duration: 1e6 * sample.duration / sample.timescale,
                    data: sample.data
                }));
            }
        }

        file.onReady = onReady.bind(this)
        file.onSamples = onSamples.bind(this)
        file.onError = (error) => console.error('error on mp4Demuxer', error)

        let offset = 0
        const consumeFile = new WritableStream({
            write: (chunk) => {
                const copy = chunk.buffer
                copy.fileStart = offset
                file.appendBuffer(copy)
                offset += chunk.length
            },
            close: () => file.flush()
        })

        return stream.pipeTo(consumeFile)
    }
}