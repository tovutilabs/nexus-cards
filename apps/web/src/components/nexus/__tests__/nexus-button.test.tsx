import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NexusButton } from '../nexus-button';

describe('NexusButton', () => {
  it('should render with text content', () => {
    render(<NexusButton>Click Me</NexusButton>);

    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(<NexusButton onClick={handleClick}>Click Me</NexusButton>);

    const button = screen.getByRole('button', { name: /click me/i });
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<NexusButton disabled>Disabled Button</NexusButton>);

    const button = screen.getByRole('button', { name: /disabled button/i });
    expect(button).toBeDisabled();
  });

  it('should not call onClick when disabled', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(
      <NexusButton disabled onClick={handleClick}>
        Disabled Button
      </NexusButton>
    );

    const button = screen.getByRole('button', { name: /disabled button/i });
    await user.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should apply variant styles', () => {
    const { rerender } = render(
      <NexusButton variant="primary">Primary</NexusButton>
    );
    let button = screen.getByRole('button');
    expect(button.className).toContain('bg-nexus-blue');

    rerender(<NexusButton variant="danger">Danger</NexusButton>);
    button = screen.getByRole('button');
    expect(button.className).toContain('bg-nexus-red');

    rerender(<NexusButton variant="outline">Outline</NexusButton>);
    button = screen.getByRole('button');
    expect(button.className).toContain('border');

    rerender(<NexusButton variant="ghost">Ghost</NexusButton>);
    button = screen.getByRole('button');
    expect(button.className).toContain('hover:bg');
  });

  it('should apply size styles', () => {
    const { rerender } = render(
      <NexusButton size="default">Default Size</NexusButton>
    );
    let button = screen.getByRole('button');
    expect(button.className).toContain('h-10');

    rerender(<NexusButton size="sm">Small</NexusButton>);
    button = screen.getByRole('button');
    expect(button.className).toContain('h-9');

    rerender(<NexusButton size="lg">Large</NexusButton>);
    button = screen.getByRole('button');
    expect(button.className).toContain('h-11');

    rerender(<NexusButton size="icon">Icon</NexusButton>);
    button = screen.getByRole('button');
    expect(button.className).toContain('h-10');
    expect(button.className).toContain('w-10');
  });

  it('should support custom className', () => {
    render(<NexusButton className="custom-class">Custom Button</NexusButton>);

    const button = screen.getByRole('button');
    expect(button.className).toContain('custom-class');
  });

  it('should render as child component when asChild is true', () => {
    render(
      <NexusButton asChild>
        <a href="/test">Link Button</a>
      </NexusButton>
    );

    const link = screen.getByRole('link', { name: /link button/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
  });

  it('should be keyboard accessible', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(<NexusButton onClick={handleClick}>Keyboard Button</NexusButton>);

    const button = screen.getByRole('button');
    button.focus();
    expect(button).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);

    await user.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(2);
  });
});
