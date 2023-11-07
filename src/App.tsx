import { Header } from './components/Header'
import { FileUpload } from './components/FileUpload'
import { useClock } from './hooks/useClock'
import { IWorkerData } from './workers/processFile'
import { Canvas } from './utils/canvas'
import { downloadBlobAsFile } from './utils/blob'
import { createSignal } from 'solid-js'
import { firstLetterUppercase } from './utils/string'

function App() {
  let canvasRef: HTMLCanvasElement | undefined = undefined
  let renderFrame: ((frame: VideoFrame) => void) | undefined = undefined
  const [status, setStatus] = createSignal<IWorkerData["status"]>("processing")

  function getCanvas() {
    const canvas = canvasRef?.transferControlToOffscreen()
    if (!canvas)
      return
    renderFrame = Canvas.renderFrame(canvas)
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
        break
      case "done":
        stop()
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
          onchange={(ev) => {
            if (!ev.target.files || !canvasRef)
              return

            start()

            worker.postMessage({
              file: ev.target.files[0]
            })
          }}
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
