import collection from '../../collection.json';
import { transpile } from 'postman2openapi';
import { from_openapi_to_asyncapi } from './openapi';
import { ConvertPostmanFunction } from 'interfaces';
import { PostmanToAsyncAPIOptions } from 'interfaces';

export const converters: Record<string, ConvertPostmanFunction > = {
    '3.0.0': from_postman_to_asyncapi
}

const openapi = transpile(collection);

function from_postman_to_asyncapi(postman: any ,options:PostmanToAsyncAPIOptions ={}) {
    const perspective = options.perspective;
    const openapi = transpile(postman);
    const asyncapi = from_openapi_to_asyncapi(openapi , {perspective:perspective});
    return asyncapi;
}

const output = from_postman_to_asyncapi(collection);

