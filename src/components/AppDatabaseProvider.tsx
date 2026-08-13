import React, { PropsWithChildren, useEffect, useState } from 'react';
import { captureException } from '@sentry/react-native';
import { initialiseDatabase } from '@/store';
import AppLoading from './AppLoading';

export default function AppDatabaseProvider({ children }: PropsWithChildren<{}>) {
    const [hasMigratedDatabase, setHasMigratedDatabase] = useState(false);

    useEffect(() => {
        initialiseDatabase()
            .then(() => {
                setHasMigratedDatabase(true);
            })
            .catch((e: unknown) => {
                console.error(e);
                captureException(e);
                // Allow the app to continue even if migrations fail, so the
                // error surfaces naturally rather than being a blank screen.
                setHasMigratedDatabase(true);
            });
    }, []);

    if (!hasMigratedDatabase) {
        return <AppLoading />;
    }

    return children;
}
