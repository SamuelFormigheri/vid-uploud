import { JSX } from "solid-js/jsx-runtime";
import IconUpload from "../Icons/IconUpload";
import styles from './styles.module.css';

export function FileUpload(props: JSX.InputHTMLAttributes<HTMLInputElement>) {
    return <label html-for="avatar" class={styles.button}>
        <IconUpload />
        <input
            class={styles.inputHidden}
            type="file"
            id="avatar"
            {...props}
        />
        Select videos to upload
    </label>
}