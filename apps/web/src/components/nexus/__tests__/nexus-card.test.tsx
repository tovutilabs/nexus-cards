import { render, screen } from '@testing-library/react';
import { NexusCard } from '../nexus-card';

describe('NexusCard', () => {
  it('should render card with title and description', () => {
    render(
      <NexusCard title="Test Card Title" description="Test card description">
        <p>Card content</p>
      </NexusCard>
    );

    expect(screen.getByText('Test Card Title')).toBeInTheDocument();
    expect(screen.getByText('Test card description')).toBeInTheDocument();
  });

  it('should render card with content', () => {
    render(
      <NexusCard>
        <p>Card content goes here</p>
      </NexusCard>
    );

    expect(screen.getByText('Card content goes here')).toBeInTheDocument();
  });

  it('should render card with footer', () => {
    render(
      <NexusCard footer={<button>Action Button</button>}>
        <p>Content</p>
      </NexusCard>
    );

    const button = screen.getByRole('button', { name: /action button/i });
    expect(button).toBeInTheDocument();
  });

  it('should render complete card structure', () => {
    render(
      <NexusCard
        title="Complete Card"
        description="This is a complete card example"
        footer={
          <>
            <button>Save</button>
            <button>Cancel</button>
          </>
        }
      >
        <p>Main content area</p>
      </NexusCard>
    );

    expect(screen.getByText('Complete Card')).toBeInTheDocument();
    expect(
      screen.getByText('This is a complete card example')
    ).toBeInTheDocument();
    expect(screen.getByText('Main content area')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <NexusCard className="custom-card-class">
        <p>Content</p>
      </NexusCard>
    );

    const card = container.firstChild;
    expect(card).toHaveClass('custom-card-class');
  });

  it('should have proper semantic structure', () => {
    const { container } = render(
      <NexusCard title="Semantic Card">
        <p>Content</p>
      </NexusCard>
    );

    // Check for proper div structure with rounded corners and border
    const card = container.firstChild;
    expect(card).toHaveClass('rounded-lg');
    expect(card).toHaveClass('border');
  });

  it('should render nested elements correctly', () => {
    render(
      <NexusCard title="Card with Icon">
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
          <li>Item 3</li>
        </ul>
      </NexusCard>
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });
});
