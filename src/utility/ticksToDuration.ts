function ticksToDuration(ticks: number) {
    const seconds = Math.round(ticks / 10000000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    return `${hours > 0 ? hours + ':' : ''}${(minutes % 60).toString().padStart(hours > 0 ? 2 : 0, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}

export default ticksToDuration;