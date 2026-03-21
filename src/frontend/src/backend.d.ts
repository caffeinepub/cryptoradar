import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Timestamp = bigint;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Symbol = string;
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface NewsItem {
    url: string;
    title: string;
    body: string;
    publishedTime: Timestamp;
    sourceName: string;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface backendInterface {
    getNews(symbol: Symbol): Promise<Array<NewsItem>>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
}
