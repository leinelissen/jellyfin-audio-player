import React from 'react';
import {TouchableOpacity} from 'react-native-gesture-handler';
import LyricsIcon from '@/assets/icons/lyrics.svg';
import styled from 'styled-components/native';
import { t } from '@/localisation';
import useDefaultStyles from '@/components/Colors.tsx';
import {useNavigation} from '@react-navigation/native';
import {NavigationProp} from '@/screens/types.ts';

const Container = styled.View`
    align-self: flex-start;
    align-items: flex-start;
    margin-top: 52px;
    padding: 8px;
    margin-left: -8px;
    flex: 0 1 auto;
    border-radius: 8px;
`;

const View = styled.View`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
`;


const Label = styled.Text`
    font-size: 13px;
`;

export default function LyricsButton() {
    // const [showLyrics, setShowLyrics] = useState(false);
    const navigation = useNavigation<NavigationProp>();

    const handleShowLyrics = () => {
        navigation.navigate('Lyrics');
    };

    // Retrieve styles
    const defaultStyles = useDefaultStyles();
    return (
        <TouchableOpacity onPress={handleShowLyrics}>
            <Container>
                <View>
                    <LyricsIcon
                        fill={defaultStyles.textHalfOpacity.color}
                    />
                    <Label style={{
                        color: defaultStyles.textHalfOpacity.color
                    }}>{t('lyrics')}</Label>
                </View>
            </Container>
        </TouchableOpacity>
    );
}
