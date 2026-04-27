'use client';

import { BProgress } from '@bprogress/core';
import { GeneralSettings } from '@/types/settingsTypes';
import { ProgressProvider } from '@bprogress/next/app';
import { useEffect } from 'react';
import { useStore } from './store.provider';

const Providers = ({ children }: { children: React.ReactNode }) => {
    const { settingsStore } = useStore()
    const { primaryColor } = settingsStore.generalSettings as GeneralSettings;

    useEffect(() => {
        if (!settingsStore.generalSettings && !settingsStore.isLoading) {
            settingsStore.fetchGeneralSettings()
        }
    }, [settingsStore])

    return (
        <ProgressProvider
            height="4px"
            color={primaryColor}
            options={{ showSpinner: true }}
            shallowRouting
        >
            {children}
        </ProgressProvider>
    );
};

export default Providers;