import { API } from '../endpoints';
import { apiUploadImageMultipart } from '../client';
import { Asset } from 'react-native-image-picker';
import { ImageUploadResponse, mapImageUploadData } from '../mappers/messagingMapper';
import { mapEmptyData, mapPassthrough } from '../mappers/dashboardMapper';


export const messagingApi = {
    
    uploadChatImage: (asset: Asset) =>
        apiUploadImageMultipart<ImageUploadResponse>(
                    'POST',
                    API.messaging.uploadChatImage(),
                    mapImageUploadData,
                    asset,
                    
                )
};