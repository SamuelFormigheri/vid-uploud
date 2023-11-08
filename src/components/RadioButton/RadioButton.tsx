import { For, JSX } from 'solid-js';
import styles from './styles.module.css'

export function RadioButton({
    options,
    title,
    ...props
}: {
    options: {
        value: string;
        label: string;
        checked?: boolean;
    }[];
    title: string;
} & JSX.HTMLAttributes<HTMLDivElement>) {
    return (
        <div class={styles.gridWrapper} {...props}>
            <div class={styles.title}>{title}</div>
            <For each={options}>
                {(opt) => (
                    <label for={opt.value} class={styles.radioCard} title={opt.label}>
                        <input
                            type="radio"
                            name="radio-card"
                            id={opt.value}
                            value={opt.value}
                            checked={opt.checked}
                        />
                        <div class={styles.cardContentWrapper}>
                            <span class={styles.checkIcon}></span>
                            <div class={styles.cardContent}>
                                <h4>{opt.label}</h4>
                            </div>
                        </div>
                    </label>
                )}
            </For>
        </div>
    )
} 