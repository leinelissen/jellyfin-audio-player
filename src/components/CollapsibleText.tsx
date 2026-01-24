import React, { useCallback, useState } from 'react';
import { View, ViewProps } from 'react-native';
import styled from 'styled-components/native';

import useDefaultStyles from '@/components/Colors';
import { Paragraph, Text } from '@/components/Typography';

interface CollapsibleTextProps {
    text: string;
    closedLines?: number;
    openLines?: number;
    style?: ViewProps['style'];
}

const ShowMoreButton = styled.TouchableOpacity`
    align-items: center;
    padding: 8px;
    margin-top: 4px;
`;

const ShowMoreText = styled(Text)`
    font-size: 12px;
    opacity: 0.5;
`;

const CollapsibleText: React.FC<CollapsibleTextProps> = ({
    text,
    closedLines = 4,
    openLines = 0,
    style,
}) => {
    const defaultStyles = useDefaultStyles();
    const [isOpen, setIsOpen] = useState(false);

    const toggleOpen = useCallback(() => {
        setIsOpen(!isOpen);
    }, [isOpen]);

    return (
        <View style={[{ width: '100%' }, style]}>
            <Paragraph
                numberOfLines={isOpen ? openLines : closedLines}
                ellipsizeMode="tail"
                style={defaultStyles.textSmall}
            >{text}</Paragraph>
            <ShowMoreButton onPress={toggleOpen}>
                <ShowMoreText style={defaultStyles.text}>
                    {isOpen ? 'Show less' : 'Show more'}
                </ShowMoreText>
            </ShowMoreButton>
        </View>
    );
};

export default CollapsibleText;
