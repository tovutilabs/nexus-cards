import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CustomCssEditor } from '../CustomCssEditor';
import { useUpdateCardCustomCss } from '@/hooks/useCardStyling';

jest.mock('@/hooks/useCardStyling');

const mockUseUpdateCardCustomCss = useUpdateCardCustomCss as jest.MockedFunction<
  typeof useUpdateCardCustomCss
>;

describe('CustomCssEditor', () => {
  let queryClient: QueryClient;

  const mockUpdateCustomCss = jest.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    mockUseUpdateCardCustomCss.mockReturnValue({
      mutate: mockUpdateCustomCss,
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
        <CustomCssEditor
          cardId="card-1"
          currentCustomCss=""
          userTier="PREMIUM"
          {...props}
        />
      </QueryClientProvider>
    );
  };

  it('should render CSS editor with textarea', () => {
    renderComponent();

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
  });

  it('should show current CSS in editor', () => {
    const customCss = '.card { background-color: red; }';
    renderComponent({ currentCustomCss: customCss });

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe(customCss);
  });

  it('should update CSS on input', async () => {
    renderComponent();

    const textarea = screen.getByRole('textbox');
    const newCss = '.card { color: blue; }';
    
    fireEvent.change(textarea, { target: { value: newCss } });

    await waitFor(
      () => {
        expect(mockUpdateCustomCss).toHaveBeenCalledWith({
          cardId: 'card-1',
          customCss: newCss,
        });
      },
      { timeout: 1500 }
    );
  });

  it('should show character count', () => {
    const customCss = '.card { color: red; }';
    renderComponent({ currentCustomCss: customCss });

    expect(screen.getByText(new RegExp(customCss.length.toString()))).toBeInTheDocument();
  });

  it('should show size limit', () => {
    renderComponent();

    expect(screen.getByText(/100\s*kb/i)).toBeInTheDocument();
  });

  it('should warn when approaching size limit', () => {
    const largeCss = 'a'.repeat(95 * 1024);
    renderComponent({ currentCustomCss: largeCss });

    expect(screen.getByText(/approaching limit/i)).toBeInTheDocument();
  });

  it('should error when exceeding size limit', () => {
    const tooLargeCss = 'a'.repeat(101 * 1024);
    renderComponent({ currentCustomCss: tooLargeCss });

    expect(screen.getByText(/exceeds maximum/i)).toBeInTheDocument();
  });

  it('should disable save when exceeding size limit', () => {
    const tooLargeCss = 'a'.repeat(101 * 1024);
    renderComponent({ currentCustomCss: tooLargeCss });

    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toBeDisabled();
  });

  it('should show security notice', () => {
    renderComponent();

    expect(screen.getByText(/security/i)).toBeInTheDocument();
    expect(screen.getByText(/sanitized/i)).toBeInTheDocument();
  });

  it('should show CSS syntax guidelines', () => {
    renderComponent();

    expect(screen.getByText(/guidelines/i)).toBeInTheDocument();
  });

  it('should show example CSS patterns', () => {
    renderComponent();

    const expandButton = screen.getByRole('button', { name: /examples/i });
    fireEvent.click(expandButton);

    expect(screen.getByText(/\.card/)).toBeInTheDocument();
  });

  it('should debounce CSS input', async () => {
    jest.useFakeTimers();
    renderComponent();

    const textarea = screen.getByRole('textbox');
    
    fireEvent.change(textarea, { target: { value: '.card { color: red; }' } });
    expect(mockUpdateCustomCss).not.toHaveBeenCalled();

    fireEvent.change(textarea, { target: { value: '.card { color: blue; }' } });
    expect(mockUpdateCustomCss).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(mockUpdateCustomCss).toHaveBeenCalledTimes(1);
      expect(mockUpdateCustomCss).toHaveBeenCalledWith({
        cardId: 'card-1',
        customCss: '.card { color: blue; }',
      });
    });

    jest.useRealTimers();
  });

  it('should show loading state during save', () => {
    mockUseUpdateCardCustomCss.mockReturnValue({
      mutate: mockUpdateCustomCss,
      isPending: true,
      isSuccess: false,
      isError: false,
    } as any);

    renderComponent();

    expect(screen.getByTestId('saving-indicator')).toBeInTheDocument();
  });

  it('should show success message after save', () => {
    mockUseUpdateCardCustomCss.mockReturnValue({
      mutate: mockUpdateCustomCss,
      isPending: false,
      isSuccess: true,
      isError: false,
    } as any);

    renderComponent();

    expect(screen.getByText(/saved/i)).toBeInTheDocument();
  });

  it('should show error message on save failure', () => {
    mockUseUpdateCardCustomCss.mockReturnValue({
      mutate: mockUpdateCustomCss,
      isPending: false,
      isSuccess: false,
      isError: true,
      error: { response: { data: { message: 'Invalid CSS detected' } } },
    } as any);

    renderComponent();

    expect(screen.getByText(/invalid css detected/i)).toBeInTheDocument();
  });

  it('should show specific validation errors from backend', () => {
    mockUseUpdateCardCustomCss.mockReturnValue({
      mutate: mockUpdateCustomCss,
      isPending: false,
      isSuccess: false,
      isError: true,
      error: { response: { data: { message: 'Blocked dangerous pattern: @import directive' } } },
    } as any);

    renderComponent();

    expect(screen.getByText(/@import directive/i)).toBeInTheDocument();
  });

  it('should provide reset to default button', () => {
    renderComponent({ currentCustomCss: '.card { color: red; }' });

    const resetButton = screen.getByRole('button', { name: /reset/i });
    expect(resetButton).toBeInTheDocument();
  });

  it('should clear CSS on reset', async () => {
    renderComponent({ currentCustomCss: '.card { color: red; }' });

    const resetButton = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(mockUpdateCustomCss).toHaveBeenCalledWith({
        cardId: 'card-1',
        customCss: '',
      });
    });
  });

  it('should lock editor for non-PREMIUM users', () => {
    renderComponent({ userTier: 'PRO' });

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
    expect(screen.getByText(/premium/i)).toBeInTheDocument();
  });

  it('should show upgrade message for non-PREMIUM users', () => {
    renderComponent({ userTier: 'FREE' });

    expect(screen.getByText(/upgrade to premium/i)).toBeInTheDocument();
  });

  it('should allow editing for PREMIUM users', () => {
    renderComponent({ userTier: 'PREMIUM' });

    const textarea = screen.getByRole('textbox');
    expect(textarea).not.toBeDisabled();
  });

  it('should show dangerous pattern warnings', async () => {
    renderComponent();

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: '@import url("malicious.css");' } });

    await waitFor(() => {
      expect(screen.getByText(/not allowed/i)).toBeInTheDocument();
    });
  });
});
