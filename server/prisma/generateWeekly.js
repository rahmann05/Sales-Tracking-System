import { generateWeeklySchedule } from '../src/modules/clusters/clusters.service.js';

const run = async () => {
  try {
    const actor = { role: 'ADMIN' };
    const res = await generateWeeklySchedule({ actor });
    console.log(JSON.stringify(res, null, 2));
    console.log('GENERATE_DONE generated=' + res.generated);
    process.exit(0);
  } catch (e) {
    console.error('GENERATE_FAIL', e.message);
    process.exit(1);
  }
};
run();
