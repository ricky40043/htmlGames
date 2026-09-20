(async () => {
    document.querySelector('.sim-start')?.click();
    document.querySelector('.sim-add-users').click();
    document.querySelector('[data-cohort-count]').value = 5;
    document.querySelector('[data-cohort-weak]').click();
    // Split immediately, before staggered sends: membership must be captured at launch.
    await new Promise(resolve => setTimeout(resolve, 5000));
    const remaining = document.querySelectorAll('.sim-token-ambient').length;
    if (remaining !== 5) throw Error(`Expected five weak transfers still running; got ${remaining}`);
    return { normalCompleted: 5, weakStillTransferring: remaining };
})()
