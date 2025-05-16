import { readFileSync, writeFileSync } from 'fs';
import { isRushHour, SampleAnalysis } from './shared';

const INPUT = './sample_data.json';
(() => {
    const json: SampleAnalysis[] = JSON.parse(readFileSync(INPUT, 'utf-8'));

    let data = [];
    let columns = ['Route', 'Timestamp', 'Date', 'Time', 'IsRushHour', 'LateMinutes', 'LateSeconds'];

    data.push(columns.join(','));

    for (const analysis of json) {
        const values = [
            analysis.rawData.route_id,
            analysis.timestamp,
            new Date(analysis.timestamp).toLocaleString('en-US', {
                timeZone: 'America/New_York',
            }),
            isRushHour(new Date(analysis.timestamp)),
            analysis.lateness_minutes,
            analysis.lateness_seconds,
        ];
        data.push(values.join(','));
    }

    writeFileSync('./sample_data.csv', data.join('\n'));
})();
