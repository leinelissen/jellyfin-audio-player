import { StackNavigationProp } from '@react-navigation/stack';

export type SettingsStackParams = {
    [key: string]: Record<string, unknown> | undefined;
    SettingList: undefined;
    Library: undefined;
    Cache: undefined;
    Sentry: undefined;
    Timer: undefined;
};

export type SettingsNavigationProp = StackNavigationProp<SettingsStackParams>; 
