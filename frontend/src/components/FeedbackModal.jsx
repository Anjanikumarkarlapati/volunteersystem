/**
 * FeedbackModal.jsx
 * 3-tap emoji rating modal for post-event two-way feedback.
 * Volunteers rate the event; orgs/admins rate the volunteer.
 */
import { X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../services/api.js';
import { feedbackService } from '../services/resources.js';

const EMOJI_RATINGS = [
  { value: 1, emoji: '😞', label: 'Poor' },
  { value: 2, emoji: '😕', label: 'Below average' },
  { value: 3, emoji: '😊', label: 'Good' },
  { value: 4, emoji: '😄', label: 'Great' },
  { value: 5, emoji: '🤩', label: 'Outstanding' },
];

// Quick-tap tags per feedback type
const EVENT_TAGS = [
  'Well organised',
  'Impactful',
  'Clear instructions',
  'Great team',
  'Poor communication',
  'Too short',
  'Too long',
  'Would return',
];
const VOLUNTEER_TAGS = [
  'Punctual',
  'Hard working',
  'Team player',
  'Excellent skills',
  'Needs guidance',
  'Reliable',
  'Creative',
  'Leader',
];

export default function FeedbackModal({ item, feedbackType, onClose, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const tags = feedbackType === 'event' ? EVENT_TAGS : VOLUNTEER_TAGS;

  const toggleTag = tag => {
    setSelectedTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));
  };

  const handleSubmit = async () => {
    if (!rating) {
      toast.error('Please select a rating');
      return;
    }
    setSubmitting(true);
    try {
      await feedbackService.submit({
        attendance_id: item.attendance_id,
        rating,
        tags: selectedTags,
        comment: comment.trim() || undefined,
        feedback_type: feedbackType,
      });
      toast.success('Thank you for your feedback! 🎉');
      onSubmit?.();
      onClose();
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not submit feedback'));
    } finally {
      setSubmitting(false);
    }
  };

  const display = hovered || rating;
  const displayLabel = display ? EMOJI_RATINGS[display - 1]?.label : 'Tap to rate';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-5 animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {feedbackType === 'event' ? '⭐ Rate this event' : '⭐ Rate this volunteer'}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {feedbackType === 'event' ? item.event_title : item.volunteer_name}
            </p>
            {feedbackType === 'event' && item.organization_name && (
              <p className="text-xs text-slate-400 dark:text-slate-500">{item.organization_name}</p>
            )}
          </div>
          <button
            className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {/* Emoji rating — 3 taps */}
        <div>
          <div className="flex justify-center gap-3">
            {EMOJI_RATINGS.map(({ value, emoji, label }) => (
              <button
                key={value}
                type="button"
                aria-label={label}
                onMouseEnter={() => setHovered(value)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(value)}
                className={`flex flex-col items-center gap-1 rounded-xl p-2 transition-all hover:scale-110
                  ${
                    rating === value
                      ? 'bg-primary-50 dark:bg-primary-900/30 ring-2 ring-primary-500'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
              >
                <span
                  className={`text-3xl transition-transform ${rating === value ? 'scale-125' : ''}`}
                >
                  {emoji}
                </span>
                <span
                  className={`text-[10px] font-semibold ${rating === value ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'}`}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-center text-sm font-semibold text-primary-600 dark:text-primary-400 h-5">
            {display ? `${EMOJI_RATINGS[display - 1]?.emoji} ${displayLabel}` : ''}
          </p>
        </div>

        {/* Quick-tap tags */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Quick tags (optional)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {tags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all
                  ${
                    selectedTags.includes(tag)
                      ? 'bg-primary-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Optional comment */}
        <textarea
          className="input min-h-20 text-sm"
          placeholder="Optional comment… (stays private)"
          value={comment}
          onChange={e => setComment(e.target.value)}
          maxLength={1000}
        />

        {/* Privacy note */}
        <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
          🔒 Your feedback is private — only aggregated scores are publicly visible.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button className="btn btn-secondary flex-1" onClick={onClose} disabled={submitting}>
            Skip
          </button>
          <button
            className="btn btn-primary flex-1"
            onClick={handleSubmit}
            disabled={submitting || !rating}
          >
            {submitting ? 'Submitting…' : 'Submit feedback'}
          </button>
        </div>
      </div>
    </div>
  );
}
