import { Header } from './components/Header'
import { FileUpload } from './components/FileUpload'
import { useClock } from './hooks/useClock'
import { IWorkerData } from './workers/processFile'
import { Canvas } from './utils/canvas'
import { downloadBlobAsFile } from './utils/blob'
import { createSignal } from 'solid-js'
import { firstLetterUppercase } from './utils/string'
import { RadioButton } from './components/RadioButton'

function App() {
  let fileUploadRef: HTMLInputElement | undefined = undefined
  let radioRef: HTMLDivElement | undefined = undefined
  let canvasRef: HTMLCanvasElement | undefined = undefined
  let renderFrame: ((frame: VideoFrame) => void) | undefined = undefined
  const [status, setStatus] = createSignal<IWorkerData["status"]>("processing")

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
        downloadBlobAsFile(ev.data.chunks ?? [], ev.data.fileName ?? "")
        break
      case "processing":
        if (renderFrame === undefined) {
          getCanvas()
          return
        }
        else if (ev.data.frame) {
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

            const inputChecked = radioRef?.querySelector("input[type='radio']:checked") as HTMLInputElement

            worker.postMessage({
              file: ev.target.files[0],
              resolution: inputChecked.value ?? "144p"
            })
          }}
        />
        <RadioButton
          ref={radioRef}
          options={[
            {
              value: "144p",
              label: "144p",
              checked: true
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
        <canvas ref={canvasRef}></canvas>
        {timer() > 0 && (
          <p>{firstLetterUppercase(status())} {timer()}</p>
        )}
      </main>
    </>
  )
}

export default App
