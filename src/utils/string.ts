export function firstLetterUppercase(val?: string) {
    if (!val)
        return ""

    const [first, ...rest] = val
    return `${first.toUpperCase()}${rest.join("")}`
}