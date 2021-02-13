import React from 'react';
import Modal from 'components/Modal';
import Sentry from 'screens/Settings/components/Sentry';

export default function ErrorReportingPopup() {
    return (
        <Modal fullSize={false}>
            <Sentry />
        </Modal>
    );
}