# Conference deadlines

Calendar feeds for paper, poster, volunteer, travel-grant and review dates across security & privacy, HCI, information science and AI/ML conferences (Nov 2026 – Dec 2027).

Dates marked tentative are placeholders carried over from the 2026 cycle. Confirm them on the official call. Deadlines are 11:59 pm AoE unless a venue says otherwise.

## Subscribe

Subscribing keeps your calendar in sync when the dates here change.

| Calendar | Feed |
| --- | --- |
| Everything | `https://curlyprat.github.io/conference-deadlines/ics/all.ics` |
| One conference or program | `https://curlyprat.github.io/conference-deadlines/ics/<name>.ics` (see the [`ics`](ics) folder, for example `chi.ics`, `neurips.ics`, `gary-marsden-travel-awards.ics`) |

- **Google Calendar:** Other calendars → **+** → **From URL**, paste the feed link.
- **Apple Calendar:** File → **New Calendar Subscription**, paste the feed link.
- **Outlook:** Add calendar → **Subscribe from web**, paste the feed link.

To import once instead of subscribing, download any `.ics` file from the `ics` folder and open it.

## How it's built

`deadlines.html` is the calendar page's source and holds the data. `scripts/build-ics.js` reads it and writes the feeds:

```sh
node scripts/build-ics.js deadlines.html ics
```

Event IDs are stable, so a subscribed calendar updates events in place rather than duplicating them.
