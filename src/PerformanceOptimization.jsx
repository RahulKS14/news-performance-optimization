import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { sanitizeInput } from './sanitize';
import './PerformanceOptimization.css';

// Simulated default mock data for newsroom floor staff transitioning from paper/Excel
const DEFAULT_ENTRIES = [
  {
    id: 'entry-1',
    name: 'Sarah Connor',
    metric: 'Headline CTR',
    score: 88,
    notes: 'Morning breaking edition lead layout',
  },
  {
    id: 'entry-2',
    name: 'Marcus Vance',
    metric: 'Article Read-Through Rate',
    score: 92,
    notes: 'Longform investigative story formatting',
  },
  {
    id: 'entry-3',
    name: 'Elena Rostova',
    metric: 'Page Load Speed',
    score: 84,
    notes: 'Lead image compression and webp conversion',
  },
];

export const defaultApi = {
  list: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return [...DEFAULT_ENTRIES];
  },
  save: async (entry) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      ...entry,
      id: `entry-${Date.now()}`,
    };
  },
};

export default function PerformanceOptimization({ api = defaultApi }) {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    metric: '',
    score: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  const nameInputRef = useRef(null);
  const metricInputRef = useRef(null);
  const scoreInputRef = useRef(null);

  // Fetch entries from injected or default API
  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await api.list();
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      setLoadError(err?.message || 'Failed to load performance entries. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Memoized search filtering
  const filteredEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return entries;
    }
    return entries.filter((entry) => {
      const nameMatch = entry.name?.toLowerCase().includes(query);
      const metricMatch = entry.metric?.toLowerCase().includes(query);
      const notesMatch = entry.notes?.toLowerCase().includes(query);
      return nameMatch || metricMatch || notesMatch;
    });
  }, [entries, searchQuery]);

  // Memoized average score computation
  const averageScore = useMemo(() => {
    if (!filteredEntries || filteredEntries.length === 0) {
      return 0;
    }
    const total = filteredEntries.reduce((sum, item) => sum + Number(item.score || 0), 0);
    const avg = total / filteredEntries.length;
    return Number.isInteger(avg) ? avg : Number(avg.toFixed(1));
  }, [filteredEntries]);

  // Field change handler with pre-state sanitization for text inputs
  const handleInputChange = useCallback((field, rawValue) => {
    const value = field === 'score' ? rawValue : sanitizeInput(rawValue);
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear field-specific error as user edits
    setErrors((prev) => {
      if (prev[field]) {
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return prev;
    });
  }, []);

  // Search input handler with pre-state sanitization
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(sanitizeInput(e.target.value));
  }, []);

  // Retry handler for connection failure
  const handleRetry = useCallback(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Form submission handler
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setSaveError(null);

      const newErrors = {};
      const trimmedName = formData.name.trim();
      const trimmedMetric = formData.metric.trim();
      const scoreValue = formData.score.trim();

      if (!trimmedName || trimmedName.length < 2) {
        newErrors.name = 'Staff name must be at least 2 characters.';
      }

      if (!trimmedMetric) {
        newErrors.metric = 'Metric is required.';
      }

      const numericScore = Number(scoreValue);
      if (scoreValue === '' || isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
        newErrors.score = 'Score must be a number between 0 and 100.';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        // Focus first invalid field
        if (newErrors.name && nameInputRef.current) {
          nameInputRef.current.focus();
        } else if (newErrors.metric && metricInputRef.current) {
          metricInputRef.current.focus();
        } else if (newErrors.score && scoreInputRef.current) {
          scoreInputRef.current.focus();
        }
        return;
      }

      const entryToSave = {
        name: trimmedName,
        metric: trimmedMetric,
        score: numericScore,
        notes: formData.notes.trim(),
      };

      setIsLoading(true);
      try {
        const savedEntry = await api.save(entryToSave);
        setEntries((prev) => [...prev, savedEntry]);

        // Primary action telemetry
        console.log('[Analytics] User interacted with Performance Optimization');

        // Reset form on success
        setFormData({
          name: '',
          metric: '',
          score: '',
          notes: '',
        });
        setErrors({});
      } catch (err) {
        setSaveError(err?.message || 'Failed to save entry. Server unavailable.');
        // Typed values are preserved in state
      } finally {
        setIsLoading(false);
      }
    },
    [api, formData]
  );

  return (
    <main className="perf-container" aria-label="Newsroom Performance Optimization Dashboard">
      <header className="perf-header">
        <h1 className="perf-title">Performance Optimization</h1>
        <p className="perf-subtitle">
          Floor staff log for live editorial publishing, Core Web Vitals, and content benchmarks.
        </p>
      </header>

      {/* Global Status Indicator for Async Calls */}
      {isLoading && (
        <div role="status" aria-live="polite" className="perf-status-bar">
          Loading performance data...
        </div>
      )}

      {/* Connectivity Error Alert with Retry */}
      {loadError && (
        <div role="alert" className="perf-alert">
          <p className="perf-alert-text">Failed to load performance entries. {loadError}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="perf-btn perf-btn-secondary"
            aria-label="Retry loading performance data"
          >
            Retry
          </button>
        </div>
      )}

      {/* Save Error Alert */}
      {saveError && (
        <div role="alert" className="perf-alert">
          <p className="perf-alert-text">Failed to save performance entry: {saveError}</p>
        </div>
      )}

      {/* Data Entry Form */}
      <section className="perf-section" aria-labelledby="form-heading">
        <h2 id="form-heading" className="perf-section-title">
          Add Performance Record
        </h2>
        <form onSubmit={handleSubmit} noValidate className="perf-form">
          <div className="perf-form-grid">
            {/* Staff Name Field */}
            <div className="perf-form-group">
              <label htmlFor="staff-name" className="perf-label">
                Staff Name <span aria-hidden="true">*</span>
              </label>
              <input
                ref={nameInputRef}
                id="staff-name"
                name="staffName"
                type="text"
                autoComplete="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                aria-required="true"
                aria-invalid={errors.name ? 'true' : 'false'}
                aria-describedby={errors.name ? 'staff-name-error' : undefined}
                className={`perf-input ${errors.name ? 'perf-input-error' : ''}`}
                placeholder="e.g., Alex Rivera"
              />
              {errors.name && (
                <span id="staff-name-error" className="perf-field-error">
                  {errors.name}
                </span>
              )}
            </div>

            {/* Metric Field */}
            <div className="perf-form-group">
              <label htmlFor="metric" className="perf-label">
                Metric <span aria-hidden="true">*</span>
              </label>
              <input
                ref={metricInputRef}
                id="metric"
                name="metric"
                type="text"
                value={formData.metric}
                onChange={(e) => handleInputChange('metric', e.target.value)}
                aria-required="true"
                aria-invalid={errors.metric ? 'true' : 'false'}
                aria-describedby={errors.metric ? 'metric-error' : undefined}
                className={`perf-input ${errors.metric ? 'perf-input-error' : ''}`}
                placeholder="e.g., Article Read-Through Rate"
              />
              {errors.metric && (
                <span id="metric-error" className="perf-field-error">
                  {errors.metric}
                </span>
              )}
            </div>

            {/* Score Field */}
            <div className="perf-form-group">
              <label htmlFor="score" className="perf-label">
                Score (0-100) <span aria-hidden="true">*</span>
              </label>
              <input
                ref={scoreInputRef}
                id="score"
                name="score"
                type="number"
                min="0"
                max="100"
                value={formData.score}
                onChange={(e) => handleInputChange('score', e.target.value)}
                aria-required="true"
                aria-invalid={errors.score ? 'true' : 'false'}
                aria-describedby={errors.score ? 'score-error' : undefined}
                className={`perf-input ${errors.score ? 'perf-input-error' : ''}`}
                placeholder="0 - 100"
              />
              {errors.score && (
                <span id="score-error" className="perf-field-error">
                  {errors.score}
                </span>
              )}
            </div>

            {/* Notes Field */}
            <div className="perf-form-group perf-form-group-full">
              <label htmlFor="notes" className="perf-label">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows="2"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="perf-input perf-textarea"
                placeholder="Key observations, layout modifications, or context"
              />
            </div>
          </div>

          <div className="perf-form-actions">
            <button
              type="submit"
              disabled={isLoading}
              className="perf-btn perf-btn-primary"
            >
              Add Entry
            </button>
          </div>
        </form>
      </section>

      {/* Search and Summary Section */}
      <section className="perf-section" aria-labelledby="records-heading">
        <div className="perf-records-header">
          <div>
            <h2 id="records-heading" className="perf-section-title">
              Performance Records
            </h2>
            <p className="perf-meta-text">
              Showing {filteredEntries.length} of {entries.length} recorded entries
            </p>
          </div>

          <div className="perf-score-card">
            <span className="perf-score-card-label">Average Score</span>
            <span data-testid="average-score" className="perf-score-card-value">
              {averageScore}
            </span>
          </div>
        </div>

        {/* Search Input */}
        <div role="search" className="perf-search-wrapper">
          <label htmlFor="search-entries" className="perf-label">
            Search Entries
          </label>
          <input
            id="search-entries"
            type="search"
            role="searchbox"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by staff name, metric, or notes..."
            className="perf-input perf-search-input"
          />
        </div>

        {/* Entries Table or Empty State */}
        {filteredEntries.length === 0 ? (
          <div className="perf-empty-state" role="region" aria-label="No data message">
            <p className="perf-empty-text">No data found</p>
            <p className="perf-empty-subtext">
              {searchQuery
                ? 'Try adjusting your search criteria.'
                : 'No performance entries have been logged yet.'}
            </p>
          </div>
        ) : (
          <div className="perf-table-wrapper" tabIndex={0} aria-label="Performance records table scroll container">
            <table className="perf-table">
              <caption className="perf-visually-hidden">
                Newsroom staff performance metrics and scores
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="perf-th">
                    Staff Name
                  </th>
                  <th scope="col" className="perf-th">
                    Metric
                  </th>
                  <th scope="col" className="perf-th">
                    Score
                  </th>
                  <th scope="col" className="perf-th">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="perf-tr">
                    <td className="perf-td perf-td-strong">{entry.name}</td>
                    <td className="perf-td">{entry.metric}</td>
                    <td className="perf-td">
                      <span className="perf-score-pill">{entry.score}</span>
                    </td>
                    <td className="perf-td perf-td-notes">{entry.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

PerformanceOptimization.propTypes = {
  api: PropTypes.shape({
    list: PropTypes.func.isRequired,
    save: PropTypes.func.isRequired,
  }),
};
