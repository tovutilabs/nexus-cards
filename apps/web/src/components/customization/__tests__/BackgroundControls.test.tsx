import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BackgroundControls } from '../BackgroundControls';
import { useUpdateCardStyling } from '@/hooks/useCardStyling';

jest.mock('@/hooks/useCardStyling');

const mockUseUpdateCardStyling = useUpdateCardStyling as jest.MockedFunction<
  typeof useUpdateCardStyling
>;

describe('BackgroundControls', () => {
  let queryClient: QueryClient;

  const mockUpdateStyling = jest.fn();

  const defaultStyling = {
    backgroundType: 'solid',
    backgroundColor: '#ffffff',
    backgroundImage: null,
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    mockUseUpdateCardStyling.mockReturnValue({
      mutate: mockUpdateStyling,
      isPending: false,
      isSuccess: false,
      isError: false,
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BackgroundControls
          cardId="card-1"
          currentStyling={defaultStyling}
          userTier="PRO"
          {...props}
        />
      </QueryClientProvider>
    );
  };

  it('should render background type selector', () => {
    renderComponent();

    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    expect(screen.getByLabelText(/solid/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/gradient/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/image/i)).toBeInTheDocument();
  });

  it('should show current background type as selected', () => {
    renderComponent({ currentStyling: { ...defaultStyling, backgroundType: 'gradient' } });

    const gradientOption = screen.getByLabelText(/gradient/i) as HTMLInputElement;
    expect(gradientOption.checked).toBe(true);
  });

  it('should update background type on selection', async () => {
    renderComponent();

    const gradientOption = screen.getByLabelText(/gradient/i);
    fireEvent.click(gradientOption);

    await waitFor(() => {
      expect(mockUpdateStyling).toHaveBeenCalledWith({
        cardId: 'card-1',
        styling: expect.objectContaining({
          backgroundType: 'gradient',
        }),
      });
    });
  });

  it('should display color palette for solid backgrounds', () => {
    renderComponent();

    const colorPalette = screen.getByTestId('color-palette');
    expect(colorPalette).toBeInTheDocument();
    
    const colorButtons = screen.getAllByRole('button', { name: /select color/i });
    expect(colorButtons.length).toBeGreaterThan(10);
  });

  it('should update background color on color selection', async () => {
    renderComponent();

    const firstColorButton = screen.getAllByRole('button', { name: /select color/i })[0];
    fireEvent.click(firstColorButton);

    await waitFor(() => {
      expect(mockUpdateStyling).toHaveBeenCalled();
    });
  });

  it('should show gradient presets when gradient type selected', () => {
    renderComponent({ currentStyling: { ...defaultStyling, backgroundType: 'gradient' } });

    expect(screen.getByText(/gradient presets/i)).toBeInTheDocument();
    
    const gradientButtons = screen.getAllByRole('button', { name: /gradient/i });
    expect(gradientButtons.length).toBeGreaterThan(3);
  });

  it('should show image URL input when image type selected', () => {
    renderComponent({ currentStyling: { ...defaultStyling, backgroundType: 'image' } });

    const urlInput = screen.getByPlaceholderText(/https:\/\//i);
    expect(urlInput).toBeInTheDocument();
  });

  it('should update background image URL', async () => {
    renderComponent({ currentStyling: { ...defaultStyling, backgroundType: 'image' } });

    const urlInput = screen.getByPlaceholderText(/https:\/\//i);
    fireEvent.change(urlInput, { target: { value: 'https://example.com/bg.jpg' } });

    await waitFor(
      () => {
        expect(mockUpdateStyling).toHaveBeenCalledWith({
          cardId: 'card-1',
          styling: expect.objectContaining({
            backgroundImage: 'https://example.com/bg.jpg',
          }),
        });
      },
      { timeout: 1500 }
    );
  });

  it('should lock gradient and image for FREE tier', () => {
    renderComponent({ userTier: 'FREE' });

    const gradientOption = screen.getByLabelText(/gradient/i);
    const imageOption = screen.getByLabelText(/image/i);

    expect(gradientOption).toBeDisabled();
    expect(imageOption).toBeDisabled();
  });

  it('should show upgrade message for locked features', () => {
    renderComponent({ userTier: 'FREE' });

    expect(screen.getByText(/upgrade to pro/i)).toBeInTheDocument();
  });

  it('should allow gradient for PRO tier', () => {
    renderComponent({ userTier: 'PRO' });

    const gradientOption = screen.getByLabelText(/gradient/i);
    expect(gradientOption).not.toBeDisabled();
  });

  it('should allow image for PRO tier', () => {
    renderComponent({ userTier: 'PRO' });

    const imageOption = screen.getByLabelText(/image/i);
    expect(imageOption).not.toBeDisabled();
  });

  it('should debounce image URL changes', async () => {
    jest.useFakeTimers();
    renderComponent({ currentStyling: { ...defaultStyling, backgroundType: 'image' } });

    const urlInput = screen.getByPlaceholderText(/https:\/\//i);
    
    fireEvent.change(urlInput, { target: { value: 'https://example.com/bg1.jpg' } });
    expect(mockUpdateStyling).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(mockUpdateStyling).toHaveBeenCalledTimes(1);
    });

    jest.useRealTimers();
  });

  it('should validate image URL format', async () => {
    renderComponent({ currentStyling: { ...defaultStyling, backgroundType: 'image' } });

    const urlInput = screen.getByPlaceholderText(/https:\/\//i);
    fireEvent.change(urlInput, { target: { value: 'not-a-url' } });

    await waitFor(() => {
      expect(screen.getByText(/invalid url/i)).toBeInTheDocument();
    });
  });

  it('should show current background color as selected', () => {
    renderComponent({ currentStyling: { ...defaultStyling, backgroundColor: '#3b82f6' } });

    const selectedColor = screen.getByTestId('selected-color-indicator');
    expect(selectedColor).toHaveStyle({ backgroundColor: '#3b82f6' });
  });

  it('should show loading state during update', () => {
    mockUseUpdateCardStyling.mockReturnValue({
      mutate: mockUpdateStyling,
      isPending: true,
      isSuccess: false,
      isError: false,
    } as any);

    renderComponent();

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should show error message on update failure', () => {
    mockUseUpdateCardStyling.mockReturnValue({
      mutate: mockUpdateStyling,
      isPending: false,
      isSuccess: false,
      isError: true,
      error: new Error('Update failed'),
    } as any);

    renderComponent();

    expect(screen.getByText(/failed to update/i)).toBeInTheDocument();
  });
});
