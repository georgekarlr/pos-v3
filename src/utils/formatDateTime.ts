export class FormatDateTime {
    /**
     * Returns the local date as "YYYY-MM-DD" (no UTC conversion).
     * Use this when you need to pass a date to the database that reflects
     * the user's local calendar day, not the UTC day.
     */
    static getLocalDateISO(date: Date = new Date()): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Returns the local date + time as "YYYY-MM-DD HH:mm:ss.SSS".
     * Use this when storing a full timestamp that must reflect the user's
     * local time zone rather than UTC.
     */
    static formatLocalTimestampForDatabase(date: Date | string = new Date()): string {
        try {
            const dateObject = new Date(date);
            if (isNaN(dateObject.getTime())) return String(date);

            const year = dateObject.getFullYear();
            const month = String(dateObject.getMonth() + 1).padStart(2, '0');
            const day = String(dateObject.getDate()).padStart(2, '0');

            const hours = String(dateObject.getHours()).padStart(2, '0');
            const minutes = String(dateObject.getMinutes()).padStart(2, '0');
            const seconds = String(dateObject.getSeconds()).padStart(2, '0');
            const milliseconds = String(dateObject.getMilliseconds()).padStart(3, '0');

            // Returns exact local time: "YYYY-MM-DD HH:mm:ss.SSS"
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
        } catch {
            return String(date);
        }
    }
}