import { MP4Demuxer } from "../utils/mp4Demuxer"
import { VideoProcessor } from "../utils/videoProcessor"

// @ts-ignore
import WebMWriter from '../libs/webm-writer2.js'
import { IWorkerData } from "../interfaces/workerData.js"

function returnConfigs(resolution: "144p" | "480p" | "720p") {
    let constraints

    switch (resolution) {
        case "480p":
            constraints = {
                width: 640,
                height: 480
            }
            break
        case "720p":
            constraints = {
                width: 1280,
                height: 720
            }
            break
        case "144p":
        default:
            constraints = {
                width: 320,
                height: 240
            }
            break
    }

    const encoderConfig = {
        ...constraints,
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
        ...constraints,
        codec: 'VP9',
        width: encoderConfig.width,
        height: encoderConfig.height,
        bitrate: encoderConfig.bitrate,
    }

    const videoProcessor = new VideoProcessor({
        mp4Demuxer: new MP4Demuxer(),
        webMWriter: new WebMWriter(webmWriterConfig)
    })

    return {
        videoProcessor,
        encoderConfig
    }
}

self.onmessage = async ({
    data
}: {
    data: {
        file: File;
        resolution: "144p" | "480p" | "720p";
    }
}) => {
    if (!('VideoEncoder' in self as any)) {
        self.postMessage({
            status: "unsupported"
        } as IWorkerData)
        return
    }

    const {
        encoderConfig,
        videoProcessor
    } = returnConfigs(data.resolution)

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