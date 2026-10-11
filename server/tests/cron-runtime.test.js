import test from 'node:test';
import assert from 'node:assert/strict';
import cron from 'node-cron';

test('installed cron schedules actual application expressions in WIB without running business jobs', async () => {
  for (const [expression, expectedHour] of [['0 * * * *', null], ['*/5 * * * *', null], ['0 3 * * *', 3]]) {
    let calls = 0;
    const task = cron.createTask(expression, () => { calls++; }, {timezone: 'Asia/Jakarta'});
    try {
      assert.equal(task.getStatus(), 'stopped');
      task.start();
      const next = task.getNextRun();
      assert.ok(next > new Date());
      const wib = new Date(+next + 7 * 3600000);
      assert.equal(wib.getUTCSeconds(), 0);
      assert.equal(wib.getUTCMinutes() % (expression.startsWith('*/5') ? 5 : 60), 0);
      if (expectedHour !== null) assert.equal(wib.getUTCHours(), expectedHour);
      task.stop();
      assert.equal(calls, 0);
      await task.execute();
      assert.equal(calls, 1);
    } finally { task.destroy(); }
    assert.equal(task.getStatus(), 'destroyed');
  }
});
