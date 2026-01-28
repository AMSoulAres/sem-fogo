
import { formatISO, subHours, addMinutes } from 'date-fns';

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min: number, max: number, decimals: number = 1) => {
    const str = (Math.random() * (max - min) + min).toFixed(decimals);
    return parseFloat(str);
};

console.log("Simulating 24h log generation...");

const now = new Date();
let totalLogs = 0;

for (let i = 1; i <= 6; i++) {
    const id = `cam-${i}`;
    let cameraLogs = 0;

    // Generate logs for the last 24 hours with random intervals
    let currentTime = subHours(now, 24);

    while (currentTime <= now) {
        // Simulate variety in fire probability
        let probability: number;
        if (Math.random() > 0.8) {
            probability = getRandomInt(20, 100);
        } else {
            probability = getRandomInt(0, 15);
        }

        const angleH = getRandomInt(0, 180);
        const angleV = getRandomInt(-45, 45);
        const zoom = getRandomFloat(1, 10, 1);

        // Just counting and verifying ranges
        if (probability < 0 || probability > 100) console.error("Probability out of range!");
        if (angleH < 0 || angleH > 180) console.error("AngleH out of range!");
        if (angleV < -45 || angleV > 45) console.error("AngleV out of range!");
        if (zoom < 1 || zoom > 10) console.error("Zoom out of range!");

        currentTime = addMinutes(currentTime, getRandomInt(15, 45));
        cameraLogs++;
        totalLogs++;
    }
    console.log(`Camera ${id}: Generated ${cameraLogs} logs.`);
}

console.log(`Total logs generated: ${totalLogs}`);
