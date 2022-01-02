import React, { useCallback, useState }  from 'react';
import { SvgProps } from 'react-native-svg';
import { 
    PressableProps, ViewProps, View,
} from 'react-native';
import { THEME_COLOR } from 'CONSTANTS';
import styled, { css } from 'styled-components/native';
import useDefaultStyles from './Colors';

interface ButtonProps extends PressableProps {
    icon?: React.FC<SvgProps>;
    title: string;
    style?: ViewProps['style'];
}

const BaseButton = styled.Pressable`
    padding: 16px;
    border-radius: 8px;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    flex-grow: 1;
`;

const ButtonText = styled.Text<{ active?: boolean }>`
    color: ${THEME_COLOR};
    font-weight: 600;

    ${props => props.active && css`
        color: white;
    `}
`;

const Button = React.forwardRef<View, ButtonProps>(function Button(props, ref) {
    const { icon: Icon, title, ...rest } = props;
    const defaultStyles = useDefaultStyles();
    const [isPressed, setPressed] = useState(false);
    const handlePressIn = useCallback(() => setPressed(true), []);
    const handlePressOut = useCallback(() => setPressed(false), []);

    return (
        <BaseButton
            {...rest}
            ref={ref}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[ 
                props.style, 
                { backgroundColor: isPressed ? THEME_COLOR : defaultStyles.button.backgroundColor } 
            ]}    
        >
            {Icon && 
                <Icon
                    width={14}
                    height={14}
                    fill={isPressed ? '#fff' : THEME_COLOR}
                    style={{ 
                        marginRight: 8,
                    }} 
                />
            }
            <ButtonText active={isPressed}>{title}</ButtonText>
        </BaseButton>
    );
});

export default Button;