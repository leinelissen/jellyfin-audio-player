export const lyricsMillisecondsFormat = (milliseconds: number) => {
    //  Lyrics time format is "[MM:SS]"
    //  So we created an array of 2 elements respective to minutes and seconds
    const arr = ['00','00'];

    // Since the start time in jellyfin lyrics api is in unknown format
    // we need to convert it to seconds
    let value = milliseconds / 10000000;

    // Checking if there are minutes
    // 60 seconds = 1 minute
    if (value >= 60) {
        // Getting integer minutes
        const minutes = Math.floor(value / 60);
        arr[0] = minutes < 10 ? `0${minutes}` : minutes.toString();

        // Getting the remaining seconds
        value = value % 60;
    }

    // Checking if there are seconds
    if (value > 1) {
        const seconds = Math.floor(value);
        arr[1] = seconds < 10 ? `0${seconds}` : seconds.toString();

        value -= seconds;
    }

    return arr.join(':');
};
