import { MP4Demuxer } from "../utils/mp4Demuxer"
import { VideoProcessor } from "../utils/videoProcessor"

// @ts-ignore
import WebMWriter from '../libs/webm-writer2.js'

export interface IWorkerData {
    status: "done" | "processing" | "unsupported" | "download";
    frame?: VideoFrame;
    chunks?: Uint8Array[];
    fileName?: string;
}

const qvgaConstraints = {
    width: 320,
    height: 240
}
const vgaConstraints = {
    width: 640,
    height: 480
}
const hdConstraints = {
    width: 1280,
    height: 720
}

const encoderConfig = {
    ...qvgaConstraints,
    bitrate: 10e6,
    // WebM
    codec: 'vp09.00.10.08',
    pt: 4,
    hardwareAcceleration: 'prefer-software',

    // MP4
    // codec: 'avc1.42002A',
    // pt: 1,
    // hardwareAcceleration: 'prefer-hardware',
    // avc: { format: 'annexb' }
} as VideoEncoderConfig

const webmWriterConfig = {
    ...qvgaConstraints,
    codec: 'VP9',
    width: encoderConfig.width,
    height: encoderConfig.height,
    bitrate: encoderConfig.bitrate,
}

const videoProcessor = new VideoProcessor({
    mp4Demuxer: new MP4Demuxer(),
    webMWriter: new WebMWriter(webmWriterConfig)
})

self.onmessage = async ({
    data
}: {
    data: {
        file: File
    }
}) => {
    if (!('VideoEncoder' in self as any)) {
        self.postMessage({
            status: "unsupported"
        } as IWorkerData)
        return
    }

    await videoProcessor.start({
        file: data.file,
        encoderConfig,
        renderFrame: (frame: VideoFrame) => {
            self.postMessage({
                status: "processing",
                frame
            } as IWorkerData)
            frame.close()
        },
        onDownload: (fileName, chunks) => {
            self.postMessage({
                status: "download",
                chunks,
                fileName
            } as IWorkerData)
        },
        onCallback: () => self.postMessage({ status: "done" } as IWorkerData)
    })
}