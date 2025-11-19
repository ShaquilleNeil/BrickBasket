module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "script", // Important for require()
  },
  rules: {
    "no-unused-vars": "off",
    "no-undef": "off",
  },
};
