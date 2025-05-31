export type ImageFormat = 'jpeg' | 'jpg' | 'png' | 'gif' | 'webp' | 'animatedGif' | 'animatedWebp';

export type ImageLoader = () => Promise<Response>;

interface ImageGroups {
    small: Record<ImageFormat, ImageLoader>;
    medium: Record<ImageFormat, ImageLoader>;
    large: Record<ImageFormat, ImageLoader>;
}

const createImageRecord = (size: string) => {
    const formats = [
        {key: 'jpeg', ext: 'jpeg', name: 'pixelift'},
        {key: 'jpg', ext: 'jpg', name: 'pixelift'},
        {key: 'png', ext: 'png', name: 'pixelift'},
        {key: 'gif', ext: 'gif', name: 'pixelift'},
        {key: 'webp', ext: 'webp', name: 'pixelift'},
        {key: 'animatedGif', ext: 'gif', name: 'pixelift-animated'},
        {key: 'animatedWebp', ext: 'webp', name: 'pixelift-animated'},
    ];

    return formats.reduce((record, {key, ext, name}) => {
        record[key as ImageFormat] = () => fetch(new URL(`./${size}/${name}.${ext}`, import.meta.url));
        return record;
    }, {} as Record<ImageFormat, ImageLoader>);

};

export const testImageGroups: ImageGroups = {
    small: createImageRecord('small'),
    medium: createImageRecord('medium'),
    large: createImageRecord('large'),
};


export interface ImageLoaders {
    response: ImageLoader;
    blob: () => Promise<Blob>;
    arrayBuffer: () => Promise<ArrayBuffer>;
    stream: () => Promise<ReadableStream<Uint8Array> | null>;
}

export function makeLoaders(baseLoader: ImageLoader): ImageLoaders {
    return {
        response: baseLoader,
        blob: () => baseLoader().then((r) => r.blob()),
        arrayBuffer: () => baseLoader().then((r) => r.arrayBuffer()),
        stream: () => baseLoader().then((r) => r.body),
    };
}
