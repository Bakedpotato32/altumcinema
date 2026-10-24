// Subtitle parser for .srt and .vtt formats with dynamic offset calculation and dialogue search
export const parseSubtitles = (rawContent) => {
  if (!rawContent || typeof rawContent !== 'string') return [];

  const normalized = rawContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\n+/);
  const cues = [];

  const timeToSeconds = (timeStr) => {
    const parts = timeStr.trim().split(':');
    let hours = 0, minutes = 0, seconds = 0;

    if (parts.length === 3) {
      hours = parseFloat(parts[0]);
      minutes = parseFloat(parts[1]);
      seconds = parseFloat(parts[2].replace(',', '.'));
    } else if (parts.length === 2) {
      minutes = parseFloat(parts[0]);
      seconds = parseFloat(parts[1].replace(',', '.'));
    }
    return hours * 3600 + minutes * 60 + seconds;
  };

  for (let block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 2) continue;

    let timeLineIndex = lines.findIndex((l) => l.includes('-->'));
    if (timeLineIndex === -1) continue;

    const [startStr, endStr] = lines[timeLineIndex].split('-->');
    if (!startStr || !endStr) continue;

    const startTime = timeToSeconds(startStr);
    const endTime = timeToSeconds(endStr.split(' ')[0]);

    const textLines = lines.slice(timeLineIndex + 1);
    const text = textLines
      .join('\n')
      .replace(/<[^>]+>/g, '') // Strip HTML tags
      .trim();

    if (text && !isNaN(startTime) && !isNaN(endTime)) {
      cues.push({ startTime, endTime, text });
    }
  }

  return cues.sort((a, b) => a.startTime - b.startTime);
};

export const getActiveCue = (cues, currentTimeSeconds, offsetMs = 0) => {
  if (!cues || cues.length === 0) return '';
  const adjustedTime = currentTimeSeconds - (offsetMs / 1000);
  const active = cues.find((c) => adjustedTime >= c.startTime && adjustedTime <= c.endTime);
  return active ? active.text : '';
};

// Search dialogue lines across all subtitle cues
export const searchSubtitles = (cues, query) => {
  if (!cues || !query || query.trim() === '') return [];
  const cleanQ = query.toLowerCase().trim();
  return cues.filter((cue) => cue.text.toLowerCase().includes(cleanQ));
};
