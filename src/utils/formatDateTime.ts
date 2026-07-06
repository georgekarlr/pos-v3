export class FormatDateTime {
    // Add this helper function to your frontend code
    async formatLocalTimestampForDatabase(dateObject: Date) {
        if (!dateObject) return null;

        const year = dateObject.getFullYear();
        const month = String(dateObject.getMonth() + 1).padStart(2, '0');
        const day = String(dateObject.getDate()).padStart(2, '0');

        const hours = String(dateObject.getHours()).padStart(2, '0');
        const minutes = String(dateObject.getMinutes()).padStart(2, '0');
        const seconds = String(dateObject.getSeconds()).padStart(2, '0');
        const milliseconds = String(dateObject.getMilliseconds()).padStart(3, '0');

        // Returns exact local time: "YYYY-MM-DD HH:mm:ss.SSS"
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
    }
}