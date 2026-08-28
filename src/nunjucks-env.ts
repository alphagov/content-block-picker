import nunjucks from "nunjucks";

const nunjucksEnv = new nunjucks.Environment(null, {
  autoescape: true,
  throwOnUndefined: false,
});

export default nunjucksEnv;
