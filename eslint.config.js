export default [
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react: (await import("eslint-plugin-react")).default,
      "react-hooks": (await import("eslint-plugin-react-hooks")).default,
      "react-refresh": (await import("eslint-plugin-react-refresh")).default,
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
  },
];
