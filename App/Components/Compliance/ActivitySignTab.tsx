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
                descriptionText="Draw signature here"
                clearText="Clear Signature"
                confirmText="Accept"
                webStyle={`
                    body,html { height: 200px !important; }
                    .m-signature-pad--footer { padding: 0 !important; }
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
        fontSize: moderateScale(15),
        color: '#33404F',
        fontFamily: FONTS.ProductSans.regular
    },
    signature: {
        marginTop: moderateScale(10)
    }
});

