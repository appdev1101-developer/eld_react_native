interface BaseRes {
    status: 'success' | 'failure';
    message: string;
    error?: string;
    statusCode: number;
}

export type Res<T = Record<string, any>> = BaseRes & T;