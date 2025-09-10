'use client'

import React from 'react'

type Props = { children: React.ReactNode }
type State = { hasError: boolean }

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    try {
      const payload = {
        message: error.message,
        stack: error.stack,
        context: { source: 'react-error-boundary', componentStack: info.componentStack },
        level: 'error',
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      }
      if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
        navigator.sendBeacon('/api/client-logs', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
      }
    } catch {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="bg-secondary/20 border border-border rounded p-6">
            <h2 className="gothic-heading text-bone text-2xl mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">An unexpected error occurred. Please try reloading the page.</p>
            <button className="px-4 py-2 bg-accent text-accent-foreground rounded" onClick={() => location.reload()}>
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

