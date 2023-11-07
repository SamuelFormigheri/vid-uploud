import styles from './styles.module.css'

export function RadioButton() {
    return (
        <div class={styles.gridWrapper}>
            <label for="radio-card-1" class={styles.radioCard}>
                <input type="radio" name="radio-card" id="radio-card-1" />
                <div class={styles.cardContentWrapper}>
                    <span class={styles.checkIcon}></span>
                    <div class={styles.cardContent}>
                        <img
                            src="https://image.freepik.com/free-vector/group-friends-giving-high-five_23-2148363170.jpg"
                            alt=""
                        />
                        <h4>Lorem ipsum dolor.</h4>
                        <h5>Lorem ipsum dolor sit amet, consectetur.</h5>
                    </div>
                </div>
            </label>
        </div>
    )
}