import { parse, setHours, setMinutes, parseISO } from 'date-fns';

export function parseScheduleBulk(text, fallbackDate = new Date()) {
  const lines = text.split('\n');
  const tasks = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const task = parseTaskString(line, fallbackDate);
    if (task) {
      tasks.push(task);
    }
  }

  return tasks;
}

export function parseTaskString(inputStr, fallbackDate = new Date()) {
  const regex = /(\d{1,2}:\d{2}\s*[apAP][mM])\s*-\s*(\d{1,2}:\d{2}\s*[apAP][mM])\s*-\s*(.+)/;
  const match = inputStr.match(regex);
  if (!match) return null;

  const [_, startStr, endStr, title] = match;

  const parseTimeStr = (timeStr) => {
    const cleaned = timeStr.trim().replace(/\s+/g, ' ').toUpperCase();
    const timeMatch = cleaned.match(/(\d{1,2}):(\d{2})\s*([AP]M)/);
    if (!timeMatch) return null;
    let [__, hours, minutes, period] = timeMatch;
    hours = parseInt(hours, 10);
    minutes = parseInt(minutes, 10);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    // Copy fallbackDate to avoid mutation
    const d = new Date(fallbackDate.getTime());
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const startTime = parseTimeStr(startStr);
  const endTime = parseTimeStr(endStr);

  if (!startTime || !endTime) return null;

  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    done: false,
    priority: title.toLowerCase().includes('!high') ? 'high' : 'normal',
    originalString: inputStr.trim()
  };
}
