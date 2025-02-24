module.exports = {
  env: {
    node: true,
    commonjs: true,
    es2021: true,
  },
  extends: [
    "eslint:recommended",
    "prettier", // 确保这是最后一项，用于覆盖冲突规则
  ],
  plugins: ["prettier"],
  rules: {
    "prettier/prettier": "error", // 将 Prettier 规则作为 ESLint 错误
    "no-console": "off", // 根据项目需要调整规则
    // 其他自定义规则...
  },
};
