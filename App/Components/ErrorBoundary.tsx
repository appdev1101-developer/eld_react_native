import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { logger } from '../core/logger';

type Props = {
    children: React.ReactNode;
};

type State = {
    hasError: boolean;
};

/**
 * React error boundaries only catch errors thrown during render, in
 * lifecycle methods, and in constructors of the component tree below them —
 * they do NOT catch errors in event handlers, async code, or native
 * crashes. Crashlytics' native layer already catches native/fatal crashes
 * on its own; this boundary exists specifically to catch and report JS
 * render errors that would otherwise just show React's red screen with
 * nothing reported anywhere.
 */
export class ErrorBoundary extends React.Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        logger.recordError(error, `Render error: ${info.componentStack?.slice(0, 200)}`);
    }

    handleReset = () => {
        this.setState({ hasError: false });
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Text style={styles.title}>Something went wrong</Text>
                    <Text style={styles.subtitle}>
                        The error has been reported. Please try again.
                    </Text>
                    <TouchableOpacity style={styles.button} onPress={this.handleReset}>
                        <Text style={styles.buttonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backgroundColor: '#fff'
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20
    },
    button: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#F44336',
        borderRadius: 8
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600'
    }
});