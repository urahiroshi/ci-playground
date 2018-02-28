const octokit = require('@octokit/rest')();
const repoInfo = {
  owner: 'urahiroshi',
  repo: 'ci-playground',
};

async function updateAndComment({ baseBranch, pr }) {
  console.log(`Update "${pr.head.ref}" base branch "${baseBranch}" from ${pr.base.sha}`);
  // pullRequests.createComment is comment for code, it uses comment for issue
  const resMerge = await octokit.repos.merge({
    ...repoInfo,
    ...{
      base: pr.head.ref,
      head: baseBranch,
      commit_message: `Merge ${baseBranch} into branch`,
    },
  });
  const resCreateComment = await octokit.issues.createComment({
    ...repoInfo,
    ...{
      number: pr.number,
      body: 'コミットが追加されました',
    },
  });
  return resCreateComment;
}

async function showOldPRs({ baseBranch, baseSha }) {
  const resGetAll = await octokit.pullRequests.getAll({
    ...repoInfo,
    ...{ state: 'open', baseBranch },
  });
  return resGetAll.data.filter(pr => pr.base.sha !== baseSha);
}

const getEnvValues = (...keys) => {
  return keys.map(key => {
    const value = process.env[key];
    if (value == undefined) { throw new Error(`${key} is not defined`); }
    return value;
  });
};

async function main() {
  try {
    const [token, baseBranch, baseSha] = getEnvValues(
      'GITHUB_TOKEN', 'BASE_BRANCH', 'BASE_SHA'
    );
    octokit.authenticate({ type: 'token', token });
    const oldPrs = await showOldPRs({ baseBranch, baseSha });
    if (oldPrs.length === 0) {
      console.log('No PRs to be updated found.');
    } else {
      console.log(`There are ${oldPrs.length} PRs to be updated.`);
    }
    const res = await Promise.all(
      oldPrs.map(pr => updateAndComment({ baseBranch, pr }))
    );
  } catch (ex) {
    console.log(ex);
    process.exit(1);
  }
}

main().then(() => { process.exit(0); });
