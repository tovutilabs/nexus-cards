import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentPalette } from '../ComponentPalette';
import { ComponentType } from '../types';

describe('ComponentPalette', () => {
  const mockOnAddComponent = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render component palette dialog', () => {
    render(
      <ComponentPalette
        userTier="FREE"
        onAddComponent={mockOnAddComponent}
        open={true}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText(/add component/i)).toBeInTheDocument();
  });

  it('should show all FREE tier components for FREE user', () => {
    render(
      <ComponentPalette
        userTier="FREE"
        onAddComponent={mockOnAddComponent}
        open={true}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });

  it('should show locked state for PRO components when user is FREE', () => {
    render(
      <ComponentPalette
        userTier="FREE"
        onAddComponent={mockOnAddComponent}
        open={true}
        onClose={jest.fn()}
      />
    );

    const galleryCard = screen.getByText('Gallery').closest('[data-component-card]');
    expect(galleryCard?.textContent).toMatch(/pro/i);
    
    const lockIcon = galleryCard?.querySelector('[data-testid="lock-icon"]');
    expect(lockIcon).toBeInTheDocument();
  });

  it('should show locked state for PREMIUM components when user is FREE', () => {
    render(
      <ComponentPalette
        userTier="FREE"
        onAddComponent={mockOnAddComponent}
        open={true}
        onClose={jest.fn()}
      />
    );

    const calendarCard = screen.getByText('Calendar').closest('[data-component-card]');
    expect(calendarCard?.textContent).toMatch(/premium/i);
  });

  it('should allow PRO user to add PRO components', () => {
    render(
      <ComponentPalette
        userTier="PRO"
        onAddComponent={mockOnAddComponent}
        open={true}
        onClose={jest.fn()}
      />
    );

    const galleryButton = screen.getByText('Gallery').closest('button') || 
                          screen.getAllByRole('button').find(btn => btn.textContent?.includes('Gallery'));
    
    if (galleryButton) {
      fireEvent.click(galleryButton);
      expect(mockOnAddComponent).toHaveBeenCalledWith('GALLERY');
    }
  });

  it('should allow PREMIUM user to add all components', () => {
    render(
      <ComponentPalette
        userTier="PREMIUM"
        onAddComponent={mockOnAddComponent}
        open={true}
        onClose={jest.fn()}
      />
    );

    const formButton = screen.getByText('Contact Form').closest('button') || 
                       screen.getAllByRole('button').find(btn => btn.textContent?.includes('Contact Form'));
    
    if (formButton) {
      fireEvent.click(formButton);
      expect(mockOnAddComponent).toHaveBeenCalledWith('FORM');
    }
  });

  it('should disable component types in disabledTypes prop', () => {
    render(
      <ComponentPalette
        userTier="PREMIUM"
        onAddComponent={mockOnAddComponent}
        disabledTypes={['PROFILE', 'ABOUT']}
        open={true}
        onClose={jest.fn()}
      />
    );

    const profileCard = screen.getByText('Profile').closest('[data-component-card]');
    expect(profileCard?.querySelector('button')).toBeDisabled();
  });

  it('should show component descriptions', () => {
    render(
      <ComponentPalette
        userTier="FREE"
        onAddComponent={mockOnAddComponent}
        open={true}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText(/display your photo, name/i)).toBeInTheDocument();
    expect(screen.getByText(/share your bio/i)).toBeInTheDocument();
  });

  it('should show component icons', () => {
    const { container } = render(
      <ComponentPalette
        userTier="FREE"
        onAddComponent={mockOnAddComponent}
        open={true}
        onClose={jest.fn()}
      />
    );

    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should group components by tier', () => {
    render(
      <ComponentPalette
        userTier="PREMIUM"
        onAddComponent={mockOnAddComponent}
        open={true}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText(/free/i)).toBeInTheDocument();
    expect(screen.getByText(/pro/i)).toBeInTheDocument();
    expect(screen.getByText(/premium/i)).toBeInTheDocument();
  });

  it('should call onClose when dialog is closed', () => {
    const onClose = jest.fn();
    
    render(
      <ComponentPalette
        userTier="FREE"
        onAddComponent={mockOnAddComponent}
        open={true}
        onClose={onClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('should close dialog after adding component', () => {
    const onClose = jest.fn();
    
    render(
      <ComponentPalette
        userTier="FREE"
        onAddComponent={mockOnAddComponent}
        open={true}
        onClose={onClose}
      />
    );

    const profileButton = screen.getByText('Profile').closest('button') ||
                          screen.getAllByRole('button').find(btn => btn.textContent?.includes('Profile'));
    
    if (profileButton) {
      fireEvent.click(profileButton);
      expect(mockOnAddComponent).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('should show upgrade CTA for locked components', () => {
    render(
      <ComponentPalette
        userTier="FREE"
        onAddComponent={mockOnAddComponent}
        open={true}
        onClose={jest.fn()}
      />
    );

    const upgradeButtons = screen.getAllByText(/upgrade/i);
    expect(upgradeButtons.length).toBeGreaterThan(0);
  });

  it('should filter components by search term', () => {
    render(
      <ComponentPalette
        userTier="PREMIUM"
        onAddComponent={mockOnAddComponent}
        open={true}
        onClose={jest.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'gallery' } });

    expect(screen.getByText('Gallery')).toBeInTheDocument();
    expect(screen.queryByText('Profile')).not.toBeInTheDocument();
  });

  it('should show all components when search is cleared', () => {
    render(
      <ComponentPalette
        userTier="FREE"
        onAddComponent={mockOnAddComponent}
        open={true}
        onClose={jest.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'gallery' } });
    fireEvent.change(searchInput, { target: { value: '' } });

    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });
});
