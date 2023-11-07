import { createSignal } from "solid-js"

export function useClock() {
    const [timer, setTimer] = createSignal(0)
    let interval = 0

    const start = () => {
        setTimer(0)
        interval = setInterval(() => {
            setTimer(t => t + 1)
        }, 1000)
    }

    const stop = () => {
        clearInterval(interval)
    }

    return {
        timer,
        start,
        stop
    }
}