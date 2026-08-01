import React, { Component } from 'react';

/**
 * StatusMonitor (Class Component)
 * Demonstrates Class Component state & lifecycle methods:
 * - constructor
 * - componentDidMount (timer initialization & listener registration)
 * - componentDidUpdate (monitoring prop/state updates)
 * - componentWillUnmount (cleanup intervals)
 */
export class StatusMonitor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentTime: new Date().toLocaleTimeString('id-ID'),
      isOnline: navigator.onLine,
      tickCount: 0,
    };
    this.timerId = null;
  }

  componentDidMount() {
    // Start interval timer for real-time clock
    this.timerId = setInterval(this.tick, 1000);

    // Register online/offline event listeners
    window.addEventListener('online', this.handleOnlineStatus);
    window.addEventListener('offline', this.handleOnlineStatus);
  }

  componentDidUpdate(prevProps, prevState) {
    // Monitor state changes if needed for telemetry
    if (prevState.isOnline !== this.state.isOnline) {
      console.log(`[StatusMonitor] Connectivity changed: ${this.state.isOnline ? 'Online' : 'Offline'}`);
    }
  }

  componentWillUnmount() {
    // Clean up timer and event listeners
    if (this.timerId) {
      clearInterval(this.timerId);
    }
    window.removeEventListener('online', this.handleOnlineStatus);
    window.removeEventListener('offline', this.handleOnlineStatus);
  }

  tick = () => {
    this.setState((prevState) => ({
      currentTime: new Date().toLocaleTimeString('id-ID'),
      tickCount: prevState.tickCount + 1,
    }));
  };

  handleOnlineStatus = () => {
    this.setState({ isOnline: navigator.onLine });
  };

  render() {
    const { currentTime, isOnline } = this.state;
    const { label = 'WIB' } = this.props;

    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.4rem 0.85rem',
          borderRadius: '9999px',
          backgroundColor: 'var(--surface-container-low)',
          border: '1px solid var(--border-glass)',
          fontSize: '0.78rem',
          fontWeight: 600,
          color: 'var(--on-surface-variant)',
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isOnline ? 'var(--secondary)' : 'var(--error)',
            boxShadow: isOnline ? '0 0 8px var(--secondary)' : 'none',
          }}
        ></span>
        <span>{currentTime} {label}</span>
      </div>
    );
  }
}
