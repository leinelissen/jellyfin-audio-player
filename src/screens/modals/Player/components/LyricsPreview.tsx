import useDefaultStyles, { ColoredBlurView } from '@/components/Colors';
import useCurrentTrack from '@/utility/useCurrentTrack';
import styled from 'styled-components/native';
import LyricsIcon from '@/assets/icons/lyrics.svg';
import { t } from '@/localisation';
import LyricsRenderer from '../../Lyrics/components/LyricsRenderer';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { NavigationProp } from '@/screens/types';
import { LayoutChangeEvent } from 'react-native';
import { Defs, LinearGradient, Rect, Stop, Svg } from 'react-native-svg';

const Container = styled.TouchableOpacity`
    border-radius: 8px;
    margin-top: 24px;
    margin-left: -16px;
    margin-right: -16px;
    position: relative;
    overflow: hidden;
`;

const Header = styled.View`
    position: absolute;
    left: 8px;
    top: 8px;
    z-index: 3;
    border-radius: 4px;
    overflow: hidden;
`;

const HeaderInnerContainer = styled(ColoredBlurView)`
    padding: 8px;
    flex-direction: row;
    gap: 8px;
`;

const Label = styled.Text`

`;

const HeaderBackground = styled.View`
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: 60px;
    z-index: 2;
    background-color: transparent;
`;

function InnerLyricsPreview() {
    const defaultStyles = useDefaultStyles();
    const navigation = useNavigation<NavigationProp>();
    const [width, setWidth] = useState(0);

    const handleLayoutChange = useCallback((e: LayoutChangeEvent) => {
        setWidth(e.nativeEvent.layout.width);
    }, []);

    const handleShowLyrics = useCallback(() => {
        navigation.navigate('Lyrics');
    }, [navigation]);

    return (
        <Container
            style={defaultStyles.trackBackground}
            onPress={handleShowLyrics}
            onLayout={handleLayoutChange}
        >
            <Header style={defaultStyles.activeBackground}>
                <HeaderInnerContainer>
                    <LyricsIcon fill={defaultStyles.themeColor.color} />
                    <Label style={defaultStyles.themeColor}>
                        {t('lyrics')}
                    </Label>
                </HeaderInnerContainer>
            </Header>
            <HeaderBackground>
                <Svg width={width} height={60} viewBox={`0 0 ${width} 60`}>
                    <Defs>
                        <LinearGradient
                            id="lyrics-label-gradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <Stop
                                offset="0"
                                stopColor={defaultStyles.trackBackground.backgroundColor}
                                stopOpacity={1}
                            />
                            <Stop
                                offset="0.75"
                                stopColor={defaultStyles.trackBackground.backgroundColor}
                                stopOpacity={0.7}
                            />
                            <Stop
                                offset="1"
                                stopColor={defaultStyles.trackBackground.backgroundColor}
                                stopOpacity={0}
                            />
                        </LinearGradient>
                    </Defs>
                    <Rect x={0} y={0} height={60} width={width} fill="url(#lyrics-label-gradient)" />
                </Svg>
            </HeaderBackground>
            <LyricsRenderer size="small" />
        </Container>
    );
}

/**
 * A wrapper for LyricsPreview, so we only render the component if the current
 * track has lyrics.
 */
export default function LyricsPreview() {
    const { albumTrack } = useCurrentTrack();

    if (!albumTrack?.HasLyrics) {
        return null;
    }

    return (
        <InnerLyricsPreview />
    );
}