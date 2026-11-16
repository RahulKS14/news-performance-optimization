import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PerformanceOptimization from './PerformanceOptimization';

describe('PerformanceOptimization Component', () => {
  let mockApi;
  let consoleLogSpy;

  const sampleEntries = [
    {
      id: 'entry-1',
      name: 'Alice Cooper',
      metric: 'Article Read-Through Rate',
      score: 80,
      notes: 'Morning edition feature',
    },
    {
      id: 'entry-2',
      name: 'Bob Marley',
      metric: 'Headline CTR',
      score: 90,
      notes: 'A/B headline tested',
    },
  ];

  beforeEach(() => {
    mockApi = {
      list: vi.fn().mockResolvedValue(sampleEntries),
      save: vi.fn().mockImplementation((entry) =>
        Promise.resolve({
          ...entry,
          id: `entry-${Date.now()}`,
        })
      ),
    };
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Happy Path', () => {
    it('shows a loading indicator, then renders the list of entries and the average score', async () => {
      // Delay list response slightly to observe loading state
      let resolveList;
      mockApi.list = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveList = () => resolve(sampleEntries);
          })
      );

      render(<PerformanceOptimization api={mockApi} />);

      // Expect loading indicator with role="status"
      expect(screen.getByRole('status')).toBeInTheDocument();

      // Resolve API call
      resolveList();

      // Wait for entries to display
      await waitFor(() => {
        expect(screen.getByText('Alice Cooper')).toBeInTheDocument();
        expect(screen.getByText('Bob Marley')).toBeInTheDocument();
      });

      // Average of 80 and 90 is 85
      const averageElement = screen.getByTestId('average-score');
      expect(averageElement).toHaveTextContent(/85/);
    });

    it('submits a valid form, calls api.save, adds the new entry, updates average score, and resets form', async () => {
      const user = userEvent.setup();
      render(<PerformanceOptimization api={mockApi} />);

      await waitFor(() => {
        expect(screen.getByText('Alice Cooper')).toBeInTheDocument();
      });

      // Fill in valid form data
      const nameInput = screen.getByLabelText(/staff name/i);
      const metricInput = screen.getByLabelText(/^metric/i);
      const scoreInput = screen.getByLabelText(/score/i);
      const notesInput = screen.getByLabelText(/notes/i);
      const submitBtn = screen.getByRole('button', { name: /add entry|save entry|submit/i });

      await user.type(nameInput, 'Charlie Parker');
      await user.type(metricInput, 'Page Load Speed');
      await user.type(scoreInput, '100');
      await user.type(notesInput, 'Optimized lead image compression');

      await user.click(submitBtn);

      await waitFor(() => {
        expect(mockApi.save).toHaveBeenCalledTimes(1);
      });

      expect(mockApi.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Charlie Parker',
          metric: 'Page Load Speed',
          score: 100,
          notes: 'Optimized lead image compression',
        })
      );

      // New entry appears in list
      await waitFor(() => {
        expect(screen.getByText('Charlie Parker')).toBeInTheDocument();
      });

      // Average of 80, 90, 100 is 90
      const averageElement = screen.getByTestId('average-score');
      expect(averageElement).toHaveTextContent(/90/);

      // Form values are reset
      expect(nameInput).toHaveValue('');
      expect(metricInput).toHaveValue('');
      expect(scoreInput).toHaveValue(null);
      expect(notesInput).toHaveValue('');
    });
  });

  describe('2. Empty State', () => {
    it('shows "No data found" when the initial entries list is empty (never a blank screen)', async () => {
      mockApi.list = vi.fn().mockResolvedValue([]);
      render(<PerformanceOptimization api={mockApi} />);

      await waitFor(() => {
        expect(screen.getByText(/no data found/i)).toBeInTheDocument();
      });

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      // Ensure the average displays 0 or N/A gracefully
      const averageElement = screen.getByTestId('average-score');
      expect(averageElement).toHaveTextContent(/0|n\/a/i);
    });

    it('shows "No data found" when search query yields no matches', async () => {
      const user = userEvent.setup();
      render(<PerformanceOptimization api={mockApi} />);

      await waitFor(() => {
        expect(screen.getByText('Alice Cooper')).toBeInTheDocument();
      });

      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'NonExistentStaffMember');

      expect(screen.getByText(/no data found/i)).toBeInTheDocument();
      expect(screen.queryByText('Alice Cooper')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Marley')).not.toBeInTheDocument();
    });
  });

  describe('3. Bad Connectivity', () => {
    it('shows loading indicator with role="status" during every async call', async () => {
      let resolveList;
      mockApi.list = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveList = resolve;
          })
      );

      render(<PerformanceOptimization api={mockApi} />);

      const loadingIndicator = screen.getByRole('status');
      expect(loadingIndicator).toBeInTheDocument();

      resolveList(sampleEntries);

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });

    it('shows an alert with a Retry button if initial loading fails, and recovers on retry', async () => {
      const user = userEvent.setup();
      mockApi.list = vi.fn().mockRejectedValueOnce(new Error('Network connection timeout'));

      render(<PerformanceOptimization api={mockApi} />);

      // Alert shown on failure
      const alertElement = await screen.findByRole('alert');
      expect(alertElement).toBeInTheDocument();
      expect(alertElement).toHaveTextContent(/failed to load|network connection/i);

      // Retry button exists
      const retryBtn = within(alertElement).getByRole('button', { name: /retry/i });
      expect(retryBtn).toBeInTheDocument();

      // Configure next list call to succeed
      mockApi.list.mockResolvedValueOnce(sampleEntries);

      await user.click(retryBtn);

      // Loading status should appear during retry
      expect(mockApi.list).toHaveBeenCalledTimes(2);

      // After successful retry, entries are shown and alert is cleared
      await waitFor(() => {
        expect(screen.getByText('Alice Cooper')).toBeInTheDocument();
      });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('shows an error alert and keeps typed form values if saving fails', async () => {
      const user = userEvent.setup();
      mockApi.save = vi.fn().mockRejectedValueOnce(new Error('Server unavailable'));

      render(<PerformanceOptimization api={mockApi} />);

      await waitFor(() => {
        expect(screen.getByText('Alice Cooper')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/staff name/i);
      const metricInput = screen.getByLabelText(/^metric/i);
      const scoreInput = screen.getByLabelText(/score/i);
      const notesInput = screen.getByLabelText(/notes/i);
      const submitBtn = screen.getByRole('button', { name: /add entry|save entry|submit/i });

      await user.type(nameInput, 'Diana Ross');
      await user.type(metricInput, 'Article Bounce Rate');
      await user.type(scoreInput, '75');
      await user.type(notesInput, 'Investigating mobile layout');

      await user.click(submitBtn);

      const alertElement = await screen.findByRole('alert');
      expect(alertElement).toBeInTheDocument();
      expect(alertElement).toHaveTextContent(/failed to save|server unavailable/i);

      // CRITICAL: Typed form values MUST be retained on failure
      expect(nameInput).toHaveValue('Diana Ross');
      expect(metricInput).toHaveValue('Article Bounce Rate');
      expect(scoreInput).toHaveValue(75);
      expect(notesInput).toHaveValue('Investigating mobile layout');
    });
  });

  describe('4. Invalid Input', () => {
    it('blocks submit, highlights fields with aria-invalid="true", and displays linked aria-describedby errors', async () => {
      const user = userEvent.setup();
      render(<PerformanceOptimization api={mockApi} />);

      await waitFor(() => {
        expect(screen.getByText('Alice Cooper')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/staff name/i);
      const metricInput = screen.getByLabelText(/^metric/i);
      const scoreInput = screen.getByLabelText(/score/i);
      const submitBtn = screen.getByRole('button', { name: /add entry|save entry|submit/i });

      // Click submit with empty form
      await user.click(submitBtn);

      // Submit is blocked: api.save not called
      expect(mockApi.save).not.toHaveBeenCalled();

      // Name input invalid
      expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      const nameDescribedBy = nameInput.getAttribute('aria-describedby');
      expect(nameDescribedBy).toBeTruthy();
      const nameError = document.getElementById(nameDescribedBy);
      expect(nameError).toBeInTheDocument();
      expect(nameError).toHaveTextContent(/at least 2 characters/i);

      // Metric input invalid
      expect(metricInput).toHaveAttribute('aria-invalid', 'true');
      const metricDescribedBy = metricInput.getAttribute('aria-describedby');
      expect(metricDescribedBy).toBeTruthy();
      const metricError = document.getElementById(metricDescribedBy);
      expect(metricError).toBeInTheDocument();
      expect(metricError).toHaveTextContent(/metric is required/i);

      // Score input invalid
      expect(scoreInput).toHaveAttribute('aria-invalid', 'true');
      const scoreDescribedBy = scoreInput.getAttribute('aria-describedby');
      expect(scoreDescribedBy).toBeTruthy();
      const scoreError = document.getElementById(scoreDescribedBy);
      expect(scoreError).toBeInTheDocument();
      expect(scoreError).toHaveTextContent(/between 0 and 100/i);
    });

    it('validates name length < 2 characters', async () => {
      const user = userEvent.setup();
      render(<PerformanceOptimization api={mockApi} />);

      await waitFor(() => {
        expect(screen.getByText('Alice Cooper')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/staff name/i);
      const submitBtn = screen.getByRole('button', { name: /add entry|save entry|submit/i });

      await user.type(nameInput, 'J');
      await user.click(submitBtn);

      expect(mockApi.save).not.toHaveBeenCalled();
      expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      const errorMsg = document.getElementById(nameInput.getAttribute('aria-describedby'));
      expect(errorMsg).toHaveTextContent(/at least 2 characters/i);
    });

    it('validates score range outside 0-100', async () => {
      const user = userEvent.setup();
      render(<PerformanceOptimization api={mockApi} />);

      await waitFor(() => {
        expect(screen.getByText('Alice Cooper')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/staff name/i);
      const metricInput = screen.getByLabelText(/^metric/i);
      const scoreInput = screen.getByLabelText(/score/i);
      const submitBtn = screen.getByRole('button', { name: /add entry|save entry|submit/i });

      await user.type(nameInput, 'John Doe');
      await user.type(metricInput, 'Bounce Rate');
      await user.type(scoreInput, '150');
      await user.click(submitBtn);

      expect(mockApi.save).not.toHaveBeenCalled();
      expect(scoreInput).toHaveAttribute('aria-invalid', 'true');
      const scoreError = document.getElementById(scoreInput.getAttribute('aria-describedby'));
      expect(scoreError).toHaveTextContent(/between 0 and 100/i);
    });
  });

  describe('5. Telemetry', () => {
    it('calls console.log("[Analytics] User interacted with Performance Optimization") after a successful primary action', async () => {
      const user = userEvent.setup();
      render(<PerformanceOptimization api={mockApi} />);

      await waitFor(() => {
        expect(screen.getByText('Alice Cooper')).toBeInTheDocument();
      });

      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        '[Analytics] User interacted with Performance Optimization'
      );

      const nameInput = screen.getByLabelText(/staff name/i);
      const metricInput = screen.getByLabelText(/^metric/i);
      const scoreInput = screen.getByLabelText(/score/i);
      const submitBtn = screen.getByRole('button', { name: /add entry|save entry|submit/i });

      await user.type(nameInput, 'Freddie Mercury');
      await user.type(metricInput, 'Story Velocity');
      await user.type(scoreInput, '98');

      await user.click(submitBtn);

      await waitFor(() => {
        expect(mockApi.save).toHaveBeenCalledTimes(1);
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics] User interacted with Performance Optimization'
      );
    });

    it('does NOT trigger telemetry when validation fails or saving fails', async () => {
      const user = userEvent.setup();
      mockApi.save = vi.fn().mockRejectedValueOnce(new Error('Save error'));

      render(<PerformanceOptimization api={mockApi} />);

      await waitFor(() => {
        expect(screen.getByText('Alice Cooper')).toBeInTheDocument();
      });

      const submitBtn = screen.getByRole('button', { name: /add entry|save entry|submit/i });

      // 1. Validation failure
      await user.click(submitBtn);
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        '[Analytics] User interacted with Performance Optimization'
      );

      // 2. Save failure
      const nameInput = screen.getByLabelText(/staff name/i);
      const metricInput = screen.getByLabelText(/^metric/i);
      const scoreInput = screen.getByLabelText(/score/i);

      await user.type(nameInput, 'David Bowie');
      await user.type(metricInput, 'Article Views');
      await user.type(scoreInput, '92');
      await user.click(submitBtn);

      await screen.findByRole('alert');
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        '[Analytics] User interacted with Performance Optimization'
      );
    });
  });

  describe('6. Security (Sanitization against XSS)', () => {
    it('sanitizes <script> payloads BEFORE going into state/input value', async () => {
      const user = userEvent.setup();
      render(<PerformanceOptimization api={mockApi} />);

      await waitFor(() => {
        expect(screen.getByText('Alice Cooper')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/staff name/i);

      // Paste an XSS payload containing <script> tags
      await user.click(nameInput);
      await user.paste('<script>alert("xss")</script>Jane');

      // Crucial: All tags, <, >, backticks, javascript: stripped BEFORE going into state
      expect(nameInput.value).not.toContain('<script>');
      expect(nameInput.value).not.toContain('</script>');
      expect(nameInput.value).not.toContain('<');
      expect(nameInput.value).not.toContain('>');
      expect(nameInput.value).toBe('alert("xss")Jane');
    });

    it('sanitizes <img onerror> payloads, backticks, and javascript: pseudo-protocols', async () => {
      const user = userEvent.setup();
      render(<PerformanceOptimization api={mockApi} />);

      await waitFor(() => {
        expect(screen.getByText('Alice Cooper')).toBeInTheDocument();
      });

      const notesInput = screen.getByLabelText(/notes/i);
      const metricInput = screen.getByLabelText(/^metric/i);

      // Test img tag with onerror and backtick
      await user.click(notesInput);
      await user.paste('<img src=x onerror=`alert(1)`>Clean Note');
      expect(notesInput.value).not.toContain('<img');
      expect(notesInput.value).not.toContain('<');
      expect(notesInput.value).not.toContain('>');
      expect(notesInput.value).not.toContain('`');
      expect(notesInput.value).toBe('Clean Note');

      // Test javascript: protocol
      await user.click(metricInput);
      await user.paste('javascript:alert(1)Speed');
      expect(metricInput.value).not.toContain('javascript:');
      expect(metricInput.value).toBe('alert(1)Speed');
    });

    it('submits sanitized payload to api.save', async () => {
      const user = userEvent.setup();
      render(<PerformanceOptimization api={mockApi} />);

      await waitFor(() => {
        expect(screen.getByText('Alice Cooper')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/staff name/i);
      const metricInput = screen.getByLabelText(/^metric/i);
      const scoreInput = screen.getByLabelText(/score/i);
      const notesInput = screen.getByLabelText(/notes/i);
      const submitBtn = screen.getByRole('button', { name: /add entry|save entry|submit/i });

      await user.click(nameInput);
      await user.paste('<script>Reporter</script>');
      await user.click(metricInput);
      await user.paste('Headline <test> CTR');
      await user.type(scoreInput, '88');
      await user.click(notesInput);
      await user.paste('`Important` note javascript:void(0)');

      await user.click(submitBtn);

      await waitFor(() => {
        expect(mockApi.save).toHaveBeenCalledTimes(1);
      });

      expect(mockApi.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Reporter',
          metric: 'Headline  CTR',
          score: 88,
          notes: 'Important note void(0)',
        })
      );
    });
  });
});
