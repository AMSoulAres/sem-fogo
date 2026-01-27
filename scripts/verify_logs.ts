
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min: number, max: number, decimals: number = 1) => {
    const str = (Math.random() * (max - min) + min).toFixed(decimals);
    return parseFloat(str);
};

console.log("Simulating log generation...");

for (let i = 0; i < 20; i++) {
    // Simulate variety in fire probability
    let probability: number;
    if (Math.random() > 0.8) {
        probability = getRandomInt(20, 100);
    } else {
        probability = getRandomInt(0, 15);
    }

    // Varied camera telemetry
    const angleH = getRandomInt(0, 360);
    const angleV = getRandomInt(-45, 45);
    const zoom = getRandomFloat(1, 10, 1);

    console.log(`Run ${i + 1}: Prob=${probability}, AngleH=${angleH}, AngleV=${angleV}, Zoom=${zoom}`);

    if (probability < 0 || probability > 100) console.error("Probability out of range!");
    if (angleH < 0 || angleH > 360) console.error("AngleH out of range!");
    if (angleV < -45 || angleV > 45) console.error("AngleV out of range!");
    if (zoom < 1 || zoom > 10) console.error("Zoom out of range!");
}
