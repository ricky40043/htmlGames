(() => {
    'use strict';

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const effects = ['observe', 'tick', 'cover', 'move', 'reveal', 'score', 'champion'];
    const buffers = new Map();
    const playing = new Set();
    let context;
    let master;
    let resume;
    let revision = 0;

    function audioUrl(effect) {
        return `audio/${effect}.mp3`;
    }

    function unlock() {
        if (!AudioContext || location.protocol === 'file:') return;
        if (!context) {
            context = new AudioContext();
            master = context.createGain();
            master.gain.value = .66;
            master.connect(context.destination);
            for (const effect of effects) {
                const buffer = fetch(audioUrl(effect)).then((response) => {
                    if (!response.ok) throw new Error('Sound unavailable');
                    return response.arrayBuffer();
                }).then((content) => context.decodeAudioData(content)).catch(() => null);
                buffers.set(effect, buffer);
            }
        }
        if (context.state !== 'running') resume = context.resume().catch(() => {});
    }

    async function play(effect) {
        if (!context) {
            const clip = new Audio(audioUrl(effect));
            clip.volume = .66;
            const stop = () => clip.pause();
            playing.add(stop);
            clip.addEventListener('ended', () => playing.delete(stop), { once: true });
            clip.play().catch(() => playing.delete(stop));
            return;
        }

        const currentRevision = revision;
        const [buffer] = await Promise.all([buffers.get(effect), resume]);
        if (!buffer || currentRevision !== revision || context.state !== 'running') return;

        const clip = context.createBufferSource();
        clip.buffer = buffer;
        clip.connect(master);
        const stop = () => clip.stop();
        playing.add(stop);
        clip.addEventListener('ended', () => {
            playing.delete(stop);
            clip.disconnect();
        }, { once: true });
        clip.start();
    }

    function stop() {
        revision += 1;
        playing.forEach((stopPlaying) => stopPlaying());
        playing.clear();
    }

    window.memoryChallengeSound = { unlock, play, stop };
})();
