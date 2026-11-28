import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';

const directory = new URL('.', import.meta.url);
const lessons = runInNewContext(readFileSync(new URL('course-data.js', directory), 'utf8') + '\nemailLessons;');
const temporary = mkdtempSync(join(tmpdir(), 'email-voice-'));
const timing = {};

try {
    for (const lesson of lessons) {
        const cues = [];
        const narration = [];
        let samples = 0;
        for (const [, line] of lesson.cues) {
            const source = join(temporary, 'cue.aiff');
            execFileSync('say', ['-v', 'Meijia', '-r', '183', '-o', source, line]);
            const pcm = execFileSync('ffmpeg', [
                '-v', 'error', '-i', source, '-ar', '24000', '-ac', '1', '-f', 's16le', 'pipe:1'
            ]);
            if (pcm.length < 12000) throw new Error(`Missing audio for ${line}`);
            cues.push(Number((samples / 24000).toFixed(4)));
            narration.push(pcm, Buffer.alloc(2400)); // 50 ms between captions
            samples += (pcm.length + 2400) / 2;
        }
        const file = join(temporary, lesson.id + '-v1.mp3');
        execFileSync('ffmpeg', [
            '-y', '-v', 'error', '-f', 's16le', '-ar', '24000', '-ac', '1', '-i', 'pipe:0',
            '-b:a', '48k', file
        ], { input: Buffer.concat(narration) });
        timing[lesson.id] = { duration: Number((samples / 24000).toFixed(4)), cues };
        console.log(lesson.id, cues.length, timing[lesson.id].duration);
    }
    for (const lesson of lessons) {
        renameSync(join(temporary, lesson.id + '-v1.mp3'), new URL('audio/' + lesson.id + '-v1.mp3', directory));
    }
    writeFileSync(new URL('audio-timing.js', directory), 'const emailAudioTiming = ' + JSON.stringify(timing, null, 4) + ';\n');
} finally {
    rmSync(temporary, { recursive: true, force: true });
}
