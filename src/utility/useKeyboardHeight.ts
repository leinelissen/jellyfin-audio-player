import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useRef, useEffect } from 'react';
import { Animated, Easing, Keyboard, KeyboardEvent } from 'react-native';

/**
 * This returns an animated height that the keyboard is poking up from the
 * bottom of the screen. This can be used to position elements to "hug" the
 * keyboard. 
 * Adapted from https://stackoverflow.com/a/65267045/3586761
 */
export const useKeyboardHeight = () => {
    const keyboardHeight = useRef(new Animated.Value(0)).current;
    const tabBarHeight = useBottomTabBarHeight();
    
    useEffect(() => {
        const keyboardWillShow = (e: KeyboardEvent) => {
            Animated.timing(keyboardHeight, {
                duration: e.duration - 20,
                toValue: tabBarHeight - e.endCoordinates.height,
                useNativeDriver: true,
                easing: Easing.ease,
            }).start();
        };
        
        const keyboardWillHide = (e: KeyboardEvent) => {
            Animated.timing(keyboardHeight, {
                duration: e.duration,
                toValue: 0,
                useNativeDriver: true,
            }).start();
        };
        
        const keyboardWillShowSub = Keyboard.addListener(
            'keyboardWillShow',
            keyboardWillShow
        );
        const keyboardWillHideSub = Keyboard.addListener(
            'keyboardWillHide',
            keyboardWillHide
        );
        
        return () => {
            keyboardWillHideSub.remove();
            keyboardWillShowSub.remove();
        };
    }, [keyboardHeight, tabBarHeight]);
    
    return keyboardHeight;
};