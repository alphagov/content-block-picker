import nunjucks from "nunjucks";

const env = new nunjucks.Environment(null, {
  autoescape: true,
  throwOnUndefined: false,
});

export default env;
