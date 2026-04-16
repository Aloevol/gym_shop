import {IResponse} from "@/server/interface/response.interface";
import {IUser} from "@/server/models/user/user.interfce";

export const SendResponse = <T = unknown>({
    isError,
    status,
    message,
    data
}: {
    isError: boolean;
    status: number;
    message: string;
    data?: T;
}): IResponse<T> => {
    // Serialize data if it exists to ensure it's a plain object for Client Components
    const serializedData = data !== undefined ? JSON.parse(JSON.stringify(data)) : undefined;

    return {
        isError,
        status,
        message,
        data: serializedData
    };
};

// Type guard function
export function isErrorResponse(response: IUser | IResponse): response is IResponse {
    return 'isError' in response && response.isError === true;
}

export function isSuccessResponse(response: IUser | IResponse): response is IUser {
    return !isErrorResponse(response) && 'id' in response;
}