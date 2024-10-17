import { analyzeImages } from "./analyze.ts";
import { generateImages } from "./generate.ts";

if (process.argv.length !== 3) {
    console.error('Usage: node tool.ts <command>')
    process.exit(1)
}

const command = process.argv[2]

try {
    switch (command) {
        case 'analyzeImages':
            analyzeImages(
                process.env.PROMPT,
                // Split the string into an array of image URLs, while being careful to handle URLs that contain commas.
                process.env.IMAGES?.split(/(?<!\\),/).map(image => image.replace(/\\,/g, ',')),
                parseInt(process.env.MAX_TOKENS ?? '2048'),
            )
            break
        case 'generateImages':
            generateImages(
                process.env.PROMPT,
                process.env.MODEL,
                process.env.SIZE,
                process.env.QUALITY,
                parseInt(process.env.QUANTITY ?? '1'),
            )
            break
        default:
            console.error('Unknown command')
            process.exit(1)
    }

} catch (error) {
    // Print the error to stdout so that it can be captured by the GPTScript
    console.log(error)
    process.exit(1)
}
