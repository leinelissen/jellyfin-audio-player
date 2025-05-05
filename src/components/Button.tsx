import React, { useCallback, useState }  from 'react';
import { SvgProps } from 'react-native-svg';
import { 
    PressableProps, ViewProps, View,
} from 'react-native';
import styled, { css } from 'styled-components/native';
import useDefaultStyles from './Colors';

type ButtonSize = 'default' | 'small';

interface ButtonProps extends PressableProps {
    icon?: React.FC<SvgProps>;
    title?: string;
    style?: ViewProps['style'];
    size?: ButtonSize;
}

const BaseButton = styled.Pressable<{ size: ButtonSize }>`
    padding: 12px;
    border-radius: 8px;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    flex-grow: 1;

    ${(props) => props.disabled && css`
        opacity: 0.25;
    `}

    ${(props) => props.size === 'small' && css`
        flex-grow: 0;
        padding: 10px;
    `}
`;

const ButtonText = styled.Text<{ active?: boolean, size: ButtonSize }>`
    font-weight: 500;
    font-size: 14px;
    flex-shrink: 1;

    ${(props) => props.size === 'small' && css`
        font-size: 12px;
    `}
`;

const Button = React.forwardRef<View, ButtonProps>(function Button(props, ref) {
    const { icon: Icon, title, disabled, size = 'default',  ...rest } = props;
    const defaultStyles = useDefaultStyles();
    const [isPressed, setPressed] = useState(false);
    const handlePressIn = useCallback(() => setPressed(true), []);
    const handlePressOut = useCallback(() => setPressed(false), []);

    return (
        <BaseButton
            {...rest}
            disabled={disabled}
            ref={ref}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[ 
                props.style, 
                { backgroundColor: isPressed
                    ? defaultStyles.activeBackground.backgroundColor 
                    : defaultStyles.button.backgroundColor 
                } 
            ]}    
            size={size}
        >
            {Icon && 
                <Icon
                    width={14}
                    height={14}
                    fill={defaultStyles.themeColor.color}
                    style={[
                        { marginRight: title ? 8 : 0 }
                    ]} 
                />
            }
            {title ? (
                <ButtonText
                    active={isPressed}
                    size={size}
                    style={defaultStyles.themeColor}
                    numberOfLines={1}
                >
                    {title}
                </ButtonText>
            ) : undefined}
        </BaseButton>
    );
});

export default Button;