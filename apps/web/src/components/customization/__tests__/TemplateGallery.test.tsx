import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TemplateGallery } from '../TemplateGallery';
import { useTemplates, useApplyTemplate } from '@/hooks/useTemplates';
import { SubscriptionTier } from '@nexus-cards/shared';

jest.mock('@/hooks/useTemplates');

const mockUseTemplates = useTemplates as jest.MockedFunction<typeof useTemplates>;
const mockUseApplyTemplate = useApplyTemplate as jest.MockedFunction<typeof useApplyTemplate>;

describe('TemplateGallery', () => {
  let queryClient: QueryClient;

  const mockTemplates = [
    {
      id: 'template-1',
      name: 'Modern Professional',
      slug: 'modern-professional',
      category: 'professional',
      minTier: SubscriptionTier.FREE,
      isActive: true,
      isArchived: false,
      previewImageUrl: '/templates/modern-professional.jpg',
      config: {},
    },
    {
      id: 'template-2',
      name: 'Creative Portfolio',
      slug: 'creative-portfolio',
      category: 'creative',
      minTier: SubscriptionTier.PRO,
      isActive: true,
      isArchived: false,
      previewImageUrl: '/templates/creative-portfolio.jpg',
      config: {},
    },
    {
      id: 'template-3',
      name: 'Executive Premium',
      slug: 'executive-premium',
      category: 'professional',
      minTier: SubscriptionTier.PREMIUM,
      isActive: true,
      isArchived: false,
      previewImageUrl: '/templates/executive-premium.jpg',
      config: {},
    },
  ];

  const mockApplyTemplate = jest.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    mockUseTemplates.mockReturnValue({
      data: mockTemplates,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    mockUseApplyTemplate.mockReturnValue({
      mutate: mockApplyTemplate,
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
        <TemplateGallery
          cardId="card-1"
          currentTier={SubscriptionTier.FREE}
          onTemplateApplied={jest.fn()}
          {...props}
        />
      </QueryClientProvider>
    );
  };

  it('should render template gallery with templates', () => {
    renderComponent();

    expect(screen.getByText('Modern Professional')).toBeInTheDocument();
    expect(screen.getByText('Creative Portfolio')).toBeInTheDocument();
    expect(screen.getByText('Executive Premium')).toBeInTheDocument();
  });

  it('should show lock icon for templates above user tier', () => {
    renderComponent({ currentTier: SubscriptionTier.FREE });

    const proTemplate = screen.getByText('Creative Portfolio').closest('div');
    const premiumTemplate = screen.getByText('Executive Premium').closest('div');

    expect(proTemplate?.querySelector('[data-testid="lock-icon"]')).toBeInTheDocument();
    expect(premiumTemplate?.querySelector('[data-testid="lock-icon"]')).toBeInTheDocument();
  });

  it('should allow applying template for accessible tier', async () => {
    renderComponent({ currentTier: SubscriptionTier.FREE });

    const applyButton = screen.getAllByRole('button', { name: /apply/i })[0];
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockApplyTemplate).toHaveBeenCalledWith({
        cardId: 'card-1',
        templateId: 'template-1',
      });
    });
  });

  it('should disable apply button for locked templates', () => {
    renderComponent({ currentTier: SubscriptionTier.FREE });

    const buttons = screen.getAllByRole('button', { name: /apply|upgrade/i });
    
    const proTemplateButton = buttons.find((btn) =>
      btn.closest('[data-template-id="template-2"]')
    );
    
    expect(proTemplateButton).toBeDisabled();
  });

  it('should show loading state while fetching templates', () => {
    mockUseTemplates.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as any);

    renderComponent();

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should show error state on fetch failure', () => {
    mockUseTemplates.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to fetch templates'),
    } as any);

    renderComponent();

    expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
  });

  it('should filter templates by category', () => {
    renderComponent();

    const categoryFilter = screen.getByRole('combobox', { name: /category/i });
    fireEvent.change(categoryFilter, { target: { value: 'professional' } });

    expect(screen.getByText('Modern Professional')).toBeInTheDocument();
    expect(screen.getByText('Executive Premium')).toBeInTheDocument();
    expect(screen.queryByText('Creative Portfolio')).not.toBeInTheDocument();
  });

  it('should call onTemplateApplied callback after successful application', async () => {
    const onTemplateApplied = jest.fn();
    mockUseApplyTemplate.mockReturnValue({
      mutate: mockApplyTemplate,
      isPending: false,
      isSuccess: true,
      isError: false,
    } as any);

    renderComponent({ onTemplateApplied });

    await waitFor(() => {
      expect(onTemplateApplied).toHaveBeenCalled();
    });
  });

  it('should show PRO tier requirement badge', () => {
    renderComponent({ currentTier: SubscriptionTier.FREE });

    const proTemplate = screen.getByText('Creative Portfolio').closest('[data-template-card]');
    expect(proTemplate?.textContent).toMatch(/pro/i);
  });

  it('should show PREMIUM tier requirement badge', () => {
    renderComponent({ currentTier: SubscriptionTier.FREE });

    const premiumTemplate = screen.getByText('Executive Premium').closest('[data-template-card]');
    expect(premiumTemplate?.textContent).toMatch(/premium/i);
  });

  it('should display template preview images', () => {
    renderComponent();

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(3);
    expect(images[0]).toHaveAttribute('src', '/templates/modern-professional.jpg');
  });
});
