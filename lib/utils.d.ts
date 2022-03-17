import type { AsyncAPIDocument } from "./interfaces";
export declare function serializeInput(document: string | AsyncAPIDocument): {
    format: 'json' | 'yaml';
    document: AsyncAPIDocument;
} | never;
export declare function eventToChannel(event: any): {
    publish: any;
    subscribe: any;
};
export declare function streamToChannel(stream: any): {
    publish: any;
    subscribe: any;
};
export declare function objectToSchema(obj: Record<string, unknown>): {
    type: string;
    properties: {
        [x: string]: unknown;
    };
};
export declare function dotsToSlashes(topic: string): string;
export declare function convertMessage(message: any): void;
