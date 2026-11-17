export default [
    {
        // dist 是 Vite 构建产物；src 是 Vue 代码，待接入 eslint-plugin-vue 后再纳入 lint。
        ignores: ["node_modules", ".git", "dist", "src"],
    },
    {
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
        },
        rules: {
            "semi": ["error", "always"], // 强制使用分号
            "no-extra-semi": "error", // 禁止多余的分号
            "quotes": ["error", "double"], // 强制使用双引号
            "no-unused-vars": "warn", // 警告未使用的变量
            "eqeqeq": ["error", "always"], // 强制使用 === 而不是 ==
            "curly": ["error", "all"], // if 语句必须使用 {}
            "indent": ["error", 4], // 强制 4 个空格缩进
            "linebreak-style": ["error", "unix"], // 统一换行符 (LF)
            "comma-dangle": ["error", "always-multiline"], // 逗号风格
        },
    },
];
