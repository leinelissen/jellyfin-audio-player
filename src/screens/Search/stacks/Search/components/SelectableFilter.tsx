import useDefaultStyles from '@/components/Colors';
import { Text } from '@/components/Typography';
import { THEME_COLOR } from '@/CONSTANTS';
import React from 'react';
import { SvgProps } from 'react-native-svg';
import styled, { css } from 'styled-components/native';

const Container = styled.TouchableOpacity<{ active?: boolean }>`
    border-radius: 80px;
    padding: 6px 12px;
    margin-right: 2px;
    display: flex;
    flex-direction: row;
    align-items: center;
`;

const Label = styled(Text)<{ active?: boolean }>`
    margin-left: 6px;
    opacity: 0.5;
    
    ${(props) => props.active && css`
        opacity: 1;
        font-weight: 500;
        color: ${THEME_COLOR};
    `}
`;

interface Props {
    icon: React.FC<SvgProps>;
    text: string;
    active: boolean;
    onPress: () => void;
}

function SelectableFilter({
    icon: Icon,
    text,
    active,
    onPress,
}: Props) {
    const defaultStyles = useDefaultStyles();

    return (
        <Container
            style={[defaultStyles.filter, active ? defaultStyles.activeBackground : undefined]}
            active={active}
            onPress={onPress}
        >
            <Icon width={14} height={14} fill={active ? THEME_COLOR : defaultStyles.textHalfOpacity.color} />
            <Label active={active}>{text}</Label>
        </Container>
    );
}

export default SelectableFilter;