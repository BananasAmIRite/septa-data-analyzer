import { readFileSync, writeFileSync } from 'fs';
import { SampleAnalysis } from './shared';
import { Canvas } from 'skia-canvas';
import {
    BarController,
    BarElement,
    CategoryScale,
    Chart,
    LinearScale,
    LineController,
    LineElement,
    PointElement,
} from 'chart.js';
import { splitData } from './shared';

const INPUT = './sample_data.json';

Chart.register([CategoryScale, LineController, LineElement, LinearScale, PointElement, BarController, BarElement]);

const createHistogramData = (data: number[], binSize: number) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const bins = Math.ceil((max - min) / binSize);
    const labels = Array.from({ length: bins }, (_, i) => `${min + i * binSize}-${min + (i + 1) * binSize}`);
    const histogram = Array(bins).fill(0);

    data.forEach((value) => {
        const binIndex = Math.floor((value - min) / binSize);
        histogram[binIndex]++;
    });

    return { labels, histogram };
};

const createPlot = async (file: string) => {
    const json: SampleAnalysis[] = JSON.parse(readFileSync(file, 'utf-8'));
    const seconds = json.map((e) => e.lateness_seconds);
    const minutes = splitData(json).nonRushHour.map((e) => e.lateness_minutes);

    // Create histogram data
    const binSize = 5; // Adjust bin size as needed
    const { labels, histogram } = createHistogramData(minutes, binSize);

    const canvas = new Canvas(1920, 1080);

    const config = {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Lateness Histogram',
                    data: histogram,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)', // Light teal color
                    borderColor: 'rgba(75, 192, 192, 1)', // Darker teal border
                    borderWidth: 1,
                },
            ],
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Minutes Range',
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: 'Frequency',
                    },
                },
            },
        },
    };

    const chart = new Chart(
        canvas as any, // TypeScript needs "as any" here
        config as any
    );

    const pngBuffer = await canvas.toBuffer('png', { matte: 'white' });
    writeFileSync('output.png', pngBuffer);
};

(() => {
    createPlot(INPUT);
})();
