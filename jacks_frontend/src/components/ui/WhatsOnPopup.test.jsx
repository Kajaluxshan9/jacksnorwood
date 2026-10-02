import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../services/api', () => ({
  eventAPI: { getUpcoming: vi.fn() },
  promotionAPI: { getActive: vi.fn() },
  resolveImageUrl: (url, fallback) => url || fallback,
}));

const { eventAPI, promotionAPI } = await import('../../services/api');
const { default: WhatsOnPopup } = await import('./WhatsOnPopup');
const { buildSlides } = await import('./whatsOnSlides');

const event = (over = {}) => ({
  id: 1, title: 'Live Music Friday', description: 'Justin Cooper, 8pm',
  imageUrl: '/uploads/e.jpg', date: '2030-05-10', time: '20:00:00', ...over,
});
const daily = (over = {}) => ({
  id: 9, title: 'Wing Night', description: 'Half price wings',
  imageUrl: '/uploads/w.jpg', promotionType: 'DAILY', dayOfWeek: 'Monday', ...over,
});

const show = async () => {
  render(<MemoryRouter><WhatsOnPopup /></MemoryRouter>);
  // The panel is deliberately delayed so it does not fight the hero animation.
  await act(async () => { await Promise.resolve(); vi.advanceTimersByTime(1000); });
};

describe('buildSlides', () => {
  // A Monday, so the Monday special qualifies.
  const monday = new Date(2026, 0, 5);

  it('puts events before specials — events are time-sensitive', () => {
    const slides = buildSlides([event()], [daily()], monday);
    expect(slides.map((s) => s.kind)).toEqual(['event', 'special']);
  });

  it('shows a readable date and time for an event, without shifting the day', () => {
    const [slide] = buildSlides([event({ date: '2030-05-10', time: '20:00:00' })], [], monday);
    // Built from local date parts, so it must not land on the 9th.
    expect(slide.date).toContain('10');
    expect(slide.time).toBe('20:00');
  });

  it('keeps only daily specials that match today', () => {
    const slides = buildSlides([], [daily({ dayOfWeek: 'Monday' }), daily({ id: 10, dayOfWeek: 'Friday' })], monday);
    expect(slides).toHaveLength(1);
    expect(slides[0].badge).toBe('Monday Special');
  });

  it('includes a daily special with no specific day', () => {
    expect(buildSlides([], [daily({ dayOfWeek: null })], monday)).toHaveLength(1);
  });

  it('ignores one-off SPECIAL promotions — those are not "on today"', () => {
    expect(buildSlides([], [daily({ promotionType: 'SPECIAL' })], monday)).toHaveLength(0);
  });

  it('caps how much it will show', () => {
    const events = Array.from({ length: 6 }, (_, i) => event({ id: i }));
    const promos = Array.from({ length: 6 }, (_, i) => daily({ id: 100 + i }));
    expect(buildSlides(events, promos, monday)).toHaveLength(5); // 3 events + 2 specials
  });

  it('returns nothing when there is nothing on', () => {
    expect(buildSlides([], [], monday)).toHaveLength(0);
  });
});

describe('WhatsOnPopup', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    sessionStorage.clear();
    eventAPI.getUpcoming.mockResolvedValue({ data: [] });
    promotionAPI.getActive.mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.style.overflow = '';
  });

  it('renders nothing when there are no events or specials', async () => {
    await show();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows an upcoming event that was added in the admin panel', async () => {
    eventAPI.getUpcoming.mockResolvedValue({ data: [event()] });
    await show();

    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());
    expect(screen.getByText('Live Music Friday')).toBeTruthy();
    expect(screen.getByText('Upcoming Event')).toBeTruthy();
    expect(screen.getByText('See Event Details')).toBeTruthy();
  });

  it('still shows specials if the events request fails', async () => {
    eventAPI.getUpcoming.mockRejectedValue(new Error('network'));
    promotionAPI.getActive.mockResolvedValue({ data: [daily({ dayOfWeek: null })] });
    await show();

    await waitFor(() => expect(screen.getByText('Wing Night')).toBeTruthy());
  });

  it('appears only once per browsing session', async () => {
    eventAPI.getUpcoming.mockResolvedValue({ data: [event()] });
    await show();
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());

    // A second landing in the same session must stay quiet.
    await show();
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
  });

  it('locks background scrolling while open and restores it on close', async () => {
    eventAPI.getUpcoming.mockResolvedValue({ data: [event()] });
    await show();
    await waitFor(() => expect(document.body.style.overflow).toBe('hidden'));

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    await waitFor(() => expect(document.body.style.overflow).not.toBe('hidden'));
  });

  it('is announced as a modal dialog with an accessible name', async () => {
    eventAPI.getUpcoming.mockResolvedValue({ data: [event()] });
    await show();

    const dialog = await waitFor(() => screen.getByRole('dialog'));
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('whats-on-title');
  });

  it('offers navigation only when there is more than one thing on', async () => {
    eventAPI.getUpcoming.mockResolvedValue({ data: [event()] });
    await show();
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());
    expect(screen.queryByLabelText('Next')).toBeNull();
  });
});
