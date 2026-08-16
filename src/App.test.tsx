import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('renders the DAW layout at the root route', () => {
    render(<App />);
    expect(screen.getByDisplayValue('Starter Project')).toBeInTheDocument();
    expect(screen.getByText('Tracks')).toBeInTheDocument();
  });

  it('renders the 404 page for unknown routes', () => {
    window.history.pushState({}, '', '/does-not-exist');
    render(<App />);
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Oops! Page not found')).toBeInTheDocument();
  });
});
