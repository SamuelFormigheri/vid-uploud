export function firstLetterUppercase(val?: string) {
    if (!val)
        return ""

    const [first, ...rest] = val
    return `${first.toUpperCase()}${rest.join("")}`
}

export function formatSize(size?: number) {
    if (!size)
        return ""

    if (size > 1e9)
        return `${size / 1e9} GB`
    if (size > 1e6)
        return `${size / 1e6} MB`

    return `${size / 1e3} KB`
}