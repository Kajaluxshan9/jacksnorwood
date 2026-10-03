import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MotionGlobalConfig } from 'framer-motion';

// Framer's AnimatePresence uses mode="wait": the outgoing slide must finish
// animating before the next one mounts. Those animations are driven by
// requestAnimationFrame, which fake timers freeze, so without this the panel
// would appear stuck and every rotation assertion would fail for the wrong
// reason. Skipping animations makes transitions resolve immediately.
MotionGlobalConfig.skipAnimations = true;

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
  // Noon EST on Monday 5 Jan 2026, given as a UTC instant.
  // `new Date(2026, 0, 5)` would be local midnight on the machine running the
  // test, which is a different weekday in Norwood - the very confusion the
  // restaurant-clock helpers exist to remove.
  const monday = new Date('2026-01-05T17:00:00Z');

  it('puts events before specials — events are time-sensitive', () => {
    const slides = buildSlides([event()], [daily()], monday);
    expect(slides.map((s) => s.kind)).toEqual(['event', 'special']);
  });

  it('shows a readable date and time for an event, without shifting the day', () => {
    const [slide] = buildSlides([event({ date: '2030-05-10', time: '20:00:00' })], [], monday);
    // Built from local date parts, so it must not land on the 9th.
    expect(slide.date).toContain('10');
    // 12-hour for customers: "20:00" reads as a typo on a pub website.
    expect(slide.time).toBe('8:00 PM');
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

describe('automatic rotation', () => {
  const two = [event(), event({ id: 2, title: 'Trivia Tuesday' })];

  const advance = async (ms) => {
    await act(async () => { vi.advanceTimersByTime(ms); });
  };

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    sessionStorage.clear();
    eventAPI.getUpcoming.mockResolvedValue({ data: two });
    promotionAPI.getActive.mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.style.overflow = '';
  });

  it('moves to the next item after 10 seconds', async () => {
    await show();
    await waitFor(() => expect(screen.getByText('Live Music Friday')).toBeTruthy());

    await advance(9000);
    expect(screen.getByText('Live Music Friday')).toBeTruthy(); // not yet

    await advance(1500);
    await waitFor(() => expect(screen.getByText('Trivia Tuesday')).toBeTruthy());
  });

  it('wraps around to the first item', async () => {
    await show();
    await waitFor(() => expect(screen.getByText('Live Music Friday')).toBeTruthy());

    await advance(10500);
    await waitFor(() => expect(screen.getByText('Trivia Tuesday')).toBeTruthy());
    await advance(10500);
    await waitFor(() => expect(screen.getByText('Live Music Friday')).toBeTruthy());
  });

  it('pauses while the pointer rests on the panel', async () => {
    await show();
    const dialog = await waitFor(() => screen.getByRole('dialog'));
    fireEvent.mouseEnter(dialog);

    await advance(25000);

    // Nothing should move out from under someone who is reading it.
    expect(screen.getByText('Live Music Friday')).toBeTruthy();

    fireEvent.mouseLeave(dialog);
    await advance(10500);
    await waitFor(() => expect(screen.getByText('Trivia Tuesday')).toBeTruthy());
  });

  it('restarts the countdown after a manual jump', async () => {
    await show();
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());

    await advance(8000);           // 8s elapsed on item 1
    fireEvent.click(screen.getByLabelText('Next'));
    await waitFor(() => expect(screen.getByText('Trivia Tuesday')).toBeTruthy());

    await advance(8000);           // would have fired at 10s from the original start
    expect(screen.getByText('Trivia Tuesday')).toBeTruthy();

    await advance(2500);           // a full interval since the click
    await waitFor(() => expect(screen.getByText('Live Music Friday')).toBeTruthy());
  });

  it('does not rotate when there is only one item', async () => {
    eventAPI.getUpcoming.mockResolvedValue({ data: [event()] });
    await show();
    await waitFor(() => expect(screen.getByText('Live Music Friday')).toBeTruthy());

    await advance(30000);

    expect(screen.getByText('Live Music Friday')).toBeTruthy();
    expect(screen.queryByLabelText('Next')).toBeNull();
  });

  it('stops rotating once the panel is closed', async () => {
    await show();
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    await advance(30000);

    // No dialog, and crucially no timer left running against unmounted state.
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
