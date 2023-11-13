type DoneWorkerData = {
    status: "done";
}

type ProcessingWorkerData = {
    status: "processing";
    frame: VideoFrame;
}

type UnsupportedWorkerData = {
    status: "unsupported";
}

type DownloadWorkerData = {
    status: "download";
    blob: Blob;
    fileName: string;
}


export type IWorkerData = DoneWorkerData | ProcessingWorkerData | UnsupportedWorkerData | DownloadWorkerData 