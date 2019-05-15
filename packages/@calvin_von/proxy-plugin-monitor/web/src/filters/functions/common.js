// formart size unit
export function unitFormat(value, type) {
    const UNITS = {
        size: ["B", "KB", "MB", "GB", "TB"],
        time: ["ms", "s"]
    }[type];

    let level = 0;
    while (value >= 1000) {
        if (level === UNITS.length) break;
        value /= 1000;
        level++;
    }
    return (
        (/\./.test(String(value)) ? Number(value).toFixed(2) : value) +
        UNITS[level]
    );
}