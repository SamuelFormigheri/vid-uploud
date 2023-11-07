import styles from './styles.module.css'

export function Header() {
    return (
        <header class={styles.header}>
            <h1 class={styles.title}>
                vid
                <div class={styles.highlight}>uploud</div>
            </h1>
        </header>
    )
}