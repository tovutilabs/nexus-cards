import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NexusInput } from '../nexus-input';

describe('NexusInput', () => {
  it('should render input with label', () => {
    render(<NexusInput label="Email Address" />);

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  it('should handle value changes', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();

    render(<NexusInput label="Username" onChange={handleChange} />);

    const input = screen.getByLabelText(/username/i);
    await user.type(input, 'testuser');

    expect(handleChange).toHaveBeenCalled();
    expect(input).toHaveValue('testuser');
  });

  it('should display error message', () => {
    render(<NexusInput label="Email" errorText="Invalid email address" />);

    expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
  });

  it('should display helper text', () => {
    render(
      <NexusInput label="Password" helperText="Must be at least 8 characters" />
    );

    expect(
      screen.getByText(/must be at least 8 characters/i)
    ).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<NexusInput label="Disabled Input" disabled />);

    const input = screen.getByLabelText(/disabled input/i);
    expect(input).toBeDisabled();
  });

  it('should support different input types', () => {
    const { rerender } = render(<NexusInput label="Text Input" type="text" />);
    let input = screen.getByLabelText(/text input/i);
    expect(input).toHaveAttribute('type', 'text');

    rerender(<NexusInput label="Email Input" type="email" />);
    input = screen.getByLabelText(/email input/i);
    expect(input).toHaveAttribute('type', 'email');

    rerender(<NexusInput label="Password Input" type="password" />);
    input = screen.getByLabelText(/password input/i);
    expect(input).toHaveAttribute('type', 'password');

    rerender(<NexusInput label="Number Input" type="number" />);
    input = screen.getByLabelText(/number input/i);
    expect(input).toHaveAttribute('type', 'number');
  });

  it('should mark required fields', () => {
    render(<NexusInput label="Required Field" required />);

    const input = screen.getByLabelText(/required field/i);
    expect(input).toBeRequired();
  });

  it('should support placeholder text', () => {
    render(<NexusInput label="Search" placeholder="Enter search term..." />);

    const input = screen.getByPlaceholderText(/enter search term/i);
    expect(input).toBeInTheDocument();
  });

  it('should apply error styles when error is present', () => {
    const { container: _container } = render(
      <NexusInput label="Input with Error" errorText="Something went wrong" />
    );

    const input = screen.getByLabelText(/input with error/i);
    expect(input.className).toContain('border-nexus-red');
  });

  it('should support controlled input', async () => {
    const ControlledInput = () => {
      const [value, setValue] = React.useState('');
      return (
        <NexusInput
          label="Controlled"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      );
    };

    const user = userEvent.setup();
    render(<ControlledInput />);

    const input = screen.getByLabelText(/controlled/i);
    await user.type(input, 'controlled value');

    expect(input).toHaveValue('controlled value');
  });

  it('should support custom className', () => {
    render(<NexusInput label="Custom Input" className="custom-input-class" />);

    const input = screen.getByLabelText(/custom input/i);
    expect(input.className).toContain('custom-input-class');
  });

  it('should have proper ARIA attributes', () => {
    render(
      <NexusInput
        label="Accessible Input"
        errorText="This field is required"
        helperText="Helper text"
        required
      />
    );

    const input = screen.getByLabelText(/accessible input/i);
    expect(input).toHaveAttribute('aria-required', 'true');
  });

  it('should be keyboard accessible', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();

    render(<NexusInput label="Keyboard Input" onChange={handleChange} />);

    const input = screen.getByLabelText(/keyboard input/i);
    input.focus();
    expect(input).toHaveFocus();

    await user.keyboard('test');
    expect(input).toHaveValue('test');
  });
});

// Add React import for ControlledInput component
import * as React from 'react';
