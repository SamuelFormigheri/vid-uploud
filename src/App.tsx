import { Header } from './components/Header'
import { FileUpload } from './components/FileUpload'
import { useClock } from './hooks/useClock'
import { Canvas } from './utils/canvas'
import { downloadBlobAsFile } from './utils/blob'
import { createSignal } from 'solid-js'
import { firstLetterUppercase, formatSize } from './utils/string'
import { RadioButton } from './components/RadioButton'
import { IWorkerData } from './interfaces/workerData'
import IconPlay from './components/Icons/IconPlay'

import styles from './app.module.css'

function App() {
  let videoContainerRef: HTMLDivElement | undefined = undefined
  let fileUploadRef: HTMLInputElement | undefined = undefined
  let radioRef: HTMLDivElement | undefined = undefined
  let canvasRef: HTMLCanvasElement | undefined = undefined

  let renderFrame: ((frame: VideoFrame) => void) | undefined = undefined

  const [status, setStatus] = createSignal<IWorkerData["status"]>("processing")
  const [processingFile, setProcessingFile] = createSignal<File | undefined>(undefined)

  function getCanvas() {
    const canvas = canvasRef?.transferControlToOffscreen()
    if (!canvas)
      return
    renderFrame = Canvas.renderFrame(canvas)
  }

  function clearInput() {
    if (!fileUploadRef)
      return

    fileUploadRef.value = ""
  }

  const {
    start,
    stop,
    timer
  } = useClock()

  const worker = new Worker(new URL("./workers/processFile.ts", import.meta.url), {
    type: 'module'
  })

  worker.onerror = (error) => {
    console.error('error worker', error)
  }

  worker.onmessage = (ev: {
    data: IWorkerData
  }) => {
    setStatus(ev.data.status)

    switch (ev.data.status) {
      case "unsupported":
        alert("Your browser don't support VideoEncoder. Please update it.")
        clearInput()
        break
      case "done":
        stop()
        clearInput()
        break
      case "download":
        downloadBlobAsFile(ev.data.blob, ev.data.fileName)
        break
      case "processing":
        if (renderFrame === undefined) {
          getCanvas()
          return
        }
        else {
          renderFrame(ev.data.frame)
        }
        break
      default:
        break
    }
  }

  return (
    <>
      <Header />
      <main>
        <FileUpload
          ref={fileUploadRef}
          onchange={(ev) => {
            if (!ev.target.files || !canvasRef)
              return

            start()

            const file = ev.target.files[0]
            setProcessingFile(file)
            const inputChecked = radioRef?.querySelector("input[type='radio']:checked") as HTMLInputElement

            worker.postMessage({
              file,
              resolution: inputChecked.value ?? "240p"
            })

            setTimeout(() => videoContainerRef?.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            }), 200)

          }}
        />
        <RadioButton
          ref={radioRef}
          options={[
            {
              value: "240p",
              label: "240p",
              checked: true
            },
            {
              value: "360p",
              label: "360p"
            },
            {
              value: "480p",
              label: "480p"
            },
            {
              value: "720p",
              label: "720p"
            }
          ]}
          title="Resolution: "
        />

        <div
          ref={videoContainerRef}
          class={styles.videoContainer}
          style={{ opacity: processingFile() ? 1 : 0 }}
        >
          {processingFile() && (
            <div class={styles.headerVideoContainer}>
              <IconPlay width="64" height="64" />
              <div class={styles.detailsHeaderVideoContainer}>
                <h3>{processingFile()?.name}</h3>
                <h5>{formatSize(processingFile()?.size)}</h5>
              </div>
            </div>
          )}
          <canvas ref={canvasRef}></canvas>
          {timer() > 0 && (
            <p>{firstLetterUppercase(status())} {timer()}s</p>
          )}
        </div>
      </main>
    </>
  )
}

export default App
