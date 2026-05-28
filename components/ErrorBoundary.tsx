import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;

    const err = this.state.error;
    return (
      <View style={styles.container}>
        <Text style={styles.title}>⚠️ App Error (debug info)</Text>
        <ScrollView style={styles.scroll}>
          <Text style={styles.name} selectable>{err.name}: {err.message}</Text>
          <Text style={styles.stack} selectable>{err.stack}</Text>
        </ScrollView>
        <TouchableOpacity
          style={styles.button}
          onPress={() => this.setState({ error: null })}
        >
          <Text style={styles.buttonText}>Dismiss &amp; Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e2e',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    color: '#f38ba8',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  scroll: {
    flex: 1,
    backgroundColor: '#181825',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  name: {
    color: '#cba6f7',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  stack: {
    color: '#cdd6f4',
    fontSize: 11,
    lineHeight: 18,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#89b4fa',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#1e1e2e',
    fontWeight: '700',
    fontSize: 15,
  },
});
