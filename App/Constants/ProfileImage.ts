import { ImageSourcePropType } from 'react-native';

export const DEFAULT_USER_AVATAR_URI =
    'https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg';

export const getUserAvatarSource = (
    avatarImage?: string | null
): ImageSourcePropType => {
    const uri = avatarImage?.trim();
    if (uri) {
        return { uri };
    }
    return { uri: DEFAULT_USER_AVATAR_URI };
};
