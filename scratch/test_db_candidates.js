const { getDashboardCategoryCandidatesDb } = require('../backend/src/modules/dashboard/dashboard.repository');

async function test() {
  try {
    console.log("Calling getDashboardCategoryCandidatesDb for SUPER_ADMIN...");
    const res = await getDashboardCategoryCandidatesDb({
      role: 'SUPER_ADMIN',
      userId: 1, // dummy user ID
      category: 'C'
    });
    console.log("Result:", res);
  } catch (error) {
    console.error("ERROR OCCURRED:", error);
  } finally {
    process.exit(0);
  }
}

test();
