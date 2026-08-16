import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NavLink } from './NavLink';

function renderNavLink(props: Record<string, unknown> = {}) {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <NavLink to="/test" {...(props as { className?: string; activeClassName?: string })}>
        Home
      </NavLink>
    </MemoryRouter>,
  );
}

describe('NavLink', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('renders a link with the child text', () => {
    renderNavLink();
    const link = screen.getByRole('link', { name: 'Home' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
  });

  it('applies className to the anchor', () => {
    renderNavLink({ className: 'custom-class' });
    expect(screen.getByRole('link', { name: 'Home' })).toHaveClass('custom-class');
  });
});
