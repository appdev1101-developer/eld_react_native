import React, {useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import SignatureScreen, {
    SignatureViewRef
} from 'react-native-signature-canvas';
import { Text } from 'react-native-basic-elements';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';

interface Props {
    onSignature: (signature: string) => void;
}

const ActivitySignTab : React.FC<Props> = ({ onSignature }) => {
    const signatureRef = useRef<SignatureViewRef>(null);

    return (
        <View style={styles.container}>
            <Text style={styles.description}>
                I hereby certify that my data entries and my record of
                duty status for this day are true and correct.
            </Text>

            <SignatureScreen
                ref={signatureRef}
                onOK={onSignature}
                autoClear
                descriptionText=""
                clearText="Clear"
                confirmText="Accept"
                webStyle={`
                        body,html {
                        height: 220px !important;
                        margin: 0;
                        padding: 0;
                    }
                    .m-signature-pad {
                        border: 0;
                        margin: 0;
                    }
                    .m-signature-pad--body {
                        border: none;
                    }
                    .m-signature-pad--footer {
                        display: flex !important;
                        justify-content: space-between !important;
                        align-items: center !important;
                        margin: 20px !important;
                        padding: 10px 20px !important;
                    }
                    .m-signature-pad--footer .button {
                        position: relative !important;
                        display: inline-flex !important;
                        align-items: center;
                        justify-content: center;
                        width: auto !important;
                        min-width: 90px;
                        height: 40px;
                        padding: 0 16px !important;
                        box-sizing: border-box !important;
                        font-size: 14px;
                        font-weight: 600;
                        border-radius: 6px;
                    }
                    .m-signature-pad--footer .button.clear {
                        background-color: #f0f0f0 !important;
                        color: #000000 !important;
                    }
                    .m-signature-pad--footer .button.save {
                        background-color: #2196F3 !important;
                        color: #ffffff !important;
                    }
                `}
                style={styles.signature}
            />
        </View>
    );
};


export default ActivitySignTab;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginVertical: moderateScale(15),
        marginHorizontal: moderateScale(20)
    },
    description: {
        fontSize: moderateScale(12),
        color: '#33404F',
        fontFamily: FONTS.ProductSans.regular
    },
    signature: {
        marginTop: moderateScale(10)
    }
});

