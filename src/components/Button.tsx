import React, { useCallback, useState }  from 'react';
import { SvgProps } from 'react-native-svg';
import { 
    PressableProps, 
} from 'react-native';
import { THEME_COLOR } from 'CONSTANTS';
import styled, { css } from 'styled-components/native';
import useDefaultStyles from './Colors';

interface ButtonProps extends PressableProps {
    icon?: React.FC<SvgProps>;
    title: string;
}

interface PressableStyleProps {
    active: boolean;
}

const BaseButton = styled.Pressable<PressableStyleProps>`
    padding: 16px;
    border-radius: 8px;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    flex-grow: 1;

    ${props => props.active && css`
        background-color: ${THEME_COLOR};
    `}
`;

const ButtonText = styled.Text<{ active?: boolean }>`
    color: ${THEME_COLOR};
    font-weight: 600;

    ${props => props.active && css`
        color: white;
    `}
`;

export default function Button(props: ButtonProps) {
    const { icon: Icon, title, ...rest } = props;
    const defaultStyles = useDefaultStyles();
    const [isPressed, setPressed] = useState(false);
    const handlePressIn = useCallback(() => setPressed(true), []);
    const handlePressOut = useCallback(() => setPressed(false), []);

    return (
        <BaseButton
            {...rest}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            active={isPressed}
            style={[ defaultStyles.button, props.style ]}
        >
            {Icon && 
                <Icon
                    width={12}
                    height={12}
                    fill={isPressed ? '#fff' : THEME_COLOR}
                    style={{ 
                        marginRight: 8,
                    }} 
                />
            }
            <ButtonText active={isPressed}>{title}</ButtonText>
        </BaseButton>
    );
}