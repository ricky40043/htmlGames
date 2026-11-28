import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, rename, rm, writeFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { runInNewContext } from 'node:vm';

const run = promisify(execFile);
const root = fileURLToPath(new URL('.', import.meta.url));
const cache = join(root, 'full-timing.js');
const version = 'full-v3';
const voices = { meijia: 'Meijia', reed: 'Reed (中文（台灣）)', hsiaochen: 'zh-TW-HsiaoChenNeural' };
const args = process.argv.slice(2);
const selected = new Set(args.filter(arg => !arg.startsWith('--')));
// The optional --hsiaochen recording uses the same edge-tts engine as the hotel course.
const selectedVoices = args.includes('--hsiaochen') ? ['hsiaochen'] : ['meijia', 'reed'];
const edgeTts = process.env.EMAIL_EDGE_TTS_BIN || 'edge-tts';
const edgeRate = process.env.EMAIL_EDGE_TTS_RATE || '-5%';
const files = (await readdir(join(root, 'lessons'))).filter(name => name.endsWith('.js')).sort();
const source = (await Promise.all(files.map(name => readFile(join(root, 'lessons', name), 'utf8')))).join('\n');
const chapters = runInNewContext(source + '\nemailChapters;');
const temporary = await mkdtemp(join(tmpdir(), 'email-v3-'));
let timing = {};
try {
    timing = runInNewContext(await readFile(cache, 'utf8') + '\nemailFullTiming;');
} catch {}

function pronounce(text) {
    return text
        .replaceAll('TIMEUUID', 'Time U U I D')
        .replaceAll('WebSocket', 'Web Socket')
        .replaceAll('Webmail', 'Web mail')
        .replaceAll('user_id', 'user ID')
        .replace(/\b(SMTP|HTTPS|HTTP|IMAP|QPS|MIME|DNS|MX|API|PB|SPF|DKIM|DMARC|LSM|IOPS|SLA|RPO|RTO|UUID|JMAP|FBL|PII|EU|GDPR|Bcc)\b/g,
            word => word.toUpperCase().split('').join(' '));
}

async function record(voice, key, steps) {
    const rootName = voice + '-' + key;
    const jobs = new Array(steps.length);
    let next = 0;
    await Promise.all(Array.from({ length: Math.min(6, steps.length) }, async (_, worker) => {
        const online = voice === 'hsiaochen';
        const clip = join(temporary, rootName + '-' + worker + (online ? '.mp3' : '.aiff'));
        while (next < steps.length) {
            const index = next++;
            const text = pronounce(steps[index]);
            if (online) {
                const args = ['--voice', voices[voice], '--rate=' + edgeRate, '--text', text, '--write-media', clip];
                try {
                    await run(edgeTts, args, { timeout: 45000 });
                } catch {
                    await run(edgeTts, args, { timeout: 45000 });
                }
            } else {
                await run('say', ['-v', voices[voice], '-r', '165', '-o', clip, text], { timeout: 90000 });
            }
            const { stdout } = await run('ffmpeg', ['-v', 'error', '-i', clip, '-ar', '24000', '-ac', '1',
                '-f', 's16le', 'pipe:1'], { encoding: 'buffer', maxBuffer: 16 * 1024 * 1024 });
            if (stdout.length < 16000) throw new Error('Voice asset too short: ' + rootName + ' cue ' + index);
            jobs[index] = stdout;
        }
    }));
    const buffers = [];
    const starts = [];
    let samples = 0;
    for (const pcm of jobs) {
        starts.push(Number((samples / 24000).toFixed(4)));
        const pause = Buffer.alloc(4800);
        buffers.push(pcm, pause);
        samples += (pcm.length + pause.length) / 2;
    }
    const raw = join(temporary, rootName + '.pcm');
    const rendered = join(temporary, rootName + '.mp3');
    await writeFile(raw, Buffer.concat(buffers));
    await run('ffmpeg', ['-y', '-v', 'error', '-f', 's16le', '-ar', '24000', '-ac', '1',
        '-i', raw, '-b:a', '40k', rendered]);
    const media = version + '-' + rootName + '.mp3';
    await rename(rendered, join(root, 'audio', media));
    return { media, starts, duration: Number((samples / 24000).toFixed(4)) };
}

try {
    for (const chapter of chapters) {
        if (selected.size && !selected.has(chapter.id)) continue;
        const steps = chapter.scenes.flatMap(item => item.steps.map(([, text]) => text));
        const chapterTiming = timing[chapter.id] ||= {};
        for (const voice of selectedVoices) {
            const profile = voice === 'hsiaochen' ? version + ':' + edgeRate : version;
            const hash = createHash('sha256').update(profile + '\n' + steps.join('\n')).digest('hex').slice(0, 16);
            const previous = chapterTiming[voice];
            const alreadyRecorded = previous?.hash === hash && await stat(join(root, 'audio', previous.media))
                .then(file => file.size > 10000, () => false);
            if (alreadyRecorded) continue;
            chapterTiming[voice] = { ...await record(voice, chapter.id, steps), hash };
            await writeFile(cache, 'const emailFullTiming = ' + JSON.stringify(timing, null, 4) + ';\n');
            console.log(chapter.id, voice, steps.length, chapterTiming[voice].duration);
        }
    }
} finally {
    await rm(temporary, { recursive: true, force: true });
}
