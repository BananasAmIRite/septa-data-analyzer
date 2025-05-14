export interface Sample {
    index: number;
    route: string;
    routeIndex: number;
}

export interface SampleAnalysis {
    sample: Sample;
    rawData: any;
    lateness_seconds: number;
    lateness_minutes: number;
    timestamp: Date;
}

export interface DataSetAnalysis {
    meanSeconds: number;
    meanMinutes: number;
    medianSeconds: number;
    medianMinutes: number;
    stdSeconds: number;
    stdMinutes: number;
    n: number;
}
