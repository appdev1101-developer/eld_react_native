export interface ImageUploadResponse {
    success: boolean;
    message: string;
    image_url: string;
}

export function mapImageUploadData(
    _raw: Record<string, unknown>
): ImageUploadResponse {
    return {
        success: Boolean(_raw.success),
        message: String(_raw.message ?? ''),
        image_url: String(_raw.image_url ?? ''),
    };
}