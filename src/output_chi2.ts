import { readFileSync, writeFileSync } from 'fs';
import { SampleAnalysis } from './types';
import { isRushHour } from './analyze';

const INPUT = './sample_data.json';

// Define lateness categories
const categorizeLateness = (latenessMinutes: number): string => {
    if (latenessMinutes <= -1) return 'Not Late';
    if (latenessMinutes <= 1) return 'On Time';
    if (latenessMinutes <= 4) return 'Slightly Late';
    if (latenessMinutes <= 9) return 'Moderately Late';
    if (latenessMinutes <= 20) return 'Extremely Late';
    return 'Outrageously Late';
};

(() => {
    const json: SampleAnalysis[] = JSON.parse(readFileSync(INPUT, 'utf-8'));

    // Initialize chi-squared table
    const chi2Table: Record<string, Record<string, number>> = {
        'Not Rush Hour': {
            'Not Late': 0,
            'On Time': 0,
            'Slightly Late': 0,
            'Moderately Late': 0,
            'Extremely Late': 0,
            'Outrageously Late': 0,
        },
        'Rush Hour': {
            'Not Late': 0,
            'On Time': 0,
            'Slightly Late': 0,
            'Moderately Late': 0,
            'Extremely Late': 0,
            'Outrageously Late': 0,
        },
    };

    // Populate the chi-squared table
    for (const sample of json) {
        const category = isRushHour(new Date(sample.timestamp)) ? 'Rush Hour' : 'Not Rush Hour';
        const latenessCategory = categorizeLateness(sample.lateness_minutes);
        chi2Table[category][latenessCategory]++;
    }

    // Convert the table to CSV format
    const headers = [
        'Category',
        'Not Late',
        'On Time',
        'Slightly Late',
        'Moderately Late',
        'Extremely Late',
        'Outrageously Late',
    ];
    const rows = [
        headers.join(','),
        `Not Rush Hour,${chi2Table['Not Rush Hour']['Not Late']},${chi2Table['Not Rush Hour']['On Time']},${chi2Table['Not Rush Hour']['Slightly Late']},${chi2Table['Not Rush Hour']['Moderately Late']},${chi2Table['Not Rush Hour']['Extremely Late']},${chi2Table['Not Rush Hour']['Outrageously Late']}`,
        `Rush Hour,${chi2Table['Rush Hour']['Not Late']},${chi2Table['Rush Hour']['On Time']},${chi2Table['Rush Hour']['Slightly Late']},${chi2Table['Rush Hour']['Moderately Late']},${chi2Table['Rush Hour']['Extremely Late']},${chi2Table['Rush Hour']['Outrageously Late']}`,
    ];

    // Write the CSV to a file
    writeFileSync('./chi2_table.csv', rows.join('\n'));
})();
